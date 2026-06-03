import os
from dotenv import load_dotenv

# Muat variabel environment dari file .env
load_dotenv()

import numpy as np
import tensorflow as tf
from PIL import Image
import io
import base64
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="BananaVision API", description="AI-powered banana disease detection", version="1.0.0")


# ─────────────────────────────────────────────────────────────────
# Model configuration — switch via MODEL_TYPE env var
# Supported: "mobilenetv2" (default) or "resnet50"
# ─────────────────────────────────────────────────────────────────
MODEL_DIR = os.path.dirname(__file__)
ACTIVE_MODEL_JSON = os.path.join(MODEL_DIR, "active_model.json")

# Node.js backend URL — Python server queries this on startup to auto-recover the active model
NODE_BACKEND_URL = os.environ.get("NODE_BACKEND_URL", "https://bananavisionv3-production.up.railway.app/api").rstrip("/")

MODEL_CONFIG = {
    "mobilenetv2": {
        "path": os.path.join(MODEL_DIR, "model_mobilenetv2_final.keras"),
        "imagenet_loader": lambda: tf.keras.applications.MobileNetV2(
            weights="imagenet", include_top=True, input_shape=(224, 224, 3)
        ),
        "preprocess_input": tf.keras.applications.mobilenet_v2.preprocess_input,
        "decode_predictions": tf.keras.applications.mobilenet_v2.decode_predictions,
    },
    "resnet50": {
        "path": os.path.join(MODEL_DIR, "model_resnet50_final.keras"),
        "imagenet_loader": lambda: tf.keras.applications.ResNet50(
            weights="imagenet", include_top=True, input_shape=(224, 224, 3)
        ),
        "preprocess_input": tf.keras.applications.resnet50.preprocess_input,
        "decode_predictions": tf.keras.applications.resnet50.decode_predictions,
    },
}

# Determine default model type and path on startup
MODEL_TYPE = os.environ.get("MODEL_TYPE", "mobilenetv2").lower().strip()
ACTIVE_FILENAME = None
ACTIVE_URL = None

import json
if os.path.exists(ACTIVE_MODEL_JSON):
    try:
        with open(ACTIVE_MODEL_JSON, "r") as f:
            active_cfg = json.load(f)
            MODEL_TYPE = active_cfg.get("model_type", "mobilenetv2").lower().strip()
            ACTIVE_FILENAME = active_cfg.get("filename", None)
            ACTIVE_URL = active_cfg.get("url", None)
            print(f"📖 Loaded active model config from JSON: {ACTIVE_FILENAME} ({MODEL_TYPE})")
    except Exception as e:
        print(f"⚠️ Failed to read active_model.json: {e}. Using defaults/env.")

if MODEL_TYPE not in MODEL_CONFIG:
    MODEL_TYPE = "mobilenetv2"

_cfg = MODEL_CONFIG[MODEL_TYPE]

# Will be populated at startup
disease_model = None
imagenet_model = None


