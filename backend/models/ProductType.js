const mongoose = require("mongoose");

const productTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ["Greens", "Kitchen"],
  },
  hasSubcategory: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ProductType", productTypeSchema);
