const DiseaseModel = require("../models/diseaseModel");
const prisma = require("../../config/database");

class AdminDiseaseService {
  static async getAllDiseases() {
    // Ambil semua penyakit termasuk yang non-aktif (isActive: false) untuk dikelola admin
    return await prisma.disease.findMany({
      orderBy: { name: "asc" },
    });
  }

  static async createDisease(data) {
    return await DiseaseModel.createDisease({
      name: data.name,
      description: data.description,
      category: data.category,
      severity: data.severity,
      symptoms: data.symptoms || [],
      prevention: data.prevention || [],
      treatment: data.treatment || [],
      imageUrl: data.imageUrl || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
  }

  static async updateDisease(id, data) {
    // Hanya kirim field yang benar-benar ada (filter undefined)
    const updateData = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.severity !== undefined && { severity: data.severity }),
      ...(data.symptoms !== undefined && { symptoms: data.symptoms || [] }),
      ...(data.prevention !== undefined && { prevention: data.prevention || [] }),
      ...(data.treatment !== undefined && { treatment: data.treatment || [] }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };
    return await DiseaseModel.updateDisease(id, updateData);
  }


  static async deleteDisease(id, hardDelete = false) {
    if (hardDelete) {
      return await prisma.disease.delete({
        where: { id },
      });
    }
    return await DiseaseModel.deleteDisease(id);
  }

  static async toggleActive(id, isActive) {
    return await prisma.disease.update({
      where: { id },
      data: { isActive },
    });
  }
}

module.exports = AdminDiseaseService;