@app.on_event("startup")
async def load_model():
    global disease_model, imagenet_model, MODEL_TYPE, ACTIVE_FILENAME, ACTIVE_URL, _cfg

    # Gunakan filename aktif jika dimuat dari JSON config, jika tidak gunakan path default
    model_path = os.path.join(MODEL_DIR, ACTIVE_FILENAME) if ACTIVE_FILENAME else _cfg["path"]

    # Attempt 1: Auto-download if we already have the URL from active_model.json
    if ACTIVE_FILENAME and not os.path.exists(model_path) and ACTIVE_URL:
        import urllib.request
        print(f"\U0001f4e5 Downloading active model from saved URL: {ACTIVE_URL}...")
        try:
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            urllib.request.urlretrieve(ACTIVE_URL, model_path)
            print("\u2705 Startup download complete!")
        except Exception as e:
            print(f"\u26a0\ufe0f Failed to download from saved URL: {e}")
            model_path = _cfg["path"]

    # Attempt 2: Query Node.js backend for the active model info (handles Railway restart)
    if not os.path.exists(model_path):
        print(f"\U0001f4e1 Querying Node.js backend for active model info: {NODE_BACKEND_URL}/admin/models/active-info")
        try:
            import urllib.request as urlreq
            with urlreq.urlopen(f"{NODE_BACKEND_URL}/admin/models/active-info", timeout=15) as resp:
                data = json.loads(resp.read())
                model_info = data.get("data")
                if model_info and model_info.get("filename") and model_info.get("url"):
                    node_filename = model_info["filename"]
                    node_url = model_info["url"]
                    node_type = model_info.get("modelType", "mobilenetv2").lower()
                    print(f"\U0001f4e5 Auto-downloading active model from backend: {node_filename} @ {node_url}")
                    target_path = os.path.join(MODEL_DIR, node_filename)
                    urlreq.urlretrieve(node_url, target_path)
                    print("\u2705 Auto-download complete!")
                    # Update globals
                    ACTIVE_FILENAME = node_filename
                    ACTIVE_URL = node_url
                    if node_type in MODEL_CONFIG:
                        MODEL_TYPE = node_type
                    _cfg = MODEL_CONFIG.get(MODEL_TYPE, MODEL_CONFIG["mobilenetv2"])
                    model_path = target_path
                    # Save active_model.json for future restarts
                    with open(ACTIVE_MODEL_JSON, "w") as f:
                        json.dump({"model_type": MODEL_TYPE, "filename": ACTIVE_FILENAME, "url": ACTIVE_URL}, f)
                else:
                    print("\u2139\ufe0f Node.js backend reports no active model.")
        except Exception as e:
            print(f"\u26a0\ufe0f Could not fetch active model from Node backend: {e}")

    # If model file still doesn't exist, start in standby mode instead of crashing
    if not os.path.exists(model_path):
        print(
            f"\u26a0\ufe0f  No model file found. "
            f"Server berjalan dalam mode STANDBY \u2014 unggah dan aktifkan model melalui panel admin."
        )
        disease_model = None
        imagenet_model = None
        return

    print(f"\U0001f504 Loading disease model ({MODEL_TYPE}): {os.path.basename(model_path)}")
    disease_model = tf.keras.models.load_model(model_path)
    print(f"\u2705 Disease model loaded: {MODEL_TYPE}")

    try:
        print(f"\U0001f504 Loading ImageNet gatekeeper ({MODEL_TYPE})...")
        imagenet_model = _cfg["imagenet_loader"]()
        print(f"\u2705 ImageNet gatekeeper loaded: {MODEL_TYPE}")
    except Exception as e:
        print(f"\u26a0\ufe0f ImageNet gatekeeper failed (non-fatal): {e}")
        imagenet_model = None



# Disease mapping
DISEASE_MAP = {
    0: {'name': 'Black Sigatoka', 'category': 'Jamur', 'severity': 'Berat'},
    1: {'name': 'Bract Mosaic Virus', 'category': 'Virus', 'severity': 'Sedang'},
    2: {'name': 'Healthy Leaf', 'category': 'Sehat', 'severity': 'Ringan'},
    3: {'name': 'Insect Pest', 'category': 'Hama', 'severity': 'Sedang'},
    4: {'name': 'Moko Disease', 'category': 'Bakteri', 'severity': 'Berat'},
    5: {'name': 'Panama Disease', 'category': 'Jamur', 'severity': 'Berat'},
    6: {'name': 'Yellow Sigatoka', 'category': 'Jamur', 'severity': 'Sedang'},
}

# ─────────────────────────────────────────────────────────────────
# ImageNet plant-related keywords for the gatekeeper.
# If the top-10 ImageNet predictions contain any of these keywords
# with cumulative score >= PLANT_GATE_THRESHOLD, we allow the image.
# ─────────────────────────────────────────────────────────────────
PLANT_KEYWORDS = {
    # Direct banana/plantain keywords
    'banana', 'plantain',
    # General leaf/plant terms
    'leaf', 'leaves', 'plant', 'plants', 'foliage', 'frond', 'fronds',
    # Garden/outdoor vegetation
    'garden', 'greenhouse', 'pot', 'flower', 'herb', 'grass', 'tree',
    'palm', 'vegetation', 'jungle', 'rainforest', 'tropical', 'shrub',
    'bush', 'thicket', 'undergrowth', 'canopy', 'bough', 'twig', 'stem',
    'stalk', 'branch', 'trunk', 'bark', 'wood', 'bole',
    # Fungi/nature (common misclassifications of diseased leaves)
    'acorn', 'mushroom', 'fungus', 'ear', 'corn', 'seed',
    'hay', 'straw', 'hedge', 'lawn', 'meadow', 'rapeseed',
    # Vegetables/fruits (tropical misclassifications)
    'head_cabbage', 'broccoli', 'cauliflower', 'zucchini', 'cucumber',
    'artichoke', 'cardoon', 'bell_pepper', 'fig', 'pineapple',
    'jackfruit', 'custard_apple', 'pomegranate', 'lemon', 'orange',
    'strawberry', 'daisy', 'sunflower', 'cabbage', 'lettuce', 'spinach',
    'bok_choy', 'kohlrabi', 'spaghetti_squash', 'acorn_squash',
    # Common ImageNet labels for plant-like textures
    'pot_plant', 'house_plant', 'gyromitra', 'agaric', 'earthstar',
    'bolete', 'coral_fungus', 'hen_of_the_woods', 'earthball', 'dung',
    # Outdoor / nature scenes that might contain banana plants
    'valley', 'cliff', 'alp', 'lakeside', 'promontory', 'seashore',
    'marsh', 'mangrove',
}

