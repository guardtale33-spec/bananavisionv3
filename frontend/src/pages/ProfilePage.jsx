import React, { useState, useEffect, useRef } from "react";
import {
  LogOut,
  Edit3,
  Bell,
  Shield,
  ChevronRight,
  User,
  CheckCircle,
  X,
  Save,
  Leaf,
  Activity,
  Clock,
  Camera,
  AlertCircle,
  BellOff,
} from "lucide-react";
import {
  getAnalyses,
  getFeedbacksByUserId,
  updateProfile,
} from "../hooks/data";
import { getToken } from "../utils/token";

export default function ProfilePage({ user, setUser, handleLogout, goTo }) {
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [feedbackData, setFeedbackData] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [feedbackError, setFeedbackError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editNotifications, setEditNotifications] = useState(
    user?.notifications !== false,
  );
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingHistory(true);
        setLoadingFeedback(true);
        setFeedbackError("");

        const token = getToken();
        if (!token) {
          setHistoryData([]);
          setFeedbackData([]);
          return;
        }

        const userId = user?.id || user?._id || user?.userId;
        const [analyses, feedbacks] = await Promise.all([
          getAnalyses(token, { limit: 5 }),
          userId ? getFeedbacksByUserId(token, userId) : Promise.resolve([]),
        ]);

        setHistoryData(Array.isArray(analyses) ? analyses : []);
        setFeedbackData(Array.isArray(feedbacks) ? feedbacks : []);
      } catch (err) {
        console.error("Failed to fetch profile history or feedback:", err);
        setHistoryData([]);
        setFeedbackError("Gagal memuat feedback pengguna");
      } finally {
        setLoadingHistory(false);
        setLoadingFeedback(false);
      }
    };
    fetchData();
  }, [user]);

  // Sync edit fields when modal opens
  useEffect(() => {
    if (showEditModal) {
      setEditName(user?.name || "");
      setEditNotifications(user?.notifications !== false);
      setSaveSuccess(false);
      setSaveError("");
    }
  }, [showEditModal, user]);

  // Close modal on ESC
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setShowEditModal(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setSaveError("Nama tidak boleh kosong");
      return;
    }
    try {
      setSaving(true);
      setSaveError("");
      const token = getToken();
      await updateProfile(token, {
        name: editName.trim(),
        notifications: editNotifications,
      });
      setSaveSuccess(true);
      // Update global user state so navbar name updates immediately
      if (setUser) {
        setUser((prev) => ({
          ...prev,
          name: editName.trim(),
          notifications: editNotifications,
        }));
      }
      setTimeout(() => {
        setShowEditModal(false);
        setSaveSuccess(false);
      }, 1200);
    } catch (err) {
      setSaveError(err.message || "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isHealthy = (disease) => {
    const d = disease?.toLowerCase() || "";
    return d.includes("healthy") || d.includes("sehat");
  };

  const healthyCount = historyData.filter((h) =>
    isHealthy(h.detectedDisease),
  ).length;
  const diseaseCount = historyData.length - healthyCount;
  const avgConfidence =
    historyData.length > 0
      ? Math.round(
          historyData.reduce((s, h) => s + (h.confidence || 0), 0) /
            historyData.length,
        )
      : 0;
  const latestHistory = historyData.slice(0, 5);
  const latestFeedback = feedbackData.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20 pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 pt-6 pb-20 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="relative inline-block mb-4">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user?.name || user?.email || "User",
                )}&background=ffffff&color=10b981&size=128&bold=true`
              }
              alt={user?.name || "User"}
              className="w-24 h-24 rounded-full shadow-2xl border-4 border-white/30 mx-auto"
            />
            <button
              onClick={() => setShowEditModal(true)}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              aria-label="Edit foto profil"
            >
              <Camera className="w-4 h-4 text-green-600" />
            </button>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {user?.name || "Pengguna"}
          </h1>
          <p className="text-green-100 text-sm mb-5">{user?.email || ""}</p>
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-full text-sm font-semibold hover:bg-white/30 transition-all"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profil
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 sm:-mt-12 mb-6 relative z-10">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-4 sm:p-5 grid grid-cols-3 gap-2 sm:gap-4 border border-white/50">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-800">
              {historyData.length}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
              <Activity className="w-3 h-3 hidden sm:block" />
              Analisis
            </div>
          </div>
          <div className="text-center border-x border-gray-100">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {healthyCount}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
              <Leaf className="w-3 h-3 hidden sm:block" />
              Sehat
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-orange-500">
              {avgConfidence}%
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3 hidden sm:block" />
              Akurasi
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <div className="flex bg-gray-200/50 p-1 rounded-xl shadow-sm overflow-x-auto hide-scrollbar">
          {[
            { id: "info", label: "Informasi" },
            { id: "history", label: "Riwayat" },
            { id: "settings", label: "Pengaturan" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[90px] py-2.5 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white shadow-md text-green-700 scale-[1.02]"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-4">
        {/* Info Tab */}
        {activeTab === "info" && (
          <div className="animate-fade-in space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-gray-800">Informasi Akun</h2>
              <div className="space-y-3">
                {[
                  { label: "Nama", value: user?.name || "-" },
                  { label: "Email", value: user?.email || "-" },
                  {
                    label: "Status",
                    value: (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Aktif
                      </span>
                    ),
                  },
                  {
                    label: "Notifikasi",
                    value: (
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full ${
                          user?.notifications !== false
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {user?.notifications !== false ? (
                          <>
                            <Bell className="w-3 h-3" /> Aktif
                          </>
                        ) : (
                          <>
                            <BellOff className="w-3 h-3" /> Nonaktif
                          </>
                        )}
                      </span>
                    ),
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-50 last:border-0 gap-1 sm:gap-0"
                  >
                    <span className="text-xs sm:text-sm text-gray-500">
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-gray-800 break-all sm:break-normal">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribusi Penyakit */}
            {historyData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="font-bold text-gray-800 mb-4">
                  Distribusi Hasil Analisis
                </h2>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Daun Sehat</span>
                      <span className="font-semibold text-green-700">
                        {historyData.length > 0
                          ? Math.round(
                              (healthyCount / historyData.length) * 100,
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-700"
                        style={{
                          width: `${
                            historyData.length > 0
                              ? (healthyCount / historyData.length) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Terdeteksi Penyakit</span>
                      <span className="font-semibold text-red-600">
                        {historyData.length > 0
                          ? Math.round(
                              (diseaseCount / historyData.length) * 100,
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full transition-all duration-700"
                        style={{
                          width: `${
                            historyData.length > 0
                              ? (diseaseCount / historyData.length) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="animate-fade-in bg-white rounded-2xl shadow-sm p-5 overflow-y-auto">
            <h2 className="font-bold text-gray-800 mb-4">
              5 Riwayat Deteksi Terbaru
            </h2>
            {loadingHistory ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2 w-full">
                      <div className="skeleton h-4 w-full sm:w-3/4 rounded" />
                      <div className="skeleton h-3 w-2/3 sm:w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : historyData.length === 0 ? (
              <div className="text-center py-10">
                <Leaf className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Belum ada riwayat analisis
                </p>
                <button
                  onClick={() => goTo && goTo("analyze")}
                  className="mt-3 text-sm text-green-600 font-semibold hover:underline"
                >
                  Mulai Analisis →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {latestHistory.map((h) => (
                  <div
                    key={h.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 hover:shadow-md hover:border-green-100 transition-all cursor-pointer group"
                  >
                    <div className="flex gap-3 items-center w-full sm:w-auto">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50 shadow-inner">
                        {h.imageUrl ? (
                          <img
                            src={h.imageUrl}
                            alt={h.detectedDisease}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center ${
                              isHealthy(h.detectedDisease)
                                ? "bg-green-50"
                                : "bg-red-50"
                            }`}
                          >
                            {isHealthy(h.detectedDisease) ? (
                              <CheckCircle className="w-8 h-8 text-green-500" />
                            ) : (
                              <AlertCircle className="w-8 h-8 text-red-400" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 sm:hidden">
                        <div className="font-bold text-gray-800 text-sm truncate">
                          {h.detectedDisease}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(h.createdAt)}
                        </div>
                      </div>
                      <div
                        className={`sm:hidden px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                          isHealthy(h.detectedDisease)
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {h.confidence?.toFixed(0)}%
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-1 min-w-0 flex-col">
                      <div className="font-bold text-gray-800 text-base group-hover:text-green-700 transition-colors truncate">
                        {h.detectedDisease}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(h.createdAt)}
                      </div>
                    </div>

                    <div
                      className={`hidden sm:flex px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                        isHealthy(h.detectedDisease)
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {h.confidence?.toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm p-5 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-bold text-gray-800">
                    5 Feedback Terbaru
                  </h2>
                  <p className="text-sm text-gray-500">
                    Menampilkan 5 feedback terbaru dari riwayat Anda.
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  {Math.min(latestFeedback.length, 5)} dari{" "}
                  {feedbackData.length} item
                </div>
              </div>

              {loadingFeedback ? (
                <div className="space-y-3">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-20 rounded-2xl bg-gray-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : feedbackError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  {feedbackError}
                </div>
              ) : feedbackData.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                  Belum ada feedback yang dikirim.
                </div>
              ) : (
                <div className="space-y-3">
                  {latestFeedback.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {feedback.message || "Tidak ada pesan"}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTime(feedback.createdAt)}
                          </p>
                        </div>
                        <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                          {feedback.rating || 0}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="animate-fade-in space-y-4">
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-t-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800 text-sm">
                      Edit Profil
                    </div>
                    <div className="text-xs text-gray-500">
                      Ubah nama dan preferensi
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800 text-sm">
                      Notifikasi
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.notifications !== false ? "Aktif" : "Nonaktif"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const token = getToken();
                      await updateProfile(token, {
                        notifications: editNotifications,
                      });
                      if (setUser) {
                        setUser((prev) => ({
                          ...prev,
                          notifications: editNotifications,
                        }));
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    user?.notifications !== false
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                  role="switch"
                  aria-checked={user?.notifications !== false}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      user?.notifications !== false
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-b-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800 text-sm">
                      Privasi & Keamanan
                    </div>
                    <div className="text-xs text-gray-500">
                      Kelola keamanan akun
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Tindakan Akun
              </h3>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar dari Akun
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditModal(false);
          }}
        >
          <div
            ref={modalRef}
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Edit Profil</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto flex-1 hide-scrollbar">
              {/* Avatar Preview */}
              <div className="flex flex-col items-center gap-3">
                <img
                  src={
                    user?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      editName || user?.email || "User",
                    )}&background=10b981&color=fff&size=128&bold=true`
                  }
                  alt="Preview"
                  className="w-20 h-20 rounded-full shadow-md"
                />
                <span className="text-xs text-gray-400">
                  Avatar dihasilkan otomatis dari nama
                </span>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                  className="input-modern"
                  maxLength={100}
                  autoFocus
                />
              </div>

              {/* Email (readonly) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  className="input-modern opacity-60 cursor-not-allowed"
                  readOnly
                />
                <p className="text-xs text-gray-400 mt-1">
                  Email tidak dapat diubah (terhubung via Google)
                </p>
              </div>

              {/* Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-700">
                    Notifikasi
                  </div>
                  <div className="text-xs text-gray-400">
                    Terima pembaruan dan tips
                  </div>
                </div>
                <button
                  onClick={() => setEditNotifications(!editNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editNotifications ? "bg-green-500" : "bg-gray-300"
                  }`}
                  role="switch"
                  aria-checked={editNotifications}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      editNotifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Error/Success */}
              {saveError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  Profil berhasil diperbarui!
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving || !editName.trim()}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 text-sm"
              >
                {saving ? (
                  <div className="spinner w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
