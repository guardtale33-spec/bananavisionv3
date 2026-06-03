const MlModelModel = require("../models/mlModelModel");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

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
      // 1. Get files from Python ML server
      let pyModels = [];
      let activePyModel = null;
      try {
        const response = await axios.get(`${ML_SERVER_URL}/api/models`);
        if (response.data && response.data.success) {
          pyModels = response.data.models;
          activePyModel = response.data.active_model;
        }
      } catch (err) {
        console.error("⚠️ Failed to reach Python ML server /api/models:", err.message);
        // Fallback to reading the directory directly
        try {
          const files = fs.readdirSync(PYTHON_MODEL_DIR);
          pyModels = files.filter(f => f.endsWith(".keras"));
        } catch (dirErr) {
          console.error("⚠️ Failed to read python directory directly:", dirErr.message);
        }
      }

      // 2. Sync files with DB
      for (const filename of pyModels) {
        let dbModel = await MlModelModel.findByFilename(filename);
        if (!dbModel) {
          // Determine type based on filename
          let modelType = "mobilenetv2";
          if (filename.toLowerCase().includes("resnet")) {
            modelType = "resnet50";
          } else if (filename.toLowerCase().includes("custom")) {
            modelType = "custom";
          }
          
          let fileSize = null;
          try {
            const stats = fs.statSync(path.join(PYTHON_MODEL_DIR, filename));
            fileSize = stats.size;
          } catch (e) {}

          // Auto register
          await MlModelModel.create({
            name: filename.replace(".keras", "").replace(/_/g, " "),
            filename,
            modelType,
            isActive: !!(activePyModel && activePyModel.filename === filename),
            fileSize,
          });
        }
      }

      // 3. Retrieve all models from DB
      const dbModels = await MlModelModel.findAll();

      // Ensure the DB active flag matches Python active state if reachable
      if (activePyModel) {
        const activeDbModel = dbModels.find(m => m.filename === activePyModel.filename);
        if (activeDbModel && !activeDbModel.isActive) {
          await MlModelModel.update(activeDbModel.id, { isActive: true });
          await MlModelModel.deactivateAllExcept(activeDbModel.id);
          // Refresh list
          return await MlModelModel.findAll();
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
    if (!fs.existsSync(modelPath)) {
      throw new Error(`File model '${model.filename}' tidak ditemukan di folder python/ server`);
    }

    // 1. Tell Python server to reload model
    try {
      console.log(`Sending reload request to ${ML_SERVER_URL}/api/reload for ${model.filename}...`);
      const response = await axios.post(`${ML_SERVER_URL}/api/reload`, {
        filename: model.filename,
        model_type: model.modelType === "custom" ? "mobilenetv2" : model.modelType // default to mobilenetv2 preprocess for custom
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

    if (model.isActive) {
      throw new Error("Model yang sedang aktif tidak dapat dihapus. Silakan aktifkan model lain terlebih dahulu.");
    }

    // Delete file
    const filePath = path.join(PYTHON_MODEL_DIR, model.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`⚠️ Gagal menghapus file ${filePath}:`, err.message);
      }
    }

    // Delete DB record
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
}

module.exports = MlModelService;
