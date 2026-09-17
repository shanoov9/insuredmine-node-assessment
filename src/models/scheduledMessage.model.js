const mongoose = require("mongoose");

// Stores pending and completed messages processed by the scheduler service.
const scheduledMessageSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["scheduled", "processed", "failed"],
      default: "scheduled",
      index: true
    },
    processedAt: Date,
    error: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScheduledMessage", scheduledMessageSchema);
