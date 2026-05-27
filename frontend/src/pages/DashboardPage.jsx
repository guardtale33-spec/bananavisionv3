import React, { useState, useEffect } from "react";
import {
  Camera,
  Activity,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  BookOpen,
  Clock,
  Leaf,
  BarChart2,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { getToken } from "../utils/token";
import {
  getAnalyses,
  getDashboardStats,
  getDashboardTrends,
} from "../hooks/data";

export default function DashboardPage({ setCurrentPage, user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalAnalyses: 0,
    diseasePrevalence: 0,
    healthyCount: 0,
    avgConfidence: 0,
  });
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [trends, setTrends] = useState([]);
  const [trendsPeriod, setTrendsPeriod] = useState("7d");

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = getToken();
      if (!token) {
        setError("Silakan login untuk melihat dashboard");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      // Fetch independently so one failure won't block others
      const [statsResult, analysesResult, trendsResult] =
        await Promise.allSettled([
          getDashboardStats(token),
          getAnalyses(token, { limit: 5 }),
          getDashboardTrends(token, trendsPeriod),
        ]);

      if (statsResult.status === "fulfilled" && statsResult.value) {
        const s = statsResult.value;
        setStats({
          totalAnalyses: s.totalAnalyses ?? 0,
          diseasePrevalence: s.diseasePrevalence ?? 0,
          healthyCount: s.healthyCount ?? 0,
          avgConfidence: s.avgConfidence ?? 0,
        });
      } else {
        console.warn("Stats fetch failed:", statsResult.reason);
      }

      if (analysesResult.status === "fulfilled") {
        setRecentAnalyses(
          Array.isArray(analysesResult.value) ? analysesResult.value : [],
        );
      }

      if (trendsResult.status === "fulfilled") {
        setTrends(Array.isArray(trendsResult.value) ? trendsResult.value : []);
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, [trendsPeriod]);

  const isHealthy = (disease) => {
    const d = disease?.toLowerCase() || "";
    return d.includes("healthy") || d.includes("sehat");
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff} detik lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  };

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  const formatTrendData = (data, period) => {
    if (!Array.isArray(data) || data.length === 0) return [];

    if (period === "30d") {
      const weeks = [0, 7, 14, 21];
      return weeks.map((start, index) => {
        const slice = data.slice(start, start + 7);
        return {
          label: `Minggu ${index + 1}`,
          count: slice.reduce((sum, item) => sum + (item.count || 0), 0),
        };
      });
    }

    if (period === "1y") {
      const monthlyTotals = data.reduce((acc, item) => {
        const monthIndex = new Date(item.date).getMonth();
        acc[monthIndex] = (acc[monthIndex] || 0) + (item.count || 0);
        return acc;
      }, {});

      return monthNames.map((label, monthIndex) => ({
        label,
        count: monthlyTotals[monthIndex] ?? 0,
      }));
    }

    return data.map((item) => ({
      ...item,
      label: item.day,
    }));
  };

  const chartData = formatTrendData(trends, trendsPeriod);
  const maxCount =
    chartData.length > 0 ? Math.max(1, ...chartData.map((t) => t.count)) : 1;
  const hasTrendData = chartData.some((t) => t.count > 0);
  const trendPeriodLabel =
    trendsPeriod === "30d"
      ? "4 minggu"
      : trendsPeriod === "1y"
        ? "12 bulan"
        : "7 hari";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/30 pb-24">
        {/* Hero Skeleton */}
        <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 pt-8 pb-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="skeleton h-8 w-48 rounded-xl mb-2 bg-white/20" />
            <div className="skeleton h-4 w-64 rounded-lg bg-white/10" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 -mt-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-sm w-full">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-1">Gagal Memuat</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/30 pb-24">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 pt-8 pb-16 px-4">
        {/* Decorative circles */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-green-200 text-sm font-medium mb-1 flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-300" />
              </span>
              Sistem aktif & berjalan normal
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Halo, {user?.name?.split(" ")[0] || "Pengguna"} 👋
            </h1>
            <p className="text-green-100 text-sm mt-1">
              Pantau kesehatan tanaman pisang Anda hari ini
            </p>
          </div>
          <button
            onClick={() => setCurrentPage && setCurrentPage("analyze")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-green-700 font-bold rounded-xl shadow-lg hover:bg-green-50 hover:scale-105 transition-all text-sm self-start sm:self-auto flex-shrink-0"
          >
            <Camera className="w-4 h-4" />
            Mulai Analisis
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 mb-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              icon: Activity,
              label: "Total Analisis",
              value: stats.totalAnalyses,
              color: "text-blue-600",
              bg: "bg-blue-50",
              badge: stats.totalAnalyses > 0 ? "Aktif" : null,
              badgeColor: "bg-green-100 text-green-700",
            },
            {
              icon: AlertCircle,
              label: "Prevalensi Penyakit",
              value: `${stats.diseasePrevalence ?? 0}%`,
              color: "text-amber-600",
              bg: "bg-amber-50",
              badge: stats.diseasePrevalence > 0 ? "Monitor" : null,
              badgeColor: "bg-amber-100 text-amber-700",
            },
            {
              icon: TrendingUp,
              label: "Akurasi Model",
              value: `${stats.avgConfidence ?? 0}%`,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              badge: "Stabil",
              badgeColor: "bg-emerald-100 text-emerald-700",
            },
            {
              icon: CheckCircle,
              label: "Daun Sehat",
              value: stats.healthyCount,
              color: "text-green-600",
              bg: "bg-green-50",
              badge: "Sehat",
              badgeColor: "bg-green-100 text-green-700",
            },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  {s.badge && (
                    <span
                      className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${s.badgeColor}`}
                    >
                      {s.badge}
                    </span>
                  )}
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {s.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left: Trends + Recent */}
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
          {/* Trends Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                  <BarChart2 className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-base font-bold text-gray-800">
                  Tren Deteksi
                </h3>
              </div>
              <select
                value={trendsPeriod}
                onChange={(e) => setTrendsPeriod(e.target.value)}
                className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-green-400 cursor-pointer"
              >
                <option value="7d">7 Hari</option>
                <option value="30d">30 Hari</option>
                <option value="1y">1 Tahun</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                <span>
                  {hasTrendData
                    ? `${Math.max(...chartData.map((item) => item.count))} analisis`
                    : "Data tren belum tersedia"}
                </span>
                <span>{trendPeriodLabel}</span>
              </div>
              <div className="h-80">
                {chartData.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                    <BarChart2 className="w-10 h-10 opacity-30" />
                    <p className="text-sm">Belum ada data untuk periode ini</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 8, left: -12, bottom: 10 }}
                    >
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                        padding={{ left: 10, right: 10 }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "1rem",
                          border: "1px solid #e5e7eb",
                          backgroundColor: "#ffffff",
                          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                        }}
                        labelStyle={{ color: "#111827", fontWeight: "700" }}
                        formatter={(value) => [`${value} analisis`, "Total"]}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12, color: "#6b7280" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Analisis"
                        stroke="#16a34a"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#16a34a" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-800">
                  Analisis Terbaru
                </h3>
              </div>
              <button
                onClick={() => setCurrentPage && setCurrentPage("history")}
                className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors"
              >
                Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentAnalyses.length === 0 ? (
              <div className="text-center py-10">
                <Leaf className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-medium">
                  Belum ada riwayat analisis
                </p>
                <button
                  onClick={() => setCurrentPage && setCurrentPage("analyze")}
                  className="mt-3 text-sm text-green-600 font-semibold hover:underline"
                >
                  Mulai sekarang →
                </button>
              </div>
            ) : (
              <div className="space-y-2" h="300px" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {recentAnalyses.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-green-50/50 hover:border-green-100 border border-transparent transition-all group"
                  >
                    {/* Thumbnail */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.detectedDisease}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isHealthy(item.detectedDisease) ? "bg-green-50" : "bg-red-50"}`}
                      >
                        {isHealthy(item.detectedDisease) ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-green-700 transition-colors">
                        {item.detectedDisease}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatTime(item.createdAt)}
                      </p>
                    </div>

                    {/* Badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          isHealthy(item.detectedDisease)
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.confidence?.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-base font-bold text-gray-800">Aksi Cepat</h3>
            </div>
            <div className="flex flex-col gap-3">
              {[
                {
                  page: "analyze",
                  icon: Camera,
                  iconBg: "bg-green-50",
                  iconColor: "text-green-600",
                  hoverBorder: "hover:border-green-300",
                  hoverBg: "hover:bg-green-50/50",
                  title: "Analisis Baru",
                  desc: "Scan daun pisang Anda",
                },
                {
                  page: "diseases",
                  icon: BookOpen,
                  iconBg: "bg-blue-50",
                  iconColor: "text-blue-600",
                  hoverBorder: "hover:border-blue-300",
                  hoverBg: "hover:bg-blue-50/50",
                  title: "Katalog Penyakit",
                  desc: "Pelajari gejala & penanganan",
                },
                {
                  page: "history",
                  icon: Clock,
                  iconBg: "bg-amber-50",
                  iconColor: "text-amber-600",
                  hoverBorder: "hover:border-amber-300",
                  hoverBg: "hover:bg-amber-50/50",
                  title: "Riwayat Analisis",
                  desc: "Lihat semua hasil sebelumnya",
                },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.page}
                    onClick={() =>
                      setCurrentPage && setCurrentPage(action.page)
                    }
                    className={`flex items-center gap-4 p-4 rounded-xl border border-gray-100 ${action.hoverBorder} ${action.hoverBg} transition-all group text-left`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl ${action.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`w-5 h-5 ${action.iconColor}`} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">
                        {action.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {action.desc}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-gray-500 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary mini-card */}
          <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 rounded-2xl p-5 text-white">
            <h4 className="font-bold text-base mb-1 flex items-center gap-2">
              <Leaf className="w-4 h-4" /> Ringkasan Kebun
            </h4>
            <p className="text-green-100 text-xs mb-4">
              Berdasarkan data analisis Anda
            </p>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-green-100">Daun Sehat</span>
                  <span className="font-bold">
                    {stats.totalAnalyses > 0
                      ? Math.round(
                          (stats.healthyCount / stats.totalAnalyses) * 100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{
                      width: `${stats.totalAnalyses > 0 ? (stats.healthyCount / stats.totalAnalyses) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-green-100">Terdeteksi Penyakit</span>
                  <span className="font-bold">
                    {stats.diseasePrevalence ?? 0}%
                  </span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-300 rounded-full transition-all duration-700"
                    style={{ width: `${stats.diseasePrevalence ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
