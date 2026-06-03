import { useState, useEffect, useRef } from "react";
import { getAdminModels, activateAdminModel, deleteAdminModel, uploadAdminModel, getAdminModelsHealth } from "../../hooks/data";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Cpu, Upload, Trash2, CheckCircle, AlertTriangle, Activity, Database, Check } from "lucide-react";

export default function AdminModelsPage({ token }) {
  const [models, setModels] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form upload state
  const [name, setName] = useState("");
  const [modelType, setModelType] = useState("mobilenetv2");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [token]);

  async function loadData() {
    try {
      setLoading(true);
      const [modelsData, healthData] = await Promise.all([
        getAdminModels(token),
        getAdminModelsHealth(token),
      ]);
      setModels(modelsData);
      setHealth(healthData);
    } catch (err) {
      setError(err.message || "Gagal memuat sistem model");
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".keras")) {
        setUploadError("Hanya file model dengan ekstensi .keras yang diperbolehkan!");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setUploadError(null);
      // Auto fill name if empty
      if (!name) {
        setName(selectedFile.name.replace(".keras", "").replace(/_/g, " "));
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !name || !modelType) {
      setUploadError("Semua bidang formulir wajib diisi!");
      return;
    }

    const formData = new FormData();
    formData.append("modelFile", file);
    formData.append("name", name);
    formData.append("modelType", modelType);

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      await uploadAdminModel(token, formData);

      setUploadSuccess(true);
      setName("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh list
      const updatedModels = await getAdminModels(token);
      setModels(updatedModels);
    } catch (err) {
      setUploadError(err.message || "Gagal mengunggah file model");
    } finally {
      setUploading(false);
    }
  };

  const handleActivate = async (id, modelName) => {
    const choice = window.confirm(`Apakah Anda yakin ingin mengaktifkan model '${modelName}'?\nSistem deteksi AI akan langsung dialihkan ke model ini.`);
    if (!choice) return;

    try {
      setLoading(true);
      await activateAdminModel(token, id);
      alert(`Model '${modelName}' berhasil diaktifkan!`);
      loadData();
    } catch (err) {
      alert("Gagal mengaktifkan model: " + err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id, modelName) => {
    const choice = window.confirm(`Apakah Anda yakin ingin menghapus model '${modelName}'?\nTindakan ini akan menghapus file weights fisik dari server.`);
    if (!choice) return;

    try {
      setLoading(true);
      await deleteAdminModel(token, id);
      loadData();
    } catch (err) {
      alert("Gagal menghapus model: " + err.message);
      setLoading(false);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  if (loading && models.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <LoadingSpinner size="lg" color="green" />
      </div>
    );
  }

  const activeModel = models.find((m) => m.isActive);

  return (
    <div className="flex flex-col gap-8 animate-fade-in text-slate-200">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Sistem Model AI</h1>
        <p className="text-slate-400 text-sm mt-1">
          Unggah, kelola, dan pilih model deep learning (MobileNet/ResNet) aktif untuk klasifikasi penyakit.
        </p>
      </div>

      {/* Health & Server Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: AI Microservice Health & Model Activation */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* AI Server Health Dashboard Card */}
          <div className="bg-slate-900/40 border border-slate-800/85 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center text-green-400">
                  <Activity className="w-5.5 h-5.5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Status Server AI</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Koneksi backend ke FastAPI microservice</p>
                </div>
              </div>
              
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                health?.online 
                  ? "bg-green-500/15 text-green-400 border border-green-500/30" 
                  : "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse"
              }`}>
                <span className={`w-2 h-2 rounded-full ${health?.online ? "bg-green-400" : "bg-red-400"}`} />
                {health?.online ? "ONLINE" : "OFFLINE / DISCONNECTED"}
              </span>
            </div>

            {health?.online ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-sm bg-slate-950/40 p-4 border border-slate-850 rounded-2xl">
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Model Terpilih</p>
                  <p className="text-white font-bold mt-1 text-base truncate">{activeModel?.name || "Bawaan Sistem"}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Arsitektur Preprocessing</p>
                  <p className="text-green-400 font-bold mt-1 text-base uppercase">{health.details?.model_type || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Gatekeeper ImageNet</p>
                  <p className="text-slate-300 font-bold mt-1 text-base">
                    {health.details?.gatekeeper_loaded ? "READY (Online)" : "DISABLED"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 bg-red-950/20 border border-red-900/40 p-4 rounded-2xl text-red-300 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Koneksi ke Microservice Gagal</p>
                  <p className="text-xs text-red-400 mt-1 leading-relaxed">
                    Pastikan server Python (`python/server.py`) berjalan di port default atau sesuaikan `ML_SERVER_URL` di konfigurasi environment backend Anda.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Model Weights List */}
          <div className="bg-slate-900/40 border border-slate-800/85 rounded-3xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-400" />
              <span>Daftar Bobot Model (.keras)</span>
            </h2>

            <div className="flex flex-col gap-4">
              {models.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Belum ada file model yang terdeteksi.</p>
              ) : (
                models.map((model) => (
                  <div
                    key={model.id}
                    className={`bg-slate-950/40 border p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                      model.isActive
                        ? "border-green-500/35 bg-green-500/[0.02]"
                        : "border-slate-800/80 hover:border-slate-700/80"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white truncate">{model.name}</h4>
                        {model.isActive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-500 truncate mt-1">File: {model.filename}</p>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 font-semibold">
                        <span className="bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-slate-400 uppercase tracking-wide">
                          {model.modelType}
                        </span>
                        <span>Ukuran: {formatBytes(model.fileSize)}</span>
                        <span>Diunggah: {new Date(model.uploadedAt).toLocaleDateString("id-ID")}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-850">
                      {!model.isActive && (
                        <button
                          onClick={() => handleActivate(model.id, model.name)}
                          className="flex items-center gap-1.5 bg-slate-800 hover:bg-green-500/10 border border-slate-700 hover:border-green-500/30 text-slate-300 hover:text-green-400 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Aktifkan</span>
                        </button>
                      )}
                      {model.isActive && (
                        <span className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-4 py-2.5 rounded-xl shadow-inner cursor-default">
                          <Check className="w-4 h-4" />
                          <span>Aktif Sekarang</span>
                        </span>
                      )}
                      {!model.isActive && (
                        <button
                          onClick={() => handleDelete(model.id, model.name)}
                          className="p-2.5 bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-900/50 rounded-xl transition-all"
                          title="Hapus Model"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Upload Model Weights Form */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900/40 border border-slate-800/85 rounded-3xl p-6 shadow-xl h-fit">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-slate-400" />
              <span>Unggah Bobot Model</span>
            </h2>

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
              {uploadError && (
                <div className="bg-red-950/40 border border-red-900/60 text-red-400 p-3 rounded-xl text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="bg-green-950/40 border border-green-900/60 text-green-400 p-3 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>Model berhasil diunggah! Hubungkan dan aktifkan model.</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Tampilan</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: MobileNetV2 Epoch 150"
                  className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Arsitektur Dasar</label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition-all"
                >
                  <option value="mobilenetv2">MobileNetV2 (Default)</option>
                  <option value="resnet50">ResNet50</option>
                  <option value="custom">Arsitektur Kustom</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">File Model (.keras)</label>
                <input
                  type="file"
                  accept=".keras"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 file:cursor-pointer cursor-pointer"
                  required
                />
                <span className="text-[10px] text-slate-500">Maksimum ukuran file: 250MB. Pastikan file menggunakan format .keras.</span>
              </div>

              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl py-3 mt-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
              >
                {uploading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Mengunggah file besar…</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4.5 h-4.5" />
                    <span>Unggah File Model</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
