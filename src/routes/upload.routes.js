const express = require("express");
const multer = require("multer");
const { uploadFile } = require("../controllers/upload.controller");

// Defines the multipart upload endpoint and its file restrictions.
const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".csv", ".xlsx", ".xls"];
    const ext = require("path").extname(file.originalname).toLowerCase();

    if (!allowed.includes(ext)) {
      return cb(new Error("Only CSV, XLSX and XLS files are allowed"));
    }

    cb(null, true);
  }
});

router.post("/", upload.single("file"), uploadFile);

module.exports = router;
