const feedbackService = require('../services/feedback.service');
const { successResponse, errorResponse } = require('../utils/response');

class FeedbackController {
  static async createFeedback(req, res) {
    try {
      const data = { ...req.body, userId: req.user.id };
      const feedback = await feedbackService.createFeedback(data);
      return successResponse(res, feedback, "berhasil membuat feedback", 201);
    } catch (error) {
      errorResponse(res, "gagal membuat feedback", 500, error.message);
    }
  }

  static async getAllFeedbacks(req, res) {
    try {
      const feedbacks = await feedbackService.getFeedbacks();
      return successResponse(res, feedbacks, "berhasil mengambil semua feedback");
    } catch (error) {
      errorResponse(res, "gagal mengambil semua feedback", 500, error.message);
    }
  }

  static async getFeedbacksByUserId(req, res) {
    try {
      const feedbacks = await feedbackService.getFeedbacksByUserId(req.params.userId);
      return successResponse(res, feedbacks, "berhasil mengambil feedback berdasarkan userId", 200);
    } catch (error) {
      errorResponse(res, "gagal mengambil feedback berdasarkan userId", 500, error.message);
    }
  }

  static async updateFeedback(req, res) {
    try {
      const feedback = await feedbackService.updateFeedback(req.params.id, req.body);
      if (!feedback) {
        return errorResponse(res, "feedback tidak ditemukan", 404);
      }
      return successResponse(res, feedback, "berhasil memperbarui feedback", 200);
    } catch (error) {
      errorResponse(res, "gagal memperbarui feedback", 500, error.message);
    }
  }

  static async deleteFeedback(req, res) {
    try {
      const feedback = await feedbackService.deleteFeedback(req.params.id);
      if (!feedback) {
        return errorResponse(res, "feedback tidak ditemukan", 404);
      }
      return successResponse(res, null, "berhasil menghapus feedback", 200);
    } catch (error) {
      errorResponse(res, "gagal menghapus feedback", 500, error.message);
    }
  }
}

module.exports = FeedbackController;