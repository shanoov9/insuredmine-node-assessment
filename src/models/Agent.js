const mongoose = require("mongoose");

// Stores one insurance agent and prevents duplicate agent names.
const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true }
  },
  { timestamps: true }
);

agentSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Agent", agentSchema);
