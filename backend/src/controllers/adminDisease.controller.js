const AdminDiseaseService = require("../services/adminDisease.service");
const { successResponse, errorResponse } = require("../utils/response");

class AdminDiseaseController {
  static async getDiseases(req, res) {
    try {
      const diseases = await AdminDiseaseService.getAllDiseases();
      return successResponse(res, diseases, "Berhasil mengambil semua data penyakit");
    } catch (error) {
      console.error("Error get admin diseases:", error.message);
      return errorResponse(res, error.message || "Gagal mengambil data penyakit", 500);
    }
  }

  static async createDisease(req, res) {
    try {
      const { name, description, category, severity, symptoms, prevention, treatment, imageUrl, isActive } = req.body;
      
      if (!name || !description || !category || !severity) {
        return errorResponse(res, "Field name, description, category, dan severity wajib diisi", 400);
      }

      const newDisease = await AdminDiseaseService.createDisease({
        name,
        description,
        category,
        severity,
        symptoms,
        prevention,
        treatment,
        imageUrl,
        isActive
      });

      return successResponse(res, newDisease, "Berhasil menambahkan data penyakit baru", 201);
    } catch (error) {
      console.error("Error create disease:", error.message);
      return errorResponse(res, error.message || "Gagal menambahkan data penyakit", 500);
    }
  }

  static async updateDisease(req, res) {
    try {
      const { id } = req.params;
      const { name, description, category, severity, symptoms, prevention, treatment, imageUrl, isActive } = req.body;

      const updatedDisease = await AdminDiseaseService.updateDisease(id, {
        name,
        description,
        category,
        severity,
        symptoms,
        prevention,
        treatment,
        imageUrl,
        isActive
      });

      return successResponse(res, updatedDisease, "Berhasil memperbarui data penyakit");
    } catch (error) {
      console.error("Error update disease:", error.message);
      return errorResponse(res, error.message || "Gagal memperbarui data penyakit", 500);
    }
  }

  static async deleteDisease(req, res) {
    try {
      const { id } = req.params;
      const hard = req.query.hard === "true";

      const result = await AdminDiseaseService.deleteDisease(id, hard);
      return successResponse(res, result, hard ? "Berhasil menghapus data penyakit secara permanen" : "Berhasil menonaktifkan data penyakit (soft-delete)");
    } catch (error) {
      console.error("Error delete disease:", error.message);
      return errorResponse(res, error.message || "Gagal menghapus data penyakit", 500);
    }
  }

  static async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        return errorResponse(res, "Status isActive wajib diisi", 400);
      }

      const result = await AdminDiseaseService.toggleActive(id, isActive);
      return successResponse(res, result, `Berhasil mengubah status aktif penyakit menjadi ${isActive}`);
    } catch (error) {
      console.error("Error toggle active disease:", error.message);
      return errorResponse(res, error.message || "Gagal mengubah status aktif penyakit", 500);
    }
  }
}

module.exports = AdminDiseaseController;
