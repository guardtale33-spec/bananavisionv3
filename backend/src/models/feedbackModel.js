const prisma = require("../../config/database");

class FeedbackModel {
  static async createFeedback(data) {
    return await prisma.feedback.create({
      data,
    });
  }

  static async getFeedbacks() {
    return await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async getFeedbacksByUserId(userId) {
    return await prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateFeedback(id, data) {
    return await prisma.feedback.update({
      where: { id },
      data,
    });
  }

  static async deleteFeedback(id) {
    return await prisma.feedback.delete({
      where: { id },
    });
  }
}

module.exports = FeedbackModel;
