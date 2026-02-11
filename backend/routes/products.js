const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const ProductType = require("../models/ProductType");
const ProductCategory = require("../models/ProductCategory");
const ProductSubCategory = require("../models/ProductSubCategory");
const Stock = require("../models/Stock"); // New Stock model
const auth = require("../middleware/auth");
const requireManager = require("../middleware/requireManager");

// Debug middleware - logs all requests to product routes
router.use((req, res, next) => {
  console.log(`📦 Product Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Require auth for all product routes
router.use(auth);

// Get all product types
router.get("/product-types", async (req, res) => {
  try {
    console.log("Fetching product types...");
    const productTypes = await ProductType.find().sort("name");
    console.log(`Found ${productTypes.length} product types`);
    res.json(productTypes);
  } catch (err) {
    console.error("Error fetching product types:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get product categories by type
router.get("/product-categories", async (req, res) => {
  try {
    const { type } = req.query;
    console.log(`Fetching categories for type: ${type}`);

    let query = {};

    if (type) {
      const productType = await ProductType.findOne({ name: type });
      if (productType) {
        query.productType = productType._id;
      }
    }

    const categories = await ProductCategory.find(query)
      .populate("productType", "name hasSubcategory")
      .sort("name");

    console.log(`Found ${categories.length} categories`);
    res.json(categories);
  } catch (err) {
    console.error("Error fetching product categories:", err);
    res.status(500).json({ message: err.message });
  }
});

// Create new product category
router.post("/product-categories", requireManager, async (req, res) => {
  try {
    const { productType, name } = req.body;
    console.log(`Creating new category: ${name} for type: ${productType}`);

    const type = await ProductType.findOne({ name: productType });
    if (!type) {
      return res.status(400).json({ message: "Invalid product type" });
    }

    const existingCategory = await ProductCategory.findOne({
      name: name,
      productType: type._id,
    });

    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = new ProductCategory({
      name: name,
      productType: type._id,
    });

    await newCategory.save();

    // Populate for response
    await newCategory.populate("productType", "name hasSubcategory");

    res.status(201).json(newCategory);
  } catch (err) {
    console.error("Error creating product category:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get product subcategories by category
router.get("/product-subcategories", async (req, res) => {
  try {
    const { category } = req.query;
    console.log(`Fetching subcategories for category: ${category}`);

    let query = {};

    if (category) {
      const productCategory = await ProductCategory.findOne({ name: category });
      if (productCategory) {
        query.productCategory = productCategory._id;
      }
    }

    const subcategories = await ProductSubCategory.find(query)
      .populate("productCategory", "name")
      .sort("name");

    console.log(`Found ${subcategories.length} subcategories`);
    res.json(subcategories);
  } catch (err) {
    console.error("Error fetching product subcategories:", err);
    res.status(500).json({ message: err.message });
  }
});

// Create new product subcategory
router.post("/product-subcategories", requireManager, async (req, res) => {
  try {
    const { productCategory, name } = req.body;
    console.log(
      `Creating new subcategory: ${name} for category: ${productCategory}`,
    );

    const category = await ProductCategory.findOne({ name: productCategory });
    if (!category) {
      return res.status(400).json({ message: "Invalid product category" });
    }

    const existingSubCategory = await ProductSubCategory.findOne({
      name: name,
      productCategory: category._id,
    });

    if (existingSubCategory) {
      return res.status(400).json({ message: "Subcategory already exists" });
    }

    const newSubCategory = new ProductSubCategory({
      name: name,
      productCategory: category._id,
    });

    await newSubCategory.save();

    // Populate for response
    await newSubCategory.populate("productCategory", "name");

    res.status(201).json(newSubCategory);
  } catch (err) {
    console.error("Error creating product subcategory:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get all products with populated data
router.get("/products", async (req, res) => {
  try {
    console.log("Fetching all products...");

    const products = await Product.find()
      .populate({
        path: "productCategory",
        populate: {
          path: "productType",
          select: "name hasSubcategory",
        },
      })
      .populate("productSubCategory");

    // Format the response
    const formattedProducts = products.map((product) => ({
      _id: product._id,
      productType: product.productCategory?.productType?.name || "",
      productCategory: product.productCategory?.name || "",
      productSubCategory: product.productSubCategory?.name || null,
      unit: product.unit || "unit",
      createdAt: product.createdAt,
    }));

    console.log(`Found ${formattedProducts.length} products`);
    res.json(formattedProducts);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: err.message });
  }
});

// Create new product
router.post("/products", requireManager, async (req, res) => {
  try {
    const { productType, productCategory, productSubCategory, unit } = req.body;
    console.log(`Creating new product: ${productCategory} (${productType})`);

    // Find category
    const category = await ProductCategory.findOne({
      name: productCategory,
    }).populate("productType");

    if (!category) {
      return res.status(400).json({ message: "Invalid product category" });
    }

    // Validate product type matches category
    if (category.productType.name !== productType) {
      return res
        .status(400)
        .json({ message: "Product type does not match category" });
    }

    // Find subcategory if provided
    let subcategory = null;
    if (productSubCategory && productType === "Greens") {
      subcategory = await ProductSubCategory.findOne({
        productCategory: category._id,
        name: productSubCategory,
      });

      if (!subcategory) {
        return res.status(400).json({ message: "Invalid product subcategory" });
      }
    }

    // Check if product already exists
    const existingProduct = await Product.findOne({
      productCategory: category._id,
      productSubCategory: subcategory ? subcategory._id : null,
    });

    if (existingProduct) {
      return res.status(400).json({ message: "Product already exists" });
    }

    const product = new Product({
      productCategory: category._id,
      productSubCategory: subcategory ? subcategory._id : null,
      unit: unit || "unit",
    });

    await product.save();

    // Populate for response
    await product.populate({
      path: "productCategory",
      populate: {
        path: "productType",
        select: "name hasSubcategory",
      },
    });
    await product.populate("productSubCategory");

    const responseProduct = {
      _id: product._id,
      productType: product.productCategory.productType.name,
      productCategory: product.productCategory.name,
      productSubCategory: product.productSubCategory?.name || null,
      unit: product.unit,
    };

    res.status(201).json(responseProduct);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ message: err.message });
  }
});

// Update product
router.put("/products/:id", requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { productType, productCategory, productSubCategory, unit } = req.body;
    console.log(`Updating product ${id}`);

    // Find category
    const category = await ProductCategory.findOne({
      name: productCategory,
    }).populate("productType");

    if (!category) {
      return res.status(400).json({ message: "Invalid product category" });
    }

    // Find subcategory if provided
    let subcategory = null;
    if (productSubCategory && productType === "Greens") {
      subcategory = await ProductSubCategory.findOne({
        productCategory: category._id,
        name: productSubCategory,
      });

      if (!subcategory) {
        return res.status(400).json({ message: "Invalid product subcategory" });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        productCategory: category._id,
        productSubCategory: subcategory ? subcategory._id : null,
        unit: unit || "unit",
      },
      { new: true },
    )
      .populate({
        path: "productCategory",
        populate: {
          path: "productType",
          select: "name hasSubcategory",
        },
      })
      .populate("productSubCategory");

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const responseProduct = {
      _id: updatedProduct._id,
      productType: updatedProduct.productCategory.productType.name,
      productCategory: updatedProduct.productCategory.name,
      productSubCategory: updatedProduct.productSubCategory?.name || null,
      unit: updatedProduct.unit,
    };

    res.json(responseProduct);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ message: err.message });
  }
});

// Delete product
router.delete("/products/:id", requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting product ${id}`);

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: err.message });
  }
});

