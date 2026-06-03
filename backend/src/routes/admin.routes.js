const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/admin.controller");
const AdminDiseaseController = require("../controllers/adminDisease.controller");
const MlModelController = require("../controllers/mlModel.controller");
const { authenticateAdmin } = require("../middleware/adminAuth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer Storage Configuration for .keras models
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = path.join(__dirname, "../../../python");
    // Ensure the folder exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    // Validasi ekstensi
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".keras") {
      return cb(new Error("Hanya file model dengan ekstensi .keras yang diperbolehkan!"));
    }
    // Sanitasi nama file: hilangkan path traversal (mis. ../../malicious.keras → malicious.keras)
    const safeName = path.basename(file.originalname);
    cb(null, safeName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 250 * 1024 * 1024 } // 250MB Max limit for large ResNet/Deep learning models
});

// --- Public Admin Routes ---
router.post("/login", AdminController.login);

// --- Protected Admin Routes ---
router.get("/profile", authenticateAdmin, AdminController.getProfile);
router.get("/stats", authenticateAdmin, AdminController.getDashboardStats);

// --- Disease CRUD Routes ---
router.get("/diseases", authenticateAdmin, AdminDiseaseController.getDiseases);
router.post("/diseases", authenticateAdmin, AdminDiseaseController.createDisease);
router.put("/diseases/:id", authenticateAdmin, AdminDiseaseController.updateDisease);
router.delete("/diseases/:id", authenticateAdmin, AdminDiseaseController.deleteDisease);
router.put("/diseases/:id/toggle", authenticateAdmin, AdminDiseaseController.toggleActive);

// --- ML Model Routes ---
router.get("/models", authenticateAdmin, MlModelController.getModels);
// Rute statis harus SEBELUM rute dinamis (:id) agar tidak salah-route
router.get("/models/health", authenticateAdmin, MlModelController.getHealth);
router.post(
  "/models/upload", 
  authenticateAdmin, 
  upload.single("modelFile"), 
  MlModelController.uploadModel
);
router.put("/models/:id/activate", authenticateAdmin, MlModelController.activateModel);
router.delete("/models/:id", authenticateAdmin, MlModelController.deleteModel);

module.exports = router;
