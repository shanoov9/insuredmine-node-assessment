const mongoose = require("mongoose");

// Stores policy facts and references each policy's related collections.
const policySchema = new mongoose.Schema(
  {
    policyNumber: { type: String, required: true, unique: true, index: true },
    policyStartDate: Date,
    policyEndDate: Date,
    policyMode: Number,
    policyType: String,
    premiumAmount: Number,
    premiumAmountWritten: Number,

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      index: true
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      index: true
    },
    lobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LOB",
      index: true
    },
    carrierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Carrier",
      index: true
    }
  },
  { timestamps: true }
);

policySchema.index({ userId: 1, policyStartDate: -1 });
policySchema.index({ policyNumber: 1 });

module.exports = mongoose.model("Policy", policySchema);
