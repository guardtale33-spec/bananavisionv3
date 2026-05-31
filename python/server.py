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
MODEL_TYPE = os.environ.get("MODEL_TYPE", "mobilenetv2").lower().strip()

MODEL_DIR = os.path.dirname(__file__)

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

if MODEL_TYPE not in MODEL_CONFIG:
    raise ValueError(
        f"MODEL_TYPE='{MODEL_TYPE}' tidak didukung. "
        f"Gunakan: {', '.join(MODEL_CONFIG.keys())}"
    )

_cfg = MODEL_CONFIG[MODEL_TYPE]

# Will be populated at startup
disease_model = None
imagenet_model = None


@app.on_event("startup")
async def load_model():
    global disease_model, imagenet_model

    model_path = _cfg["path"]
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model file tidak ditemukan: {model_path}. "
            f"Pastikan file model '{MODEL_TYPE}' ada di folder python/"
        )

    print(f"🔄 Loading disease model ({MODEL_TYPE}): {os.path.basename(model_path)}")
    disease_model = tf.keras.models.load_model(model_path)
    print(f"✅ Disease model loaded: {MODEL_TYPE}")

    print(f"🔄 Loading ImageNet gatekeeper ({MODEL_TYPE})...")
    imagenet_model = _cfg["imagenet_loader"]()
    print(f"✅ ImageNet gatekeeper loaded: {MODEL_TYPE}")


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
# Lowered to 3.0 to be more permissive for real banana leaf images
# which can be misclassified by ImageNet as other plant-related classes.
PLANT_GATE_THRESHOLD = 3.0


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
# percayai disease model. Turunkan nilai ini jika daun sakit masih sering
# tertolak (misal: 50.0). Naikkan untuk lebih ketat (misal: 70.0).
DISEASE_OVERRIDE_THRESHOLD = 60.0  # %


def run_prediction(image_data) -> dict:
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
        raise HTTPException(status_code=500, detail=f'Prediction failed: {str(e)}')


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
        print(f"❌ predict_file error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f'Prediction failed: {str(e)}')
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)