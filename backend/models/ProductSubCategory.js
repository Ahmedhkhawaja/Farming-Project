const mongoose = require("mongoose");

const productSubCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  productCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductCategory",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique combination of name and productCategory
productSubCategorySchema.index(
  { name: 1, productCategory: 1 },
  { unique: true },
);

module.exports = mongoose.model("ProductSubCategory", productSubCategorySchema);
