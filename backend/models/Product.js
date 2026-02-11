const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductCategory",
    required: true,
  },
  productSubCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductSubCategory",
  },
  unit: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
