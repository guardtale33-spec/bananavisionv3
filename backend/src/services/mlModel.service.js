const MlModelModel = require("../models/mlModelModel");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { deleteFromSupabase } = require("../utils/supabaseStorage");

const ML_SERVER_URL = (
  process.env.ML_SERVER_URL || "https://bananavisionv3-production-deee.up.railway.app"
).replace(/\/$/, "");

const PYTHON_MODEL_DIR = path.join(__dirname, "../../../python");

class MlModelService {
  /**
   * Get all models from DB and sync with Python directory files
   */
  static async getModels() {
    try {
      // 1. Get active model info from Python ML server
      let activePyModel = null;
      try {
        const response = await axios.get(`${ML_SERVER_URL}/api/models`);
        if (response.data && response.data.success) {
          activePyModel = response.data.active_model;
        }
      } catch (err) {
        console.error("⚠️ Failed to reach Python ML server /api/models:", err.message);
        // Non-fatal: continue with DB data only
      }

      // 2. Retrieve all models from DB (source of truth)
      const dbModels = await MlModelModel.findAll();

      // 3. Sync active status from Python into DB (only if Python is reachable)
      if (activePyModel) {
        if (activePyModel.filename) {
          const activeDbModel = dbModels.find(m => m.filename === activePyModel.filename);
          if (activeDbModel && !activeDbModel.isActive) {
            await MlModelModel.update(activeDbModel.id, { isActive: true });
            await MlModelModel.deactivateAllExcept(activeDbModel.id);
            return await MlModelModel.findAll();
          }
        } else {
          // Python is online but explicitly has NO active model loaded (filename is null)
          // Deactivate all models in DB to match
          const activeDbModel = dbModels.find(m => m.isActive);
          if (activeDbModel) {
            await MlModelModel.deactivateAllExcept(null);
            return await MlModelModel.findAll();
          }
        }
      }

      return dbModels;
    } catch (error) {
      throw error;
    }
  }


  /**
   * Activate a model in the system
   */
  static async activateModel(id) {
    const model = await MlModelModel.findById(id);
    if (!model) {
      throw new Error("Model tidak ditemukan di database");
    }

    const modelPath = path.join(PYTHON_MODEL_DIR, model.filename);
    const isSupabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
    if (!isSupabaseConfigured && !fs.existsSync(modelPath)) {
      throw new Error(`File model '${model.filename}' tidak ditemukan di folder python/ server`);
    }

    // 1. Tell Python server to reload model
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseBucket = process.env.SUPABASE_BUCKET || "models";
      let downloadUrl = null;
      if (supabaseUrl) {
        downloadUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${supabaseBucket}/${model.filename}`;
      }

      console.log(`Sending reload request to ${ML_SERVER_URL}/api/reload for ${model.filename}...`);
      const response = await axios.post(`${ML_SERVER_URL}/api/reload`, {
        filename: model.filename,
        model_type: model.modelType === "custom" ? "mobilenetv2" : model.modelType, // default to mobilenetv2 preprocess for custom
        url: downloadUrl
      });

      if (!response.data || !response.data.success) {
        throw new Error(response.data.message || "Gagal memuat model di server Python");
      }
    } catch (err) {
      const errMsg = err.response && err.response.data && err.response.data.detail 
        ? err.response.data.detail 
        : err.message;
      throw new Error(`Koneksi ke AI server gagal atau gagal memuat model: ${errMsg}`);
    }

    // 2. Update database active status
    const updated = await MlModelModel.update(id, { isActive: true });
    await MlModelModel.deactivateAllExcept(id);

    return updated;
  }

  /**
   * Upload a new .keras model
   */
  static async registerUploadedModel(name, filename, modelType, fileSize) {
    // Check if duplicate filename
    const existing = await MlModelModel.findByFilename(filename);
    if (existing) {
      return await MlModelModel.update(existing.id, {
        name,
        modelType,
        fileSize,
        updatedAt: new Date()
      });
    }

    return await MlModelModel.create({
      name,
      filename,
      modelType,
      isActive: false,
      fileSize
    });
  }

  /**
   * Delete model file and database entry
   */
  static async deleteModel(id) {
    const model = await MlModelModel.findById(id);
    if (!model) {
      throw new Error("Model tidak ditemukan");
    }

    // 1. Delete local file if it exists
    const filePath = path.join(PYTHON_MODEL_DIR, model.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Deleted local file: ${filePath}`);
      } catch (err) {
        console.error(`Failed to delete local file ${filePath}:`, err.message);
      }
    }

    // 2. Delete from Supabase Storage if configured
    try {
      await deleteFromSupabase(model.filename);
    } catch (err) {
      console.error("Failed to delete from Supabase:", err.message);
      // Continue — don't block DB deletion
    }

    // 3. Delete DB record
    return await MlModelModel.delete(id);
  }

  /**
   * Check Python ML server health
   */
  static async getHealth() {
    try {
      const response = await axios.get(`${ML_SERVER_URL}/health`);
      return {
        online: true,
        details: response.data
      };
    } catch (err) {
      return {
        online: false,
        message: err.message
      };
    }
  }

  /**
   * Get the currently active model from DB
   */
  static async getActiveModel() {
    const models = await MlModelModel.findAll();
    return models.find(m => m.isActive) || null;
  }
}

module.exports = MlModelService;
