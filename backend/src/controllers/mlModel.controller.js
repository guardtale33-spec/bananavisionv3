const MlModelService = require("../services/mlModel.service");
const { successResponse, errorResponse } = require("../utils/response");
const { uploadToSupabase } = require("../utils/supabaseStorage");
const fs = require("fs");

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
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return errorResponse(res, "Field name dan modelType wajib diisi", 400);
      }

      const filename = req.file.filename;
      const fileSize = req.file.size;

      // Upload to Supabase if configured
      let uploadUrl = null;
      try {
        uploadUrl = await uploadToSupabase(req.file.path, filename);
        // Clean up local temp file
        if (uploadUrl && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadErr) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        throw uploadErr;
      }

      const registered = await MlModelService.registerUploadedModel(
        name,
        filename,
        modelType,
        fileSize
      );

      // Auto-activate if no model is currently active
      let autoActivated = false;
      try {
        const currentActive = await MlModelService.getActiveModel();
        if (!currentActive) {
          console.log(`🤖 No active model found — auto-activating '${filename}'...`);
          await MlModelService.activateModel(registered.id);
          autoActivated = true;
          console.log(`✅ Auto-activated: ${filename}`);
        }
      } catch (activateErr) {
        // Non-fatal: auto-activation failed (e.g. Python server not reachable), model still registered
        console.warn(`⚠️ Auto-activation failed (non-fatal): ${activateErr.message}`);
      }

      const message = autoActivated
        ? "Model berhasil diunggah dan otomatis diaktifkan"
        : "Model berhasil diunggah dan didaftarkan";

      return successResponse(res, registered, message, 201);
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

  // Public endpoint — no auth — called by Python server on startup to auto-recover active model
  static async getActiveModelInfo(req, res) {
    try {
      const activeModel = await MlModelService.getActiveModel();
      if (!activeModel) {
        return successResponse(res, null, "Tidak ada model aktif");
      }
      const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
      const supabaseBucket = process.env.SUPABASE_BUCKET || "models";
      const url = supabaseUrl
        ? `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/${activeModel.filename}`
        : null;

      return successResponse(res, {
        filename: activeModel.filename,
        modelType: activeModel.modelType,
        url,
      }, "Model aktif ditemukan");
    } catch (error) {
      console.error("Error getActiveModelInfo:", error.message);
      return errorResponse(res, error.message || "Gagal mengambil info model aktif", 500);
    }
  }
}

module.exports = MlModelController;
