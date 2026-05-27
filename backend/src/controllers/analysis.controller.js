const AnalysisService = require("../services/analysis.service");
const { successResponse, errorResponse } = require("../utils/response");

class AnalysisController {
  static async analyzeImage(req, res) {
    try {

      const userId = req.user.id;
      const { imageBase64, notes } = req.body;

      if (!imageBase64) {
        return errorResponse(res, "gambar kosong / tidak valid", 400);
      }

      const analysis = await AnalysisService.analyzeImage(
        userId,
        imageBase64,
        notes,
      );
      return successResponse(res, analysis, "analisis gambar sukses", 201);
    } catch (error) {
      console.error("analyzeImage error:", error.message, error.code || "");
      return errorResponse(res, "gagal menganalisis gambar", 500, error.message);
    }
  }

  static async createAnalysis(req, res) {
    try {
      const data = req.body;
      const analysis = await AnalysisService.createAnalysis(data);
      return successResponse(res, analysis, "analisis berhasil dibuat", 201);
    } catch (error) {
      return errorResponse(res, "gagal membuat analisis", 500);
    }
  }
  
  static async getAnalysisById(req, res) {
    try {
      const { id } = req.params;
      const analysis = await AnalysisService.getAnalysisById(id);
      return successResponse(res, analysis, "hasil analisis berhasil diambil");
    } catch (error) {
      return errorResponse(res, "gagal mengambil hasil analisis", 404);
    }
  }

  static async getAnalysesByUserId(req, res) {
    try {
      const { userId } = req.params;
      const analyses = await AnalysisService.getAnalysesByUserId(userId);
      return successResponse(res, analyses, "hasil analisis berhasil diambil");
    } catch (error) {
      return errorResponse(res, "gagal mengambil hasil analisis", 500);
    }
  }

  static async deleteAnalysis(req, res) {
    try {
      const { id } = req.params;
      const deletedAnalysis = await AnalysisService.deleteAnalysis(id);
      return successResponse(res, deletedAnalysis, "analisis berhasil dihapus");
    } catch (error) {
      return errorResponse(res, "gagal menghapus analisis", 500);
    }
  }

  static async getAnalyses(req, res) {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
      const skip  = req.query.skip  ? parseInt(req.query.skip,  10) : undefined;

      const analyses = await AnalysisService.getAnalysesByUserId(userId, { limit, skip });
      return successResponse(res, analyses, "hasil analisis berhasil diambil");
    } catch (error) {
      return errorResponse(res, "gagal mengambil hasil analisis", 500);
    }
  }

  static async getDashboardStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await AnalysisService.getDashboardStats(userId);
      return successResponse(
        res,
        stats,
        "Dashboard stats retrieved successfully",
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message || "Failed to retrieve dashboard stats",
        500,
      );
    }
  }

  static async getDashboardTrends(req, res) {
    try {
      const userId = req.user.id;
      const { period } = req.query;
      const trends = await AnalysisService.getDashboardTrends(userId, period);
      return successResponse(
        res,
        trends,
        "Dashboard trends retrieved successfully",
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message || "Failed to retrieve dashboard trends",
        500,
      );
    }
  }
}

module.exports = AnalysisController;
