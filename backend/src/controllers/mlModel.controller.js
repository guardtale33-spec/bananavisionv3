const MlModelService = require("../services/mlModel.service");
const { successResponse, errorResponse } = require("../utils/response");

class MlModelController {
  static async getModels(req, res) {
    try {
      const models = await MlModelService.getModels();
      return successResponse(res, models, "Berhasil mengambil data model ML");
    } catch (error) {
      console.error("Error get models:", error.message);
      return errorResponse(res, error.message || "Gagal mengambil data model", 500);
    }
  }

  static async activateModel(req, res) {
    try {
      const { id } = req.params;
      const updated = await MlModelService.activateModel(id);
      return successResponse(res, updated, `Model '${updated.name}' berhasil diaktifkan`);
    } catch (error) {
      console.error("Error activate model:", error.message);
      return errorResponse(res, error.message || "Gagal mengaktifkan model", 500);
    }
  }

  static async uploadModel(req, res) {
    try {
      if (!req.file) {
        return errorResponse(res, "Tidak ada file model .keras yang diunggah", 400);
      }

      const { name, modelType } = req.body;
      if (!name || !modelType) {
        return errorResponse(res, "Field name dan modelType wajib diisi", 400);
      }

      const filename = req.file.filename;
      const fileSize = req.file.size;

      const registered = await MlModelService.registerUploadedModel(
        name,
        filename,
        modelType,
        fileSize
      );

      return successResponse(res, registered, "Model berhasil diunggah dan didaftarkan", 201);
    } catch (error) {
      console.error("Error upload model:", error.message);
      return errorResponse(res, error.message || "Gagal mengunggah model", 500);
    }
  }

  static async deleteModel(req, res) {
    try {
      const { id } = req.params;
      await MlModelService.deleteModel(id);
      return successResponse(res, null, "Model berhasil dihapus");
    } catch (error) {
      console.error("Error delete model:", error.message);
      return errorResponse(res, error.message || "Gagal menghapus model", 500);
    }
  }

  static async getHealth(req, res) {
    try {
      const health = await MlModelService.getHealth();
      return successResponse(res, health, "Berhasil mengecek status server AI");
    } catch (error) {
      console.error("Error check AI server health:", error.message);
      return errorResponse(res, error.message || "Gagal mengecek status server AI", 500);
    }
  }
}

module.exports = MlModelController;
