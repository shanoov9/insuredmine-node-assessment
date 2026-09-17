const mongoose = require("mongoose");

// Stores insurance carrier names referenced by policy records.
const carrierSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true, index: true }
  },
  { timestamps: true }
);

carrierSchema.index({ companyName: 1 }, { unique: true });

module.exports = mongoose.model("Carrier", carrierSchema);
