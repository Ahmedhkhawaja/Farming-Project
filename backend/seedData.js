const mongoose = require("mongoose");
const User = require("./models/User");
const Stock = require("./models/Stock");
const ProductType = require("./models/ProductType");
const ProductCategory = require("./models/ProductCategory");
const ProductSubCategory = require("./models/ProductSubCategory");
const Product = require("./models/Product");
require("dotenv").config();

// Market locations (must match frontend)
const marketLocations = [
  "Union Square, Manhattan",
  "Columbia University, West Manhattan",
  "Tribecca, Lower Manhattan",
  "Larchmont Westchester, NY",
  "Carroll Gardens, Brooklyn",
  "Jackson Heights, Queens",
];

// Function to create product types, categories, and subcategories
const createProductStructure = async () => {
  try {
    console.log("📦 Creating product structure...");

    // Clear existing product data
    await ProductType.deleteMany({});
    await ProductCategory.deleteMany({});
    await ProductSubCategory.deleteMany({});
    await Product.deleteMany({});

    // 1. Create Product Types
    const greensType = await ProductType.create({
      name: "Greens",
      hasSubcategory: true,
    });

    const kitchenType = await ProductType.create({
      name: "Kitchen",
      hasSubcategory: false,
    });

    console.log("✅ Created product types: Greens and Kitchen");

    // 2. Create Greens Categories
    const greensCategories = [
      "Lettuce",
      "Baby Green",
      "Arugula",
      "Frisee",
      "Broccoli Raab",
      "Spinach",
      "Bokchoy",
      "Bunches",
    ];

    const greensCategoryDocs = {};
    for (const name of greensCategories) {
      const category = await ProductCategory.create({
        name,
        productType: greensType._id,
      });
      greensCategoryDocs[name] = category;
    }

    console.log(`✅ Created ${greensCategories.length} Greens categories`);

    // 3. Create Kitchen Categories
    const kitchenCategories = [
      "Soup",
      "Juice",
      "Small Kimchi",
      "Large Kimchi",
      "Dumpling",
      "Chips",
      "Moo Radish",
      "Cheese Pumpkin",
      "Burger",
    ];

    const kitchenCategoryDocs = {};
    for (const name of kitchenCategories) {
      const category = await ProductCategory.create({
        name,
        productType: kitchenType._id,
      });
      kitchenCategoryDocs[name] = category;
    }

    console.log(`✅ Created ${kitchenCategories.length} Kitchen categories`);

    // 4. Create Subcategories for Greens
    const greensSubcategories = {
      Lettuce: ["Romaine", "Frisee", "Little Gem", "Butterhead", "Iceberg"],
      "Baby Green": [
        "Baby Spinach",
        "Baby Kale",
        "Baby Arugula",
        "Mixed Baby Greens",
      ],
      Arugula: ["Wild Arugula", "Cultivated Arugula", "Baby Arugula"],
      Frisee: ["Curly Endive", "Escarole", "Belgian Endive"],
      "Broccoli Raab": ["Standard", "Baby Broccoli Raab"],
      Spinach: ["Flat Leaf", "Curly Leaf", "Baby Spinach"],
      Bokchoy: ["Shanghai Bokchoy", "Baby Bokchoy", "Purple Bokchoy"],
      Bunches: ["Large Bunch", "Small Bunch", "Mixed Bunch"],
    };

    const greensSubcategoryDocs = {};
    for (const [categoryName, subcatList] of Object.entries(
      greensSubcategories,
    )) {
      greensSubcategoryDocs[categoryName] = {};
      for (const subcatName of subcatList) {
        const subcategory = await ProductSubCategory.create({
          name: subcatName,
          productCategory: greensCategoryDocs[categoryName]._id,
        });
        greensSubcategoryDocs[categoryName][subcatName] = subcategory;
      }
    }

    console.log("✅ Created subcategories for Greens");

    // 5. Create sample Products
    const sampleProducts = [
      // Kitchen Products (no subcategory)
      { category: "Soup", subcategory: null, unit: "bowl" },
      { category: "Juice", subcategory: null, unit: "bottle" },
      { category: "Small Kimchi", subcategory: null, unit: "jar" },
      { category: "Dumpling", subcategory: null, unit: "pack" },
      { category: "Chips", subcategory: null, unit: "bag" },
      { category: "Burger", subcategory: null, unit: "piece" },

      // Greens Products with subcategories
      { category: "Lettuce", subcategory: "Romaine", unit: "bunch" },
      { category: "Lettuce", subcategory: "Little Gem", unit: "bunch" },
      { category: "Baby Green", subcategory: "Baby Spinach", unit: "bag" },
      { category: "Baby Green", subcategory: "Baby Kale", unit: "bag" },
      { category: "Arugula", subcategory: "Wild Arugula", unit: "bunch" },
      { category: "Frisee", subcategory: "Curly Endive", unit: "bunch" },
      { category: "Broccoli Raab", subcategory: "Standard", unit: "bunch" },
      { category: "Spinach", subcategory: "Flat Leaf", unit: "bunch" },
      { category: "Bokchoy", subcategory: "Shanghai Bokchoy", unit: "bunch" },
      { category: "Bunches", subcategory: "Large Bunch", unit: "bunch" },
    ];

    const createdProducts = {};
    for (const productData of sampleProducts) {
      let productSubCategoryId = null;

      // Get the category
      let category = greensCategoryDocs[productData.category];
      if (!category) {
        category = kitchenCategoryDocs[productData.category];
      }

      // Get subcategory if exists
      if (
        productData.subcategory &&
        greensSubcategoryDocs[productData.category]
      ) {
        productSubCategoryId =
          greensSubcategoryDocs[productData.category][productData.subcategory]
            ._id;
      }

      const product = await Product.create({
        productCategory: category._id,
        productSubCategory: productSubCategoryId,
        unit: productData.unit,
      });

      // Store product for stock generation
      const key =
        productData.category +
        (productData.subcategory ? ` - ${productData.subcategory}` : "");
      createdProducts[key] = {
        productId: product._id,
        productType: category.productType.equals(greensType._id)
          ? "Greens"
          : "Kitchen",
        productCategory: productData.category,
        productSubCategory: productData.subcategory,
        unit: productData.unit,
      };
    }

    console.log(`✅ Created ${sampleProducts.length} sample products`);

    return {
      greensType,
      kitchenType,
      greensCategoryDocs,
      kitchenCategoryDocs,
      greensSubcategoryDocs,
      createdProducts,
    };
  } catch (error) {
    console.error("❌ Error creating product structure:", error);
    throw error;
  }
};

