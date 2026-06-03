const AnalysisModel = require("../models/analysisModel");
const DiseaseModel = require("../models/diseaseModel");
const axios = require("axios");

const ML_SERVER_URL = (
  process.env.ML_SERVER_URL || "http://localhost:8000"
).replace(/\/$/, "");

class AnalysisService {
  static async analyzeImage(userId, imageBase64, notes = null) {
    try {
      // Call Python ML server for prediction
      const mlResponse = await axios.post(
        `${ML_SERVER_URL}/api/predict`,
        {
          image: imageBase64,
        },
        {
          timeout: 30000, // 30 second timeout
        },
      );

      if (!mlResponse.data.success) {
        throw new Error("ML prediction failed");
      }

      const predictionData = mlResponse.data.data;

      // If the image is not a banana leaf/stem, return immediately
      // without saving to the analysis history
      if (predictionData.is_banana === false) {
        return {
          isBanana: false,
          detectedDisease: predictionData.detectedDisease,
          category: predictionData.category,
          severity: predictionData.severity,
          confidence: predictionData.confidence,
          predictions: predictionData.predictions,
        };
      }

      // Get or create disease record
      let disease = await DiseaseModel.getDiseaseByName(
        predictionData.detectedDisease,
      );

      // Create analysis record — gambar tidak disimpan di DB (mencegah bloat)
      // Frontend sudah memiliki gambar secara lokal
      const analysis = await AnalysisModel.createAnalysis({
        userId,
        imageUrl: null,
        detectedDisease: predictionData.detectedDisease,
        diseaseId: disease ? disease.id : null,
        confidence: predictionData.confidence,
        status: "completed",
        predictions: predictionData.predictions,
        notes,
      });

      return { ...analysis, isBanana: true };
    } catch (error) {
      if (error.response?.data) {
        console.error("ML Server Error Details:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("ML Server Error:", error.message);
      }

      // If ML server is unavailable, create analysis with error status
      if (
        error.code === "ECONNREFUSED" ||
        error.code === "ENOTFOUND" ||
        error.code === "ETIMEDOUT" ||
        error.code === "ECONNABORTED" ||
        error.response?.status >= 500
      ) {
        const analysis = await AnalysisModel.createAnalysis({
          userId,
          imageUrl: null,
          detectedDisease: "Error: ML Server Unavailable",
          diseaseId: null,
          confidence: 0,
          status: "failed",
          predictions: [],
          notes: "ML server tidak dapat diakses. Silakan coba lagi nanti.",
        });
        return analysis;
      }

      throw error;
    }
  }

  static async createAnalysis(data) {
    try {
      return await AnalysisModel.createAnalysis(data);
    } catch (error) {
      throw error;
    }
  }

  static async getAnalysisById(id) {
    try {
      const analysis = await AnalysisModel.getAnalysisById(id);
      if (!analysis) {
        throw new Error("Analysis not found");
      }
      return analysis;
    } catch (error) {
      throw error;
    }
  }

  static async getAnalysesByUserId(userId, opts = {}) {
    return await AnalysisModel.getAnalysesByUserId(userId, opts);
  }

  static async deleteAnalysis(id) {
    return await AnalysisModel.deleteAnalysis(id);
  }

  static async getDashboardStats(userId) {
    try {
      // Fetch all analyses without pagination for accurate stats
      const analyses = await AnalysisModel.getAnalysesByUserId(userId);

      // Hanya hitung analisis yang berhasil (bukan yang gagal karena ML server down)
      const completedAnalyses = analyses.filter((a) => a.status === "completed");
      const totalAnalyses = completedAnalyses.length;
      let healthyCount = 0;
      let totalConfidence = 0;
      let diseaseCount = 0;

      completedAnalyses.forEach((analysis) => {
        const isHealthy =
          analysis.detectedDisease?.toLowerCase() === "healthy" ||
          analysis.detectedDisease?.toLowerCase() === "sehat" ||
          analysis.detectedDisease?.toLowerCase() === "healthy leaf";
        if (isHealthy) {
          healthyCount++;
        } else {
          diseaseCount++;
        }
        totalConfidence += analysis.confidence || 0;
      });

      const avgConfidence =
        totalAnalyses > 0 ? totalConfidence / totalAnalyses : 0;
      const diseasePrevalence =
        totalAnalyses > 0 ? (diseaseCount / totalAnalyses) * 100 : 0;

      return {
        totalAnalyses,
        diseasePrevalence: parseFloat(diseasePrevalence.toFixed(1)),
        healthyCount,
        avgConfidence: parseFloat(avgConfidence.toFixed(1)),
      };
    } catch (error) {
      throw error;
    }
  }

  static async getDashboardTrends(userId, period = "7d") {
    try {
      const analyses = await AnalysisModel.getAnalysesByUserId(userId);

      const trends = [];
      const now = new Date();
      let days = 7;

      if (period === "30d") days = 30;
      if (period === "1y" || period === "365d") days = 365;

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const count = analyses.filter((a) => {
          const analysisDate = new Date(a.createdAt).toISOString().slice(0, 10);
          return analysisDate === dateStr;
        }).length;

        trends.push({
          day: date.toLocaleDateString("id-ID", { weekday: "short" }),
          date: dateStr,
          count,
        });
      }

      return trends;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AnalysisService;
