import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  Clock,
  AlertCircle,
  Trash2,
  Eye,
  Leaf,
  CheckCircle,
  X,
  Shield,
  Activity,
  History,
} from "lucide-react";
import { getAnalyses, deleteAnalysis } from "../hooks/data";
import { getToken } from "../utils/token";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../hooks/useToast.jsx";

export default function HistoryPage({ setCurrentPage }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const pendingTimerRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setError("Silakan login terlebih dahulu");
        setLoading(false);
        return;
      }
      const data = await getAnalyses(token, { limit: 50 });
      setHistoryData(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Gagal memuat riwayat analisis");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setConfirmTarget(id);
    setConfirmOpen(true);
  };

  const finalizeDelete = async (id) => {
    try {
      const token = getToken();
      await deleteAnalysis(token, id);
      toast.success("Riwayat benar-benar dihapus.");
    } catch (err) {
      // restore if API failed
      if (pendingDelete?.id === id) {
        setHistoryData((prev) => [pendingDelete, ...prev]);
      }
      toast.error("Gagal menghapus di server.");
    } finally {
      setPendingDelete(null);
      setDeletingId(null);
      pendingTimerRef.current = null;
    }
  };

  const confirmDeleteNow = () => {
    setConfirmOpen(false);
    const id = confirmTarget;
    const item = historyData.find((i) => i.id === id);
    if (!item) {
      setConfirmTarget(null);
      return;
    }

    // optimistic remove
    setHistoryData((prev) => prev.filter((i) => i.id !== id));
    setPendingDelete(item);
    setDeletingId(id);

    // show undo toast with action
    const undoAction = (
      <div className="flex items-center justify-between gap-3">
        <span>Riwayat dihapus</span>
        <button
          onClick={() => undoDelete(id)}
          className="ml-4 text-sm font-bold text-green-600"
        >
          Undo
        </button>
      </div>
    );
    toast.showToast(undoAction, "info", 5000);

    // delay actual API delete to allow undo
    pendingTimerRef.current = setTimeout(() => finalizeDelete(id), 5000);
    setConfirmTarget(null);
  };

  const undoDelete = (id) => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    if (pendingDelete && pendingDelete.id === id) {
      setHistoryData((prev) => [pendingDelete, ...prev]);
      setPendingDelete(null);
      setDeletingId(null);
      toast.info("Penghapusan dibatalkan");
    }
  };

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isHealthy = (disease) => {
    const d = disease?.toLowerCase() || "";
    return d.includes("healthy") || d.includes("sehat");
  };

  const filtered = historyData.filter((item) => {
    const matchQuery = item.detectedDisease
      ?.toLowerCase()
      .includes(query.toLowerCase());
    const status = isHealthy(item.detectedDisease) ? "healthy" : "warning";
    const matchFilter = filter === "all" || status === filter;
    return matchQuery && matchFilter;
  });

  const healthyCount = historyData.filter((i) =>
    isHealthy(i.detectedDisease),
  ).length;
  const diseaseCount = historyData.length - healthyCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/30 pb-24">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 pt-8 pb-16 px-4">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <History className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Riwayat Analisis
              </h1>
            </div>
            <p className="text-green-100 text-sm">
              Semua hasil deteksi tanaman pisang Anda tersimpan di sini
            </p>
          </div>
          <button
            onClick={() => setCurrentPage && setCurrentPage("analyze")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-green-700 font-bold rounded-xl shadow-lg hover:bg-green-50 hover:scale-105 transition-all text-sm self-start sm:self-auto flex-shrink-0"
          >
            + Analisis Baru
          </button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 mb-6 relative z-10">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 p-4 grid grid-cols-3 gap-2 sm:gap-4">
          {[
            {
              icon: Activity,
              label: "Total",
              value: historyData.length,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              icon: CheckCircle,
              label: "Sehat",
              value: healthyCount,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              icon: AlertCircle,
              label: "Penyakit",
              value: diseaseCount,
              color: "text-red-500",
              bg: "bg-red-50",
            },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="text-center">
                <div
                  className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-1`}
                >
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-800">
                  {s.value}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Cari nama penyakit..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-green-400 focus:ring-2 focus:ring-green-400/20 focus:outline-none transition-all"
              />
            </div>
            <div className="relative sm:w-44">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-green-400 focus:outline-none appearance-none cursor-pointer transition-all"
              >
                <option value="all">Semua Status</option>
                <option value="healthy">Sehat</option>
                <option value="warning">Penyakit</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-gray-400 text-sm">Memuat riwayat...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 p-5 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Leaf className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold mb-1">
              Belum ada hasil ditemukan
            </p>
            <p className="text-gray-400 text-sm mb-5">
              {query
                ? `Tidak ada hasil untuk "${query}"`
                : "Mulai analisis pertama Anda sekarang."}
            </p>
            <button
              onClick={() => setCurrentPage && setCurrentPage("analyze")}
              className="btn-primary text-sm py-2.5 px-6"
            >
              Mulai Analisis
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">
              Menampilkan {filtered.length} hasil
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => {
                const healthy = isHealthy(item.detectedDisease);
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAnalysis(item)}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 cursor-pointer group flex flex-col"
                  >
                    {/* Image / Placeholder */}
                    <div className="relative aspect-video overflow-hidden bg-gray-50 border-b border-gray-50">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.detectedDisease}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center transition-colors ${
                            healthy
                              ? "bg-green-50/60 group-hover:bg-green-100/60"
                              : "bg-red-50/60 group-hover:bg-red-100/60"
                          }`}
                        >
                          {healthy ? (
                            <CheckCircle className="w-10 h-10 text-green-400" />
                          ) : (
                            <AlertCircle className="w-10 h-10 text-red-300" />
                          )}
                        </div>
                      )}
                      {/* Confidence Badge */}
                      <div
                        className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
                          healthy
                            ? "bg-green-500/90 text-white"
                            : "bg-white/90 text-red-600 border border-red-100"
                        }`}
                      >
                        {item.confidence?.toFixed(0)}%
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-800 text-sm line-clamp-1 group-hover:text-green-700 transition-colors mb-1">
                        {item.detectedDisease}
                      </h3>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-4">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(item.createdAt)}
                      </div>

                      {/* Actions */}
                      <div className="mt-auto pt-3 border-t border-gray-50 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAnalysis(item);
                          }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Lihat
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, item.id)}
                          disabled={deletingId === item.id}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors ml-auto"
                        >
                          {deletingId === item.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selectedAnalysis && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAnalysis(null);
          }}
        >
          <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div
              className={`flex-shrink-0 p-6 relative text-white ${
                isHealthy(selectedAnalysis.detectedDisease)
                  ? "bg-gradient-to-br from-green-500 to-emerald-600"
                  : "bg-gradient-to-br from-red-500 to-rose-600"
              }`}
            >
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-md">
                  {isHealthy(selectedAnalysis.detectedDisease) ? (
                    <CheckCircle className="w-7 h-7 text-white" />
                  ) : (
                    <AlertCircle className="w-7 h-7 text-white" />
                  )}
                </div>
                <div>
                  <div className="inline-flex bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1">
                    {selectedAnalysis.confidence?.toFixed(0)}% Akurasi
                  </div>
                  <h2 className="text-xl font-bold leading-tight">
                    {selectedAnalysis.detectedDisease}
                  </h2>
                  <div className="text-white/80 text-xs flex items-center gap-1 mt-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(selectedAnalysis.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto hide-scrollbar p-5 space-y-4 flex-1">
              {selectedAnalysis.imageUrl && (
                <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 max-h-56 flex justify-center">
                  <img
                    src={selectedAnalysis.imageUrl}
                    alt="Daun pisang"
                    className="max-w-full h-auto object-contain"
                  />
                </div>
              )}

              {selectedAnalysis.predictions?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Detail Prediksi AI
                  </h4>
                  <div className="space-y-2.5">
                    {selectedAnalysis.predictions.slice(0, 3).map((pred, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-gray-700 font-medium truncate flex-1">
                          {pred.disease}
                        </span>
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${i === 0 ? (isHealthy(pred.disease) ? "bg-green-500" : "bg-red-500") : "bg-gray-400"}`}
                            style={{ width: `${pred.confidence}%` }}
                          />
                        </div>
                        <span className="text-gray-500 text-xs font-bold w-8 text-right">
                          {pred.confidence?.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Catatan Analisis
                </h4>
                <p className="text-sm text-blue-900 leading-relaxed">
                  {selectedAnalysis.notes ||
                    "Jika terdeteksi penyakit, segera pisahkan tanaman yang terdampak dan konsultasikan dengan ahli pertanian setempat untuk penanganan lebih lanjut."}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50/50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmTarget(selectedAnalysis.id);
                  setConfirmOpen(true);
                  setSelectedAnalysis(null);
                }}
                className="px-4 py-2.5 rounded-xl text-red-600 font-semibold text-sm hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Hapus Riwayat"
        description="Anda yakin ingin menghapus riwayat ini? Anda memiliki beberapa detik untuk membatalkan."
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onConfirm={confirmDeleteNow}
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
}
