const prisma = require("../../config/database");

class AnalysisModel {
  static async createAnalysis(data) {
    return await prisma.analysis.create({
      data,
    });
  }

  static async getAnalysisById(id) {
    return await prisma.analysis.findUnique({
      where: { id },
    });
  }

  /**
   * @param {string} userId
   * @param {{ limit?: number, skip?: number }} opts
   */
  static async getAnalysesByUserId(userId, opts = {}) {
    const { limit, skip } = opts;
    return await prisma.analysis.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: "desc" },
      ...(limit !== undefined ? { take: Number(limit) } : {}),
      ...(skip !== undefined ? { skip: Number(skip) } : {}),
    });
  }

  static async countByUserId(userId) {
    return await prisma.analysis.count({
      where: { userId, isDeleted: false },
    });
  }

  static async deleteAnalysis(id) {
    return await prisma.analysis.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }
}

module.exports = AnalysisModel;
