const AdminService = require("../services/admin.service");
const prisma = require("../../config/database");
const { successResponse, errorResponse } = require("../utils/response");

class AdminController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return errorResponse(res, "Email dan password wajib diisi", 400);
      }

      const result = await AdminService.login(email, password);
      return successResponse(res, result, "Login admin berhasil");
    } catch (error) {
      console.error("Admin login error:", error.message);
      return errorResponse(res, error.message || "Gagal login admin", 401);
    }
  }

  static async getProfile(req, res) {
    try {
      const admin = await AdminService.getProfile(req.user.id);
      return successResponse(res, admin, "Berhasil mengambil profil admin");
    } catch (error) {
      console.error("Admin profile error:", error.message);
      return errorResponse(res, error.message || "Gagal mengambil profil admin", 404);
    }
  }

  static async getDashboardStats(req, res) {
    try {
      const totalUsers = await prisma.user.count({ where: { isDeleted: false } });
      const totalAnalyses = await prisma.analysis.count({ where: { isDeleted: false } });
      const totalFeedbacks = await prisma.feedback.count();
      const totalDiseases = await prisma.disease.count({ where: { isActive: true } });

      // Get count by disease
      const analyses = await prisma.analysis.findMany({
        where: { isDeleted: false },
        select: { detectedDisease: true }
      });

      const diseaseStats = {};
      analyses.forEach(a => {
        diseaseStats[a.detectedDisease] = (diseaseStats[a.detectedDisease] || 0) + 1;
      });

      // Get recent 5 analyses
      const recentAnalyses = await prisma.analysis.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: {
            select: { name: true, email: true, avatar: true }
          }
        }
      });

      // Get recent 5 feedbacks
      const recentFeedbacks = await prisma.feedback.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: {
            select: { name: true, email: true, avatar: true }
          }
        }
      });

      return successResponse(res, {
        stats: {
          totalUsers,
          totalAnalyses,
          totalFeedbacks,
          totalDiseases
        },
        diseaseDistribution: diseaseStats,
        recentAnalyses,
        recentFeedbacks
      }, "Berhasil mengambil statistik dashboard admin");
    } catch (error) {
      console.error("Dashboard stats error:", error.message);
      return errorResponse(res, error.message || "Gagal mengambil statistik dashboard", 500);
    }
  }
}

module.exports = AdminController;