# Minimum cumulative probability (%) across top-10 plant-related
# predictions to consider the image as containing a banana/plant.
# Lowered to 1.5 to be more permissive for close-up leaf textures.
PLANT_GATE_THRESHOLD = 1


ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


class PredictionRequest(BaseModel):
    image: str  # base64 encoded image

class PredictionResult(BaseModel):
    disease: str
    confidence: float

class PredictionResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None


# ─────────────────────────────────────────────────────────────────
# Image processing helpers
# ─────────────────────────────────────────────────────────────────
def open_image(image_data):
    """Open image from base64 string or PIL Image, return PIL Image in RGB."""
    if isinstance(image_data, str):
        try:
            img_bytes = base64.b64decode(image_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Format base64 tidak valid")
        try:
            img = Image.open(io.BytesIO(img_bytes))
        except Exception:
            raise HTTPException(status_code=400, detail="Data gambar tidak dapat dibaca")
    else:
        img = image_data
    return img.convert('RGB')


def preprocess_for_disease(img, target_size=(224, 224)):
    """Preprocess for the custom disease classifier (0-1 normalized)."""
    img = img.resize(target_size)
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


def preprocess_for_imagenet(img, target_size=(224, 224)):
    """
    Preprocess for the ImageNet gatekeeper model.
    Uses the correct preprocessing function for the active MODEL_TYPE
    (MobileNetV2 uses [-1, 1] range, ResNet50 uses caffe-style BGR mean subtraction).
    """
    img = img.resize(target_size)
    img_array = np.array(img, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = _cfg["preprocess_input"](img_array)
    return img_array


# ─────────────────────────────────────────────────────────────────
# Gatekeeper: validate image is banana/plant-related via ImageNet
# ─────────────────────────────────────────────────────────────────
def check_is_banana_plant(img) -> dict:
    """
    Use the ImageNet model (same architecture as the disease model) to check
    whether the image is related to banana plants / vegetation.
    Returns dict with 'is_plant' bool and diagnostic details.
    """
    img_array = preprocess_for_imagenet(img)
    preds = imagenet_model.predict(img_array, verbose=0)
    decoded = _cfg["decode_predictions"](preds, top=10)[0]

    plant_score = 0.0
    matched_labels = []

    for (_id, label, score) in decoded:
        label_lower = label.lower().replace('-', '_').replace(' ', '_')
        # Check if any plant-related keyword matches in the label
        is_match = any(kw in label_lower for kw in PLANT_KEYWORDS)

        if is_match:
            plant_score += score * 100
            matched_labels.append(f"{label} ({score*100:.1f}%)")

    return {
        'is_plant': plant_score >= PLANT_GATE_THRESHOLD,
        'plant_score': round(plant_score, 2),
        'matched_labels': matched_labels,
        'top_predictions': [
            f"{label} ({score*100:.1f}%)"
            for (_id, label, score) in decoded[:5]
        ],
    }


# ─────────────────────────────────────────────────────────────────
# Main prediction pipeline
# ─────────────────────────────────────────────────────────────────

# Jika gatekeeper menolak tapi disease model yakin di atas threshold ini,
# percayai disease model. Diturunkan ke 35.0 agar daun sehat / tekstur daun
# close-up tidak tertolak karena 7-class model memiliki baseline acak 14%.
DISEASE_OVERRIDE_THRESHOLD = 35.0  # %


def run_prediction(image_data) -> dict:
    if disease_model is None or imagenet_model is None:
        raise HTTPException(
            status_code=503,
            detail="Server AI berjalan dalam mode STANDBY. Tidak ada model aktif. Silakan unggah dan aktifkan model melalui panel admin."
        )
    """
    Two-pass prediction pipeline:

      Pass 1 — ImageNet gatekeeper:
        Cek apakah gambar mengandung tanaman/pisang berdasarkan top-10
        prediksi ImageNet. Hasilnya bersifat 'advisory', bukan hard-reject.

      Pass 2 — Disease classifier (SELALU dijalankan):
        Klasifikasi penyakit pisang oleh model khusus yang dilatih pada
        dataset daun/batang pisang — termasuk kondisi sakit parah.

      Override logic:
        Daun pisang yang sakit (Moko, Yellow/Black Sigatoka, dll.) dapat
        berubah warna drastis — coklat mengering atau kuning pucat —
        sehingga ImageNet tidak mengenalinya sebagai tanaman.
        Jika gatekeeper menolak TAPI disease model sangat yakin
        (confidence >= DISEASE_OVERRIDE_THRESHOLD), percayai disease model.
        Tolak HANYA jika kedua model sama-sama tidak yakin.
    """
    img = open_image(image_data)

    # ── Pass 1: Gatekeeper ──────────────────────────────────────────
    gate_result = check_is_banana_plant(img)

    # ── Pass 2: Disease model (selalu dijalankan) ───────────────────
    image_array = preprocess_for_disease(img)
    predictions = disease_model.predict(image_array, verbose=0)
    confidence_scores = predictions[0]
    predicted_class = int(np.argmax(confidence_scores))
    confidence = float(confidence_scores[predicted_class]) * 100

    # ── Keputusan akhir ─────────────────────────────────────────────
    # Tolak hanya jika gatekeeper menolak DAN disease model ragu-ragu.
    if not gate_result['is_plant'] and confidence < DISEASE_OVERRIDE_THRESHOLD:
        print(
            f"[Gatekeeper] REJECTED — plant_score={gate_result['plant_score']:.1f}%, "
            f"disease_conf={confidence:.1f}% < {DISEASE_OVERRIDE_THRESHOLD}%"
        )
        return {
            'is_banana': False,
            'detectedDisease': 'Bukan Daun/Batang Pisang',
            'category': 'Tidak Dikenali',
            'severity': 'unknown',
            'confidence': 0,
            'gate_info': {
                'top_predictions': gate_result['top_predictions'],
                'plant_score': gate_result['plant_score'],
            },
            'predictions': []
        }

    if not gate_result['is_plant']:
        # Gatekeeper ragu, tapi disease model cukup yakin → override
        print(
            f"[Gatekeeper] OVERRIDE — plant_score={gate_result['plant_score']:.1f}%, "
            f"disease_conf={confidence:.1f}% >= {DISEASE_OVERRIDE_THRESHOLD}% "
            f"→ trusting disease model (likely diseased/dried/yellowed leaf)"
        )

    disease_info = DISEASE_MAP.get(predicted_class, {
        'name': 'Unknown',
        'category': 'Unknown',
        'severity': 'Unknown'
    })

    return {
        'is_banana': True,
        'detectedDisease': disease_info['name'],
        'category': disease_info['category'],
        'severity': disease_info['severity'],
        'confidence': round(confidence, 2),
        'predictions': [
            {
                'disease': DISEASE_MAP.get(i, {}).get('name', f'Class {i}'),
                'confidence': round(float(confidence_scores[i]) * 100, 2)
            }
            for i in range(len(confidence_scores))
        ]
    }


# ─────────────────────────────────────────────────────────────────
# API Endpoints
# ─────────────────────────────────────────────────────────────────
@app.post("/api/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """ML prediction endpoint (base64 image)"""
    try:
        if not request.image:
            raise HTTPException(status_code=400, detail="No image provided")

        result = run_prediction(request.image)
        return PredictionResponse(success=True, data=result)

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"❌ Prediction error:\n{tb}")
        raise HTTPException(status_code=500, detail=f'Prediction failed: {str(e)}\nTraceback:\n{tb}')


@app.post("/api/predict-file", response_model=PredictionResponse)
async def predict_file(file: UploadFile = File(...)):
    """ML prediction endpoint with file upload"""
    contents = None
    try:
        # Validate file type
        content_type = file.content_type or ""
        # Accept even if content_type is missing/wrong by trying to open as image
        if content_type and content_type not in ALLOWED_CONTENT_TYPES:
            # Allow if content_type starts with image/ (e.g. image/heic)
            if not content_type.startswith("image/"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Tipe file tidak didukung: {content_type}. Gunakan JPG, PNG, atau WEBP."
                )

        # Read and open image
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="File kosong atau tidak dapat dibaca")

        try:
            img = Image.open(io.BytesIO(contents))
            img.load()  # Force full decode to catch corrupt images early
        except Exception as img_err:
            raise HTTPException(status_code=400, detail=f"File gambar tidak dapat dibaca: {str(img_err)}")

        result = run_prediction(img)
        return PredictionResponse(success=True, data=result)

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"❌ predict_file error:\n{tb}")
        raise HTTPException(status_code=500, detail=f'Prediction failed: {str(e)}\nTraceback:\n{tb}')
    finally:
        # Always close the upload file to free resources
        await file.close()


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_type": MODEL_TYPE,
        "model_loaded": disease_model is not None,
        "gatekeeper_loaded": imagenet_model is not None,
    }

@app.get("/")
async def root():
    return {
        "message": "BananaVision API",
        "version": "1.0.0",
        "status": "running",
        "model_type": MODEL_TYPE,
    }

class ReloadRequest(BaseModel):
    filename: str
    model_type: str  # "mobilenetv2" or "resnet50"
    url: Optional[str] = None  # Optional Supabase URL

@app.post("/api/reload")
async def reload_model(request: ReloadRequest):
    global disease_model, imagenet_model, MODEL_TYPE, ACTIVE_FILENAME, ACTIVE_URL, _cfg

    model_type = request.model_type.lower().strip()
    if model_type not in MODEL_CONFIG:
        raise HTTPException(status_code=400, detail=f"Model type '{model_type}' tidak didukung.")

    model_path = os.path.join(MODEL_DIR, request.filename)
    if not os.path.exists(model_path):
        if request.url:
            import urllib.request
            print(f"📥 Downloading model from {request.url} to {model_path}...")
            try:
                os.makedirs(os.path.dirname(model_path), exist_ok=True)
                urllib.request.urlretrieve(request.url, model_path)
                print("✅ Download complete!")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Gagal mendownload model dari Cloud Storage: {str(e)}")
        else:
            raise HTTPException(status_code=404, detail=f"File model '{request.filename}' tidak ditemukan di folder python/")

    try:
        # Step 1: Load disease model (required)
        print(f"🔄 Loading disease model: {request.filename} ({model_type})...")
        new_disease_model = tf.keras.models.load_model(model_path)
        print(f"✅ Disease model loaded!")

        new_cfg = MODEL_CONFIG[model_type]

        # Step 2: Load ImageNet gatekeeper (optional — failure won't block activation)
        new_imagenet_model = None
        try:
            print(f"🔄 Loading ImageNet gatekeeper ({model_type})...")
            new_imagenet_model = new_cfg["imagenet_loader"]()
            print(f"✅ ImageNet gatekeeper loaded!")
        except Exception as gk_err:
            print(f"⚠️ ImageNet gatekeeper failed to load (non-fatal): {gk_err}")

        # Step 3: Update globals
        disease_model = new_disease_model
        imagenet_model = new_imagenet_model
        MODEL_TYPE = model_type
        ACTIVE_FILENAME = request.filename
        ACTIVE_URL = request.url
        _cfg = new_cfg

        # Step 4: Save active model config
        with open(ACTIVE_MODEL_JSON, "w") as f:
            json.dump({
                "model_type": model_type,
                "filename": request.filename,
                "url": request.url
            }, f)

        print(f"✅ Reload complete: {request.filename} | gatekeeper: {'loaded' if new_imagenet_model else 'disabled'}")
        return {
            "success": True,
            "message": f"Model berhasil dimuat: {request.filename}",
            "model_type": model_type,
            "filename": request.filename,
            "gatekeeper_loaded": new_imagenet_model is not None
        }
    except Exception as e:
        import traceback
        print(f"❌ Failed to reload model:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Gagal memuat model: {str(e)}")

@app.get("/api/models")
async def list_available_models():
    """List all available .keras model files inside python/ directory"""
    try:
        files = os.listdir(MODEL_DIR)
        model_files = [f for f in files if f.endswith(".keras")]
        return {
            "success": True,
            "models": model_files,
            "active_model": {
                "filename": ACTIVE_FILENAME if disease_model is not None else None,
                "model_type": MODEL_TYPE if disease_model is not None else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)