const Product = require("../models/Product");

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Public
const createProduct = async (req, res) => {
  try {
    const { productType, productName, productSubCategory } = req.body;

    // Validate required fields
    if (!productType || !productName || !productSubCategory) {
      return res.status(400).json({
        message:
          "Please provide all required fields: productType, productName, productSubCategory",
      });
    }

    // Check if product already exists
    /*   const existingProduct = await Product.findOne({
      productType,
      productName,
      productSubCategory,
    });

    if (existingProduct) {
      return res.status(400).json({
        message:
          "Product with the same type, name and sub-category already exists",
      });
    } */

    // Create new product
    const product = new Product({
      productType,
      productName,
      productSubCategory,
    });

    const savedProduct = await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product: savedProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Validation error",
        errors: messages,
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Public
const updateProduct = async (req, res) => {
  try {
    console.log("Update request received:", req.params.id, req.body);

    const { productType, productName, productSubCategory } = req.body;

    // Validate required fields
    if (!productType || !productName || !productSubCategory) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    // Find and update in one operation
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        productType,
        productName,
        productSubCategory,
        updatedAt: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Product not found" });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Validation error",
        errors: messages,
      });
    }

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Public
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get product options
// @route   GET /api/products/options/all
// @access  Public
const getProductOptions = async (req, res) => {
  try {
    // Get all distinct product types from database
    const productTypes = await Product.distinct("productType");

    // Get all distinct product names from database
    const productNames = await Product.distinct("productName");

    // Get all distinct sub categories from database
    const subCategories = await Product.distinct("productSubCategory");

    res.json({
      productTypes: productTypes.sort(),
      productNames: productNames.sort(),
      subCategories: subCategories.sort(),
    });
  } catch (error) {
    console.error("Error fetching product options:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductOptions,
};