// Add this route to your existing products.js file
// Save bulk stock (for both day start and day end)
// Add this route to your existing products.js file

// Save bulk stock (for both day start and day end)
router.post("/stocks/bulk", async (req, res) => {
  try {
    const stockData = req.body;
    console.log(`Saving ${stockData.length} stock items`);

    // Validate required fields - FIXED to match what you're sending
    for (const item of stockData) {
      if (
        !item.date ||
        !item.productType ||
        !item.productName ||
        !item.totalStock ||
        !item.unit ||
        !item.location
      ) {
        console.error("Missing required fields:", item);
        return res.status(400).json({
          message: `Each stock item must have date, productType, productName, totalStock, unit, and location`,
        });
      }

      // Ensure productSubCategory exists (can be empty string)
      if (item.productSubCategory === undefined) {
        item.productSubCategory = "";
      }
    }

    // First, delete existing stock entries for the same date and location
    if (stockData.length > 0) {
      const firstItem = stockData[0];
      const date = new Date(firstItem.date);

      // Format date for query
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      // Create start and end of day for query
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      await Stock.deleteMany({
        date: { $gte: startOfDay, $lte: endOfDay },
        location: firstItem.location,
      });
      console.log(
        `Cleared existing stock for ${dateString} at ${firstItem.location}`,
      );
    }

    // Save new stock entries
    const savedStocks = await Stock.insertMany(stockData);

    console.log(`Successfully saved ${savedStocks.length} stock items`);
    res.status(201).json({
      message: "Stock saved successfully",
      count: savedStocks.length,
      data: savedStocks,
    });
  } catch (err) {
    console.error("Error saving bulk stock:", err);
    res.status(500).json({ message: err.message });
  }
});

// Add these routes to your products.js file if not already present

// Get all product types (for dropdown)
router.get("/products/types", async (req, res) => {
  try {
    const productTypes = await ProductType.find().sort("name");
    res.json(productTypes);
  } catch (err) {
    console.error("Error fetching product types:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get product categories by type (for dropdown)
router.get("/products/categories", async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) {
      return res.status(400).json({ message: "Product type is required" });
    }

    const productType = await ProductType.findOne({ name: type });
    if (!productType) {
      return res.status(404).json({ message: "Product type not found" });
    }

    const categories = await ProductCategory.find({
      productType: productType._id,
    }).sort("name");

    res.json(categories);
  } catch (err) {
    console.error("Error fetching product categories:", err);
    res.status(500).json({ message: err.message });
  }
});

// Test endpoint
router.get("/products-test", (req, res) => {
  res.json({ message: "Products routes are working!" });
});

module.exports = router;
