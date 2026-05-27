const FeedbackModel = require("../models/feedbackModel");

class FeedbackService {
  static async createFeedback(data) {
    try {
      return await FeedbackModel.createFeedback(data);
    } catch (error) {
      console.error("gagal membuat feedback:", error);
      throw new Error("gagal membuat feedback");
    }
  }

  static async getFeedbacks() {
    try {
      return await FeedbackModel.getFeedbacks();
    } catch (error) {
      console.error("gagal mengambil feedback:", error);
      throw new Error("gagal mengambil feedback");
    }
  }

  static async getFeedbacksByUserId(userId) {
    try {
      return await FeedbackModel.getFeedbacksByUserId(userId);
    } catch (error) {
      console.error("gagal mengambil feedback berdasarkan userId:", error);
      throw new Error("gagal mengambil feedback berdasarkan userId");
    }
  }

  static async updateFeedback(id, data) {
    try {
      return await FeedbackModel.updateFeedback(id, data);
    } catch (error) {
      console.error("gagal memperbarui feedback:", error);
      throw new Error("gagal memperbarui feedback");
    }
  }

  static async deleteFeedback(id) {
    try {
      return await FeedbackModel.deleteFeedback(id);
    } catch (error) {
      console.error("gagal menghapus feedback:", error);
      throw new Error("gagal menghapus feedback");
    }
  }
}

module.exports = FeedbackService;
