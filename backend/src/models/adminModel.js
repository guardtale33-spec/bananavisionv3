const prisma = require("../../config/database");

class AdminModel {
  static async findByEmail(email) {
    return await prisma.admin.findUnique({
      where: { email },
    });
  }

  static async findById(id) {
    return await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  static async create(data) {
    return await prisma.admin.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  static async update(id, data) {
    return await prisma.admin.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  static async count() {
    return await prisma.admin.count();
  }
}

module.exports = AdminModel;
