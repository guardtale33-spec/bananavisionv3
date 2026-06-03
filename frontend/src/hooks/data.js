import { loginWithGooglePopup, getRedirectAuthResult } from "../utils/firebaseClient";
import BASE_URL from "../utils/config";

export const API_ENDPOINTS = {
  LOGIN_GOOGLE: `${BASE_URL}/auth/google`,
  VERIFY_TOKEN: `${BASE_URL}/auth/verify`,
  PROFILE: `${BASE_URL}/auth/profile`,
  ANALYSES: `${BASE_URL}/analyses`,
  ANALYZE_IMAGE: `${BASE_URL}/analyses/analyze`,
  DASHBOARD_STATS: `${BASE_URL}/analyses/dashboard/stats`,
  DASHBOARD_TRENDS: `${BASE_URL}/analyses/dashboard/trends`,
  DISEASES: `${BASE_URL}/diseases`,
  FEEDBACK: `${BASE_URL}/feedbacks`,
  
  // Admin Endpoints
  ADMIN_LOGIN: `${BASE_URL}/admin/login`,
  ADMIN_PROFILE: `${BASE_URL}/admin/profile`,
  ADMIN_STATS: `${BASE_URL}/admin/stats`,
  ADMIN_DISEASES: `${BASE_URL}/admin/diseases`,
  ADMIN_MODELS: `${BASE_URL}/admin/models`,
};

/**
 * Update user profile
 */
export const updateProfile = async (token, profileData) => {
  try {
    const response = await fetch(API_ENDPOINTS.PROFILE, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update profile");
    }

    const data = await response.json();
    return data.data?.user || data.user;
  } catch (err) {
    console.error("Failed to update profile:", err);
    throw err;
  }
};

