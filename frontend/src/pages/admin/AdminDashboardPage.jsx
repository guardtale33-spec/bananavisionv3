import { useState, useEffect } from "react";
import { getAdminStats } from "../../hooks/data";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Users, FileSearch, MessageSquare, ShieldAlert, Clock, Star } from "lucide-react";

export default function AdminDashboardPage({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await getAdminStats(token);
        setStats(data);
      } catch (err) {
        setError(err.message || "Gagal memuat statistik dashboard");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <LoadingSpinner size="lg" color="green" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/40 border border-red-900/60 p-6 rounded-2xl text-center max-w-lg mx-auto mt-12">
        <h3 className="text-red-400 font-semibold mb-2">Terjadi Kesalahan</h3>
        <p className="text-slate-400 text-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-900 hover:bg-red-800 text-white text-xs px-4 py-2 rounded-lg font-medium transition-all"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { stats: summary, diseaseDistribution = {}, recentAnalyses = [], recentFeedbacks = [] } = stats || {};

  const cardItems = [
    {
      title: "Total Pengguna",
      value: summary?.totalUsers || 0,
      icon: Users,
      color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-400"
    },
    {
      title: "Total Analisis",
      value: summary?.totalAnalyses || 0,
      icon: FileSearch,
      color: "from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-400"
    },
    {
      title: "Masukan Pengguna",
      value: summary?.totalFeedbacks || 0,
      icon: MessageSquare,
      color: "from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-400"
    },
    {
      title: "Penyakit Aktif",
      value: summary?.totalDiseases || 0,
      icon: ShieldAlert,
      color: "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400"
    }
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in text-slate-200">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard Admin</h1>
        <p className="text-slate-400 text-sm mt-1">
          Pantau performa sistem BananaVision secara real-time.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cardItems.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className={`bg-gradient-to-br ${c.color} border rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-slate-950/40 hover:-translate-y-1 transition-all duration-300`}
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.title}</p>
                <p className="text-3xl font-extrabold text-white mt-1.5">{c.value}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Disease Distribution & Recent Feedbacks */}
        <div className="lg:col-span-6 flex flex-col gap-8">
          
          {/* Disease Distribution */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Distribusi Hasil Analisis</h2>
            {Object.keys(diseaseDistribution).length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">Belum ada data analisis.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {Object.entries(diseaseDistribution).map(([disease, count]) => {
                  const percentage = summary?.totalAnalyses > 0 ? Math.round((count / summary.totalAnalyses) * 100) : 0;
                  return (
                    <div key={disease}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">{disease}</span>
                        <span className="text-slate-400">{count} deteksi ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentage}%` }}
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Feedback */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4">Ulasan Pengguna Terbaru</h2>
            {recentFeedbacks.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center flex-1 flex items-center justify-center">
                Belum ada ulasan masuk.
              </p>
            ) : (
              <div className="flex flex-col gap-4 flex-1">
                {recentFeedbacks.map((f, i) => (
                  <div key={i} className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-4 flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center font-bold text-slate-300 text-sm">
                      {f.user?.name ? f.user.name.substring(0, 2).toUpperCase() : "US"}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-slate-300 truncate">{f.user?.name || f.user?.email}</h4>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, starIndex) => (
                            <Star
                              key={starIndex}
                              className={`w-3.5 h-3.5 ${
                                starIndex < (f.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{f.message}</p>
                      <p className="text-[10px] text-slate-600 mt-2">
                        {new Date(f.createdAt).toLocaleDateString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Analysis Logs */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl h-full flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4">Log Deteksi Terbaru</h2>
            {recentAnalyses.length === 0 ? (
              <p className="text-slate-500 text-sm py-12 text-center flex-1 flex items-center justify-center">
                Belum ada aktivitas deteksi.
              </p>
            ) : (
              <div className="flex flex-col gap-4 flex-1">
                {recentAnalyses.map((a, i) => (
                  <div
                    key={i}
                    className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      {a.imageUrl ? (
                        <img
                          src={a.imageUrl}
                          alt="Deteksi"
                          className="w-12 h-12 rounded-lg object-cover border border-slate-800 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center text-slate-600">
                          <FileSearch className="w-6 h-6" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold text-slate-200 truncate">{a.detectedDisease}</h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">Oleh: {a.user?.name || a.user?.email}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(a.createdAt).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-extrabold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20 shadow-inner">
                        {Math.round(a.confidence)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
