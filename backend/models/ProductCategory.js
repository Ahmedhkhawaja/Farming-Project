const mongoose = require("mongoose");

const productCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  productType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductType",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique combination of name and productType
productCategorySchema.index({ name: 1, productType: 1 }, { unique: true });

module.exports = mongoose.model("ProductCategory", productCategorySchema);