export const verifyToken = async (token) => {
  try {
    const response = await fetch(API_ENDPOINTS.VERIFY_TOKEN, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Invalid token");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("❌ Token verification error:", err);
    throw err;
  }
};

// Fetch user profile
export const getUserProfile = async (token) => {
  try {
    const response = await fetch(API_ENDPOINTS.PROFILE, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch profile");
    }

    const data = await response.json();
    const userData = data.user || data.data?.user;

    console.log("✅ User profile fetched:", userData?.email);
    return userData;
  } catch (err) {
    console.error("❌ Failed to fetch user profile:", err);
    throw err;
  }
};

export const loginWithGoogle = async () => {
  try {
    // Get ID token dari Google popup
    const idToken = await loginWithGooglePopup();

    if (!idToken) {
      throw new Error("Token tidak diperoleh dari Google");
    }

    console.log("✅ Google authentication berhasil, token diperoleh");

    // Kirim token ke backend untuk verify dan create/update user
    const res = await fetch(API_ENDPOINTS.LOGIN_GOOGLE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();
    console.log("📦 Login response dari backend:", data);

    if (!res.ok) {
      throw new Error(
        data.message || `Login gagal dengan status ${res.status}`,
      );
    }

    // Extract user and token from response
    const userData = data.data?.user || data.user;
    const token = data.data?.token || data.token;

    if (!userData || !token) {
      console.error("❌ Invalid response structure:", data);
      throw new Error(
        "Respons server tidak valid - data pengguna tidak ditemukan",
      );
    }

    console.log("✅ Login berhasil! User:", userData.email);
    return { success: true, user: userData, token };
  } catch (err) {
    console.error("❌ Login error:", err);
    throw new Error(err.message || "Login gagal, coba lagi");
  }
};

export const handleGoogleRedirectResult = async () => {
  try {
    const idToken = await getRedirectAuthResult();
    if (!idToken) return null;

    console.log("✅ Google redirect authentication berhasil, token diperoleh");

    const res = await fetch(API_ENDPOINTS.LOGIN_GOOGLE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();
    console.log("📦 Login response dari backend:", data);

    if (!res.ok) {
      throw new Error(
        data.message || `Login gagal dengan status ${res.status}`,
      );
    }

    const userData = data.data?.user || data.user;
    const token = data.data?.token || data.token;

    if (!userData || !token) {
      console.error("❌ Invalid response structure:", data);
      throw new Error(
        "Respons server tidak valid - data pengguna tidak ditemukan",
      );
    }

    console.log("✅ Login berhasil! User:", userData.email);
    return { success: true, user: userData, token };
  } catch (err) {
    console.error("❌ Redirect login error:", err);
    throw err;
  }
};

/**
 * Get user's analysis history
 */
export const getAnalyses = async (token, params = {}) => {
  try {
    const { limit = 10, skip = 0 } = params;
    const queryParams = new URLSearchParams({ limit, skip });

    const response = await fetch(`${API_ENDPOINTS.ANALYSES}?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch analyses");
    }

    const data = await response.json();
    return data.data;
  } catch (err) {
    console.error("❌ Failed to fetch analyses:", err);
    throw err;
  }
};

/**
 * Get analysis detail by ID
 */
export const getAnalysisById = async (token, id) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ANALYSES}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch analysis detail");
    }

    const data = await response.json();
    return data.data;
  } catch (err) {
    console.error("❌ Failed to fetch analysis detail:", err);
    throw err;
  }
};

/**
 * Delete an analysis
 */
export const deleteAnalysis = async (token, id) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ANALYSES}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete analysis");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("❌ Failed to delete analysis:", err);
    throw err;
  }
};

export const getFeedbacksByUserId = async (token, userId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.FEEDBACK}/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch feedback");
    }

    const data = await response.json();
    return data.data;
  } catch (err) {
    console.error("❌ Failed to fetch feedback:", err);
    throw err;
  }
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (token) => {
  try {
    const response = await fetch(API_ENDPOINTS.DASHBOARD_STATS, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard stats");
    }

    const data = await response.json();
    return data.data;
  } catch (err) {
    console.error("❌ Failed to fetch dashboard stats:", err);
    throw err;
  }
};

/**
 * Get dashboard trends for chart
 */
export const getDashboardTrends = async (token, period = "7d") => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.DASHBOARD_TRENDS}?period=${period}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
         },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard trends");
    }

    const data = await response.json();
    return data.data;
  } catch (err) {
    console.error("❌ Failed to fetch dashboard trends:", err);
    throw err;
  }
};

/**
 * Analyze image for disease detection
 */
export const analyzeImage = async (token, imageBase64, notes = null) => {
  try {
    const response = await fetch(API_ENDPOINTS.ANALYZE_IMAGE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageBase64,
        notes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to analyze image");
    }

    const data = await response.json();
    return data.data;
  } catch (err) {
    console.error("❌ Failed to analyze image:", err);
    throw err;
  }
};

/**
 * Get all diseases
 */
export const getDiseases = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_ENDPOINTS.DISEASES}?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch diseases");
    }

    const data = await response.json();
    return data.data;
  } catch (err) {
    console.error("❌ Failed to fetch diseases:", err);
    throw err;
  }
};

/**
 * Submit feedback
 */
export const submitFeedback = async (token, message, rating) => {
  try {
    const response = await fetch(API_ENDPOINTS.FEEDBACK, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, rating }),
    });

    if (!response.ok) {
      throw new Error("Failed to submit feedback");
    }

    const data = await response.json();
    return data.data;
  } catch (err) {
    console.error("❌ Failed to submit feedback:", err);
    throw err;
  }
};

// ==========================================
// ADMIN API FUNCTIONS
// ==========================================

export const adminLogin = async (email, password) => {
  try {
    const response = await fetch(API_ENDPOINTS.ADMIN_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Gagal masuk sebagai admin");
    }
    return data.data; // contains admin object and token
  } catch (err) {
    console.error("❌ Admin login error:", err);
    throw err;
  }
};

export const getAdminProfile = async (token) => {
  try {
    const response = await fetch(API_ENDPOINTS.ADMIN_PROFILE, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Gagal memuat profil admin");
    }
    return data.data;
  } catch (err) {
    console.error("❌ getAdminProfile error:", err);
    throw err;
  }
};

export const getAdminStats = async (token) => {
  try {
    const response = await fetch(API_ENDPOINTS.ADMIN_STATS, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Gagal memuat statistik admin");
    }
    return data.data;
  } catch (err) {
    console.error("❌ getAdminStats error:", err);
    throw err;
  }
};

export const getAdminDiseases = async (token) => {
  try {
    const response = await fetch(API_ENDPOINTS.ADMIN_DISEASES, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Gagal memuat penyakit admin");
    }
    return data.data;
  } catch (err) {
    console.error("❌ getAdminDiseases error:", err);
    throw err;
  }
};

export const createAdminDisease = async (token, diseaseData) => {
  try {
    const response = await fetch(API_ENDPOINTS.ADMIN_DISEASES, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(diseaseData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Gagal membuat data penyakit");
    }
    return data.data;
  } catch (err) {
    console.error("❌ createAdminDisease error:", err);
    throw err;
  }
};

export const updateAdminDisease = async (token, id, diseaseData) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_DISEASES}/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(diseaseData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Gagal memperbarui data penyakit");
    }
    return data.data;
  } catch (err) {
    console.error("❌ updateAdminDisease error:", err);
    throw err;
  }
};

export const deleteAdminDisease = async (token, id, hard = false) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_DISEASES}/${id}?hard=${hard}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Gagal menghapus penyakit");
    }
    return data.data;
  } catch (err) {
    console.error("❌ deleteAdminDisease error:", err);
    throw err;
  }
};

export const toggleAdminDisease = async (token, id, isActive) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_DISEASES}/${id}/toggle`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Gagal mengubah status aktif");
    }
    return data.data;
  } catch (err) {
    console.error("❌ toggleAdminDisease error:", err);
    throw err;
  }
};

export const getAdminModels = async (token) => {
  try {
    const response = await fetch(API_ENDPOINTS.ADMIN_MODELS, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Gagal memuat model");
    }
    return data.data;
  } catch (err) {
    console.error("❌ getAdminModels error:", err);
    throw err;
  }
};

export const uploadAdminModel = async (token, formData) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_MODELS}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
        // Do NOT set Content-Type header here, browser sets it automatically with form boundary
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Gagal mengunggah model");
    }
    return data.data;
  } catch (err) {
    console.error("❌ uploadAdminModel error:", err);
    throw err;
  }
};

export const activateAdminModel = async (token, id) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_MODELS}/${id}/activate`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Gagal mengaktifkan model");
    }
    return data.data;
  } catch (err) {
    console.error("❌ activateAdminModel error:", err);
    throw err;
  }
};

export const deleteAdminModel = async (token, id) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_MODELS}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Gagal menghapus model");
    }
    return data.data;
  } catch (err) {
    console.error("❌ deleteAdminModel error:", err);
    throw err;
  }
};

export const getAdminModelsHealth = async (token) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_MODELS}/health`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Gagal mengambil status server AI");
    }
    return data.data;
  } catch (err) {
    console.error("❌ getAdminModelsHealth error:", err);
    throw err;
  }
};
