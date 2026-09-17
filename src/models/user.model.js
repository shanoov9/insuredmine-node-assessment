const mongoose = require("mongoose");

// Stores the customer details imported from each spreadsheet row.
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, index: true },
    dob: Date,
    address: String,
    phone: String,
    state: String,
    zipCode: String,
    email: { type: String, trim: true, lowercase: true, index: true },
    gender: String,
    userType: String
  },
  { timestamps: true }
);

userSchema.index({ firstName: 1 });

module.exports = mongoose.model("User", userSchema);
