const prisma = require('../../config/database');

class UserModel {

  static async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  static async findByProviderId(providerId) {
    return await prisma.user.findFirst({
      where: { providerId },
    });
  }

  static async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        notifications: true,
        language: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  static async create(data) {
    return await prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        notifications: true,
        language: true,
        createdAt: true,
      },
    });
  }

  static async update(id, data) {
    return await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        notifications: true,
        language: true,
        updatedAt: true,
      },
    });
  }

  static async updateLastLogin(id) {
    return await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  static async delete(id) {
    return await prisma.user.delete({
      where: { id },
    });
  }
}

module.exports = UserModel;