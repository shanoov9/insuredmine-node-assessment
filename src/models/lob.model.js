const mongoose = require("mongoose");

// Stores lines of business, called policy categories in the assessment.
const lobSchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true, trim: true, index: true }
  },
  { timestamps: true }
);

lobSchema.index({ categoryName: 1 }, { unique: true });

module.exports = mongoose.model("LOB", lobSchema);
