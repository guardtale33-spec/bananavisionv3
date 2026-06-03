import React, { useState, useRef, useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Navigation from "./components/Navigation";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import AnalyzePage from "./pages/AnalyzePage";
import HistoryPage from "./pages/HistoryPage";
import DiseasesPage from "./pages/DiseasesPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import SplashScreen from "./components/SplashScreen";
import InstallPrompt from "./components/InstallPrompt";
import OfflineIndicator from "./components/OfflineIndicator";
import { getToken, saveToken, removeToken } from "./utils/token";
import { getUserProfile, analyzeImage, handleGoogleRedirectResult, getAdminProfile } from "./hooks/data";

// Admin Imports
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminDiseasesPage from "./pages/admin/AdminDiseasesPage";
import AdminModelsPage from "./pages/admin/AdminModelsPage";
import AdminLayout from "./components/admin/AdminLayout";

const InnerApp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentPage, setCurrentPage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [token, setToken] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // Cegah flash redirect saat refresh

  // Admin States
  const [adminToken, setAdminToken] = useState(() => {
    const token = localStorage.getItem("adminToken");
    return token && token !== "undefined" && token !== "null" ? token : null;
  });
  const [admin, setAdmin] = useState(null);

  const pathMap = {
    home: "/",
    login: "/login",
    dashboard: "/dashboard",
    analyze: "/analyze",
    history: "/history",
    diseases: "/diseases",
    profile: "/profile",
  };

  useEffect(() => {
    if (!location || !location.pathname) return;
    const path = location.pathname;
    const found = Object.entries(pathMap).find(
      ([, p]) => p === path || path.startsWith(p + "/"),
    );
    if (found) setCurrentPage(found[0]);
    else if (path === "/") setCurrentPage("home");
  }, [location]);

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setToken(false);
    navigate("/");
  };

  useEffect(() => {
    // Skip user auth logic entirely when on admin routes
    if (location.pathname.startsWith("/admin")) {
      setAuthLoading(false);
      return;
    }

    const storedToken = getToken();
    if (storedToken) {
      setToken(true);
      
      getUserProfile(storedToken)
        .then((userData) => {
          setUser(userData);
        })
        .catch((err) => {
          console.error("Failed to fetch user:", err);
          removeToken();
          setUser(null);
          setToken(false);
        })
        .finally(() => {
          setAuthLoading(false);
        });
    } else {
      // Check if user has just returned from Google sign-in redirect
      handleGoogleRedirectResult()
        .then((result) => {
          if (result) {
            handleLogin({ user: result.user, token: result.token });
          }
        })
        .catch((err) => {
          console.error("❌ Redirect login error:", err);
        })
        .finally(() => {
          setAuthLoading(false);
        });
    }
  }, []);

  const handleLogin = ({ user, token }) => {
    saveToken(token);
    setUser(user);
    setToken(true);
    navigate("/");
  };

  // Admin profile loader
  useEffect(() => {
    if (adminToken) {
      getAdminProfile(adminToken)
        .then((adminData) => {
          setAdmin(adminData);
        })
        .catch((err) => {
          console.error("Failed to fetch admin:", err);
          handleAdminLogout();
        });
    }
  }, [adminToken]);

  const handleAdminLogin = (data) => {
    localStorage.setItem("adminToken", data.token);
    setAdminToken(data.token);
    setAdmin(data.admin);
    navigate("/admin");
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    setAdminToken(null);
    setAdmin(null);
    navigate("/admin/login");
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setResult(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    try {
      setAnalyzing(true);
      const currentToken = getToken();

      // Convert selected image to base64 without prefix
      const base64String = selectedImage.split(",")[1];

      const analysisResult = await analyzeImage(currentToken, base64String);

      // Check if analysis failed due to ML server issues
      if (
        analysisResult.detectedDisease?.includes("Error: ML Server Unavailable")
      ) {
        setResult({
          disease: "Server Error",
          confidence: 0,
          severity: "error",
          message:
            "Server machine learning tidak dapat diakses. Silakan coba lagi dalam beberapa saat.",
        });
        return;
      }

      // Check if the image is not a banana leaf/stem
      if (analysisResult.isBanana === false) {
        setResult({
          disease: "Bukan Daun/Batang Pisang",
          confidence: analysisResult.confidence,
          severity: "not_banana",
          message:
            "Gambar yang Anda unggah bukan daun atau batang pisang. Silakan unggah foto daun atau batang pisang untuk mendapatkan hasil analisis yang akurat.",
        });
        return;
      }

      // Map API response to UI format
      setResult({
        disease: analysisResult.detectedDisease,
        confidence: analysisResult.confidence,
        severity: analysisResult.detectedDisease
          .toLowerCase()
          .includes("healthy")
          ? "healthy"
          : analysisResult.severity === "Berat"
            ? "danger"
            : "warning",
        category: analysisResult.category,
        predictions: analysisResult.predictions,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      setResult({
        disease: "Error",
        confidence: 0,
        severity: "error",
        message: error.message || "Gagal menganalisis gambar",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const goTo = (page) => {
    setCurrentPage(page);
    const path = pathMap[page] || "/";
    navigate(path);
    setSidebarOpen(false);
  };

  const isAdminRoute = location.pathname.startsWith("/admin");

  // Tampilkan spinner saat auth sedang dicek (cegah flash redirect)
  const LoadingFallback = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Conditionally show Navigation header only for public/user routes */}
      {!isAdminRoute && (
        <Navigation
          user={token !== false ? user : null}
          currentPage={currentPage}
          setCurrentPage={goTo}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          handleLogout={handleLogout}
        />
      )}

      <Routes>
        {/* Public User Routes */}
        <Route path="/" element={<HomePage goTo={goTo} />} />
        <Route path="/diseases" element={<DiseasesPage />} />
        <Route 
          path="/login" 
          element={
            token !== false ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage handleLogin={handleLogin} setCurrentPage={goTo} />
            )
          } 
        />

        {/* Protected User Routes — tampilkan loading saat auth sedang dicek */}
        <Route 
          path="/dashboard" 
          element={
            authLoading ? <LoadingFallback /> :
            token !== false ? (
              <DashboardPage setCurrentPage={goTo} user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route
          path="/analyze"
          element={
            authLoading ? <LoadingFallback /> :
            token !== false ? (
              <AnalyzePage
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                analyzing={analyzing}
                result={result}
                setResult={setResult}
                handleImageSelect={handleImageSelect}
                handleAnalyze={handleAnalyze}
                setCurrentPage={goTo}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route 
          path="/history" 
          element={
            authLoading ? <LoadingFallback /> :
            token !== false ? (
              <HistoryPage setCurrentPage={goTo} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route
          path="/profile"
          element={
            authLoading ? <LoadingFallback /> :
            token !== false ? (
              <ProfilePage
                user={user}
                setUser={setUser}
                goTo={goTo}
                handleLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Login Route */}
        <Route
          path="/admin/login"
          element={
            adminToken ? (
              <Navigate to="/admin" replace />
            ) : (
              <AdminLoginPage
                handleAdminLogin={handleAdminLogin}
                onBackToUser={() => navigate("/")}
              />
            )
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            adminToken ? (
              <AdminLayout admin={admin} handleAdminLogout={handleAdminLogout}>
                <AdminDashboardPage token={adminToken} />
              </AdminLayout>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/diseases"
          element={
            adminToken ? (
              <AdminLayout admin={admin} handleAdminLogout={handleAdminLogout}>
                <AdminDiseasesPage token={adminToken} />
              </AdminLayout>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/models"
          element={
            adminToken ? (
              <AdminLayout admin={admin} handleAdminLogout={handleAdminLogout}>
                <AdminModelsPage token={adminToken} />
              </AdminLayout>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to={isAdminRoute ? "/admin" : "/"} replace />} />
      </Routes>

      {!isAdminRoute && <InstallPrompt />}
      {!isAdminRoute && <OfflineIndicator />}
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <InnerApp />
  </BrowserRouter>
);

const AppWithSplash = () => {
  const [showSplash, setShowSplash] = React.useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1800); // backup timeout
    return () => clearTimeout(t);
  }, []);

  return showSplash ? (
    <SplashScreen onComplete={() => setShowSplash(false)} />
  ) : (
    <App />
  );
};

export default AppWithSplash;
