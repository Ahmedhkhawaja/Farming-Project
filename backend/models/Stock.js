const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: false,
  },
  // Denormalized fields for easier querying
  productType: {
    type: String,
    required: true,
  },
  productCategory: {
    type: String,
    required: true,
  },
  productSubCategory: {
    type: String,
  },
  totalStock: {
    type: Number,
    required: true,
  },
  soldQty: {
    type: Number,
    required: true,
  },
  remainingQty: {
    type: Number,
    required: true,
  },
  returnQty: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    default: "",
  },
  // Weather data fields
  weatherCondition: {
    type: String,
    default: "Unknown",
  },
  weatherHighTemp: {
    type: Number,
    default: null,
  },
  weatherLowTemp: {
    type: Number,
    default: null,
  },
  weatherDescription: {
    type: String,
    default: "No weather data",
  },
  weatherTemperature: {
    // Keep for backward compatibility
    type: Number,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index for efficient querying
stockSchema.index({ date: -1, location: 1, productType: 1 });

module.exports = mongoose.model("Stock", stockSchema);