// Generate sample stock data for last 30 days
const generateSampleData = async (productData) => {
  try {
    console.log("📊 Generating sample stock data...");

    const stocks = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      // For each product and location, create a stock entry
      for (const [productKey, productInfo] of Object.entries(
        productData.createdProducts,
      )) {
        for (const location of marketLocations) {
          const totalStock = Math.floor(Math.random() * 300) + 100; // 100-400
          const soldQty = Math.floor(Math.random() * totalStock * 0.8); // Up to 80% sold
          const remainingQty = totalStock - soldQty;
          const returnQty = Math.floor(Math.random() * remainingQty * 0.3); // Up to 30% returned

          stocks.push({
            date: date,
            productId: productInfo.productId,
            productType: productInfo.productType,
            productCategory: productInfo.productCategory,
            productSubCategory: productInfo.productSubCategory,
            totalStock: totalStock,
            soldQty: soldQty,
            remainingQty: remainingQty,
            returnQty: returnQty,
            unit: productInfo.unit,
            location: location,
            notes: i === 0 ? `Latest shipment to ${location}` : "",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    // Clear existing data
    await Stock.deleteMany({});

    // Insert in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < stocks.length; i += batchSize) {
      const batch = stocks.slice(i, i + batchSize);
      await Stock.insertMany(batch);
      console.log(
        `Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(stocks.length / batchSize)}`,
      );
    }

    console.log(`✅ Created ${stocks.length} sample stock records`);

    // Show sample data for today
    const todayData = stocks.filter(
      (s) =>
        s.date.toDateString() === new Date().toDateString() &&
        s.location === "Union Square, Manhattan",
    );
    console.log(
      `\n📊 Today's data for Union Square, Manhattan (${todayData.length} items):`,
    );
    todayData.slice(0, 5).forEach((item) => {
      console.log(
        `  - ${item.productCategory}${item.productSubCategory ? ` (${item.productSubCategory})` : ""}: ${item.totalStock} total, ${item.soldQty} sold, ${item.remainingQty} remaining`,
      );
    });
    if (todayData.length > 5) {
      console.log(`  ... and ${todayData.length - 5} more items`);
    }
  } catch (error) {
    console.error("❌ Error generating sample data:", error);
  }
};

// Create default admin user
const createAdminUser = async () => {
  try {
    const existingUser = await User.findOne({ username: "manager" });
    if (!existingUser) {
      const user = new User({
        username: "manager",
        password: "manager123",
        role: "manager",
      });
      await user.save();
      console.log(
        "✅ Admin user created: username: manager, password: manager123",
      );
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  }
};

async function migrateStockCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/grocery-sales", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Get all stocks with productCategory as "Unknown" or empty
    const stocks = await Stock.find({
      $or: [
        { productCategory: "Unknown" },
        { productCategory: { $exists: false } },
        { productCategory: "" },
      ],
    });

    console.log(`Found ${stocks.length} stocks to fix`);

    for (const stock of stocks) {
      // Determine the correct category based on productType
      let newCategory = "";

      if (stock.productType === "Greens") {
        // Greens categories from your pre-populated list
        const greenCategories = [
          "Lettuce",
          "Baby Green",
          "Arugula",
          "Frisse",
          "Broccoli Raab",
          "Spinach",
          "Bokchoy",
          "Bunches",
        ];
        // Use existing category if it's valid, otherwise pick one
        if (
          greenCategories.includes(stock.productCategory) &&
          stock.productCategory !== "Unknown"
        ) {
          newCategory = stock.productCategory;
        } else {
          // Assign a default category for Greens
          newCategory = "Mixed Greens";
        }
      } else if (stock.productType === "Kitchen") {
        // Kitchen categories from your pre-populated list
        const kitchenCategories = [
          "Soup",
          "Juice",
          "Small Kimchi",
          "Large Kimchi",
          "Dumpling",
          "Moo Radish",
          "Chips",
          "Cheese Pumpkin",
          "Burger",
        ];
        if (
          kitchenCategories.includes(stock.productCategory) &&
          stock.productCategory !== "Unknown"
        ) {
          newCategory = stock.productCategory;
        } else {
          newCategory = "General Kitchen";
        }
      } else {
        newCategory = stock.productType || "General";
      }

      // Update the stock with the new category
      stock.productCategory = newCategory;
      await stock.save();

      console.log(
        `Updated stock ${stock._id}: ${stock.productType} -> ${newCategory}`,
      );
    }

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateStockCategories();

// Main function
const seedDatabase = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/grocery-sales",
    );

    console.log("✅ Connected to MongoDB");

    await createAdminUser();

    // Create new product structure
    const productData = await createProductStructure();

    // Generate sample stock data with new product structure
    await generateSampleData(productData);

    console.log(
      "\n✅ Database seeded successfully with new product structure!",
    );

    // Show summary
    const productTypeCount = await ProductType.countDocuments();
    const categoryCount = await ProductCategory.countDocuments();
    const subcategoryCount = await ProductSubCategory.countDocuments();
    const productCount = await Product.countDocuments();
    const stockCount = await Stock.countDocuments();
    const locationCount = await Stock.distinct("location");
    const dateRange = await Stock.aggregate([
      {
        $group: {
          _id: null,
          minDate: { $min: "$date" },
          maxDate: { $max: "$date" },
        },
      },
    ]);

    console.log("\n📈 Database Summary:");
    console.log(`   Product Types: ${productTypeCount} (Greens, Kitchen)`);
    console.log(`   Product Categories: ${categoryCount}`);
    console.log(`   Product Subcategories: ${subcategoryCount}`);
    console.log(`   Products: ${productCount}`);
    console.log(`   Total stock records: ${stockCount}`);
    console.log(`   Unique locations: ${locationCount.length}`);
    if (dateRange.length > 0) {
      console.log(
        `   Date range: ${dateRange[0].minDate.toDateString()} to ${dateRange[0].maxDate.toDateString()}`,
      );
    }

    // Display sample of created products
    const sampleProducts = await Product.find()
      .populate({
        path: "productCategory",
        populate: {
          path: "productType",
          select: "name",
        },
      })
      .populate("productSubCategory")
      .limit(5);

    console.log("\n🎯 Sample Products Created:");
    sampleProducts.forEach((product) => {
      const type = product.productCategory?.productType?.name || "Unknown";
      const category = product.productCategory?.name || "Unknown";
      const subcategory = product.productSubCategory?.name || "N/A";
      console.log(
        `   - ${type}: ${category} - ${subcategory} (${product.unit})`,
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
