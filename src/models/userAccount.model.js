const mongoose = require("mongoose");

// Stores an account name and its owning user reference.
const userAccountSchema = new mongoose.Schema(
  {
    accountName: { type: String, required: true, trim: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

userAccountSchema.index({ accountName: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("UserAccount", userAccountSchema);
