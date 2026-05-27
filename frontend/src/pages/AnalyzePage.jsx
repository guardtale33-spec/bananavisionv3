import React, { useRef, useState, useEffect } from "react";
import {
  Upload, Camera, X, CheckCircle, AlertCircle, ChevronRight,
  Star, Leaf, Microscope, RefreshCw, Info, Zap, ImagePlus, Sparkles,
  AlertTriangle, Ban, ImageOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../utils/token";
import { submitFeedback } from "../hooks/data";

export default function AnalyzePage({
  selectedImage, setSelectedImage, analyzing, result,
  handleImageSelect, handleAnalyze, setCurrentPage,
}) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [progressStep, setProgressStep] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [showNotBananaPopup, setShowNotBananaPopup] = useState(false);
  const navigate = useNavigate();

  const progressSteps = [
    "Memproses gambar…", "Mengekstraksi fitur…",
    "Menjalankan model AI…", "Menganalisis pola daun…", "Menyusun hasil…",
  ];

  useEffect(() => {
    if (!getToken()) navigate("/login");
  }, []);

  // Show popup when not-banana result is detected
  useEffect(() => {
    if (result?.severity === "not_banana") {
      setShowNotBananaPopup(true);
    }
  }, [result]);

  useEffect(() => {
    let id;
    if (analyzing) {
      setLocalProgress(5);
      setProgressStep(progressSteps[0]);
      id = setInterval(() => {
        setLocalProgress((p) => {
          const next = Math.min(95, p + Math.random() * 8 + 2);
          setProgressStep(progressSteps[Math.min(Math.floor((next / 100) * progressSteps.length), progressSteps.length - 1)]);
          return next;
        });
      }, 400);
    } else {
      setLocalProgress(0);
      setProgressStep("");
    }
    return () => clearInterval(id);
  }, [analyzing]);

  const handleFeedbackSubmit = async () => {
    if (!feedbackRating) return;
    try {
      await submitFeedback(getToken(), feedbackText, feedbackRating);
      setFeedbackSubmitted(true);
    } catch { alert("Gagal mengirim feedback"); }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file?.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => { setSelectedImage(reader.result); resetFeedback(); };
      reader.readAsDataURL(file);
    }
  };

  const resetFeedback = () => { setFeedbackSubmitted(false); setFeedbackRating(0); setFeedbackText(""); setHoverStar(0); setShowNotBananaPopup(false); };
  const handleSelectImageWrapper = (e) => { handleImageSelect(e); resetFeedback(); };
  const handleCameraClick = () => { if (cameraInputRef.current) { cameraInputRef.current.value = ""; cameraInputRef.current.click(); } };

  const getSeverityConfig = (s) => ({
    healthy: { gradient: "from-green-500 to-emerald-600", cardBg: "from-green-50 to-emerald-50/50", border: "border-green-200", iconBg: "bg-green-500", bar: "bg-green-500", accentText: "text-green-700" },
    warning: { gradient: "from-amber-500 to-orange-500", cardBg: "from-amber-50 to-orange-50/50", border: "border-amber-200", iconBg: "bg-amber-500", bar: "bg-amber-500", accentText: "text-amber-700" },
    danger:  { gradient: "from-red-500 to-rose-600",   cardBg: "from-red-50 to-rose-50/50",   border: "border-red-200",   iconBg: "bg-red-500",   bar: "bg-red-500",   accentText: "text-red-700" },
  }[s] || { gradient: "from-red-500 to-rose-600", cardBg: "from-red-50 to-rose-50/50", border: "border-red-200", iconBg: "bg-red-500", bar: "bg-red-500", accentText: "text-red-700" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/30 pb-24">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 pt-8 pb-16 px-4">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Microscope className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Analisis Penyakit</h1>
          </div>
          <p className="text-green-100 text-sm">Deteksi penyakit daun pisang menggunakan kecerdasan buatan</p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 -mt-8 relative z-10 space-y-4">

        {/* hidden inputs */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleSelectImageWrapper} className="hidden" />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleSelectImageWrapper} className="hidden" />

        {/* ── UPLOAD STATE ── */}
        {!selectedImage && (
          <>
            {/* Drop Zone */}
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-3xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300 ${
                dragOver ? "border-green-400 bg-green-50 scale-[1.01]" : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/40"
              }`}
              role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") fileInputRef.current?.click(); }}
            >
              {dragOver && (
                <div className="absolute inset-0 rounded-3xl bg-green-400/10 flex items-center justify-center z-10">
                  <p className="text-green-700 font-bold text-xl">Lepaskan di sini!</p>
                </div>
              )}

              {/* Icon area */}
              <div className="relative w-24 h-24 mx-auto mb-5">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center shadow-inner">
                  <ImagePlus className="w-10 h-10 text-green-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>

              <h2 className="text-lg font-bold text-gray-800 mb-1.5">Tarik & Lepas Foto Daun</h2>
              <p className="text-gray-400 text-sm mb-5">atau klik area ini untuk memilih dari perangkat Anda</p>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-xs text-green-700 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                Mendukung JPG, PNG, WEBP, HEIC
              </div>
            </div>

            {/* Upload Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center gap-2.5 py-5 px-4 rounded-2xl bg-white border-2 border-gray-100 hover:border-green-300 hover:bg-green-50/30 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-800 text-sm">Dari Galeri</p>
                  <p className="text-xs text-gray-400 mt-0.5">Pilih foto tersimpan</p>
                </div>
              </button>

              <button
                onClick={handleCameraClick}
                className="group relative flex flex-col items-center gap-2.5 py-5 px-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 transition-all hover:-translate-y-0.5 hover:shadow-xl shadow-lg shadow-green-500/20"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-white text-sm">Buka Kamera</p>
                  <p className="text-xs text-green-200 mt-0.5">Foto langsung sekarang</p>
                </div>
              </button>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-200" />
                <span className="text-white text-sm font-bold">Tips Foto Terbaik</span>
              </div>
              <div className="grid grid-cols-2 gap-px bg-gray-100">
                {[
                  { emoji: "", title: "Jarak Ideal", tip: "20–30 cm dari daun" },
                  { emoji: "", title: "Pencahayaan", tip: "Cukup cahaya, hindari bayangan" },
                  { emoji: "", title: "Fokus Area", tip: "Tampilkan bagian bergejala" },
                  { emoji: "", title: "Background", tip: "Gunakan latar kontras" },
                ].map((t, i) => (
                  <div key={i} className="bg-white p-3 flex items-start gap-2.5">
                    <span className="text-xl flex-shrink-0">{t.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-700">{t.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── IMAGE SELECTED STATE ── */}
        {selectedImage && (
          <div className="space-y-4 animate-fade-in">

            {/* Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="relative">
                <img src={selectedImage} alt="Gambar dipilih" className="w-full max-h-72 object-contain bg-gray-50" />
                <button
                  onClick={() => { setSelectedImage(null); resetFeedback(); }}
                  className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <X className="w-4 h-4 text-gray-700" />
                </button>
                {!result && !analyzing && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent p-4">
                    <span className="text-white text-xs font-medium flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Gambar siap dianalisis
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            {!result && !analyzing && (
              <div className="flex gap-3">
                <button
                  onClick={handleAnalyze}
                  className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold text-base shadow-lg shadow-green-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <Zap className="w-5 h-5" /> Analisis Sekarang
                </button>
                <button
                  onClick={() => { setSelectedImage(null); resetFeedback(); }}
                  className="w-14 flex items-center justify-center rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Loading */}
            {analyzing && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center animate-fade-in">
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" fill="none" stroke="#dcfce7" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="36" fill="none" stroke="url(#pg)" strokeWidth="6"
                      strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - localProgress / 100)}`}
                      className="transition-all duration-300"
                    />
                    <defs>
                      <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4ade80" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Leaf className="w-7 h-7 text-green-500 animate-pulse" />
                  </div>
                </div>
                <p className="text-base font-bold text-gray-800 mb-1">Menganalisis Daun…</p>
                <p className="text-sm text-gray-400 mb-1">{progressStep}</p>
                <p className="text-xs font-mono text-green-600 font-bold">{Math.round(localProgress)}%</p>
              </div>
            )}

            {/* Result */}
            {result && (() => {
              const cfg = getSeverityConfig(result.severity);
              return (
                <div className={`rounded-2xl border overflow-hidden animate-scale-in ${cfg.border}`}>
                  {/* Header */}
                  <div className={`bg-gradient-to-br ${cfg.gradient} p-5`}>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                        {result.severity === "healthy"
                          ? <CheckCircle className="w-7 h-7 text-white" />
                          : <AlertCircle className="w-7 h-7 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h2 className="text-xl font-bold text-white">{result.disease}</h2>
                          {result.category && (
                            <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full font-semibold">{result.category}</span>
                          )}
                        </div>
                        {result.severity !== "error" && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/30 h-2 rounded-full overflow-hidden">
                              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${result.confidence}%` }} />
                            </div>
                            <span className="text-white/90 text-sm font-bold">{result.confidence}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className={`bg-gradient-to-br ${cfg.cardBg} p-5 space-y-4`}>
                    {result.severity === "error" ? (
                      <div className="bg-white/80 rounded-xl p-4 text-red-700 text-sm">{result.message}</div>
                    ) : (
                      <>
                        {result.severity !== "healthy" && (
                          <div className="bg-white/80 rounded-xl p-4">
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                              <Info className="w-4 h-4 text-orange-500" /> Rekomendasi Tindakan
                            </h3>
                            <ul className="space-y-2">
                              {["Isolasi tanaman yang terinfeksi dari yang sehat",
                                "Konsultasikan dengan ahli pertanian setempat",
                                "Terapkan fungisida atau bakterisida yang sesuai",
                                "Buang daun rusak dan tingkatkan sanitasi kebun"
                              ].map((rec, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                                  <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.predictions?.length > 0 && (
                          <div className="bg-white/80 rounded-xl p-4">
                            <h3 className="font-bold text-gray-800 mb-3 text-sm">Prediksi Lainnya</h3>
                            <div className="space-y-2.5">
                              {result.predictions.slice(0, 3).map((pred, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                  <span className="text-gray-600 flex-1 truncate">{pred.disease}</span>
                                  <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-400 rounded-full" style={{ width: `${pred.confidence}%` }} />
                                  </div>
                                  <span className="text-gray-500 text-xs font-bold w-8 text-right">{pred.confidence}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Feedback */}
                        <div className="bg-white/80 rounded-xl p-4">
                          <h3 className="font-bold text-gray-800 mb-1 text-sm flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-green-500" /> Apakah hasil ini akurat?
                          </h3>
                          {feedbackSubmitted ? (
                            <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-xl text-sm mt-2">
                              <CheckCircle className="w-4 h-4" /> Terima kasih atas masukan Anda!
                            </div>
                          ) : (
                            <div className="space-y-3 mt-2">
                              <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map((star) => (
                                  <button key={star} onClick={() => setFeedbackRating(star)}
                                    onMouseEnter={() => setHoverStar(star)} onMouseLeave={() => setHoverStar(0)}
                                    className="p-0.5 transition-transform hover:scale-125">
                                    <Star className={`w-6 h-6 transition-colors ${star <= (hoverStar || feedbackRating) ? "text-yellow-400" : "text-gray-200"}`}
                                      fill={star <= (hoverStar || feedbackRating) ? "currentColor" : "none"} />
                                  </button>
                                ))}
                                {feedbackRating > 0 && (
                                  <span className="text-xs text-gray-500 ml-1">{["","Buruk","Kurang","Cukup","Baik","Sempurna"][feedbackRating]}</span>
                                )}
                              </div>
                              <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Catatan tambahan (opsional)…" rows={2}
                                className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 resize-none bg-white" />
                              <button onClick={handleFeedbackSubmit} disabled={!feedbackRating}
                                className="text-sm px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl disabled:opacity-40 transition-all font-semibold">
                                Kirim Masukan
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-4 bg-white flex items-center justify-between gap-3 border-t border-gray-100">
                    {result.severity !== "error" && (
                      <button onClick={() => setCurrentPage("diseases")}
                        className="text-sm text-green-700 font-semibold hover:text-green-800 flex items-center gap-1">
                        Lihat katalog <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => { setSelectedImage(null); resetFeedback(); }}
                      className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-all">
                      <RefreshCw className="w-4 h-4" />
                      {result.severity === "error" ? "Coba Lagi" : "Analisis Baru"}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── NOT BANANA POPUP MODAL ── */}
      {showNotBananaPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowNotBananaPopup(false); setSelectedImage(null); resetFeedback(); }}
            style={{ animation: 'fadeIn 0.2s ease-out' }}
          />

          {/* Modal */}
          <div
            className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
            style={{ animation: 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            {/* Top gradient accent */}
            <div className="bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 p-6 pb-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-56 h-56 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
              </div>
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm" style={{ animation: 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both' }}>
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <ImageOff className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Gambar Tidak Dikenali</h2>
                <p className="text-white/80 text-sm">Bukan daun atau batang pisang</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-800 mb-1">Deteksi Gagal</p>
                    <p className="text-xs text-red-600 leading-relaxed">
                      {result?.message || "Gambar yang Anda unggah bukan daun atau batang pisang. Silakan unggah foto yang sesuai."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Pastikan Gambar Anda:
                </h3>
                <ul className="space-y-1.5">
                  {[
                    "Merupakan foto daun atau batang pisang",
                    "Terlihat jelas tanpa blur atau gelap",
                    "Fokus pada bagian tanaman yang bergejala",
                  ].map((tip, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-amber-700">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowNotBananaPopup(false); setSelectedImage(null); resetFeedback(); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold text-sm shadow-lg shadow-green-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Coba Gambar Lain
                </button>
                <button
                  onClick={() => setShowNotBananaPopup(false)}
                  className="w-14 flex items-center justify-center rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes bounceIn {
          from { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.05); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
