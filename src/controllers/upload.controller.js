const path = require("path");
const { Worker } = require("worker_threads");

// Starts the import worker and sends its result back to the upload client.
function uploadFile(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload a CSV/XLSX/XLS file using field name 'file'"
    });
  }

  const workerPath = path.resolve(__dirname, "../workers/import.worker.js");

  const worker = new Worker(workerPath, {
    workerData: {
      filePath: req.file.path,
      originalName: req.file.originalname
    }
  });

  worker.on("message", (result) => {
    if (result.success) {
      return res.status(201).json(result);
    }

    const error = new Error(result.message);
    error.statusCode = 400;
    next(error);
  });

  worker.on("error", next);

  worker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Import worker stopped with exit code ${code}`);
    }
  });
}

module.exports = { uploadFile };
