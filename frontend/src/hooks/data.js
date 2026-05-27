import { loginWithGooglePopup } from "../utils/firebaseClient";
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
