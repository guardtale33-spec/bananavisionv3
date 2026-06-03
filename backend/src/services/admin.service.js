const AdminModel = require("../models/adminModel");
const { generateToken } = require("../utils/jwt");
const bcrypt = require("bcryptjs");

class AdminService {
  static async login(email, password) {
    let admin = await AdminModel.findByEmail(email);
    if (!admin && email === "admin@bananavision.com" && password === "admin123") {
      const adminCount = await AdminModel.count();
      if (adminCount === 0) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await AdminModel.create({
          email: "admin@bananavision.com",
          password: hashedPassword,
          name: "Super Admin",
          role: "admin",
        });
        admin = await AdminModel.findByEmail(email);
      }
    }

    if (!admin) {
      throw new Error("Email atau password admin salah");
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw new Error("Email atau password admin salah");
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      token,
    };
  }

  static async getProfile(adminId) {
    const admin = await AdminModel.findById(adminId);
    if (!admin) {
      throw new Error("Admin tidak ditemukan");
    }
    return admin;
  }
}

module.exports = AdminService;
