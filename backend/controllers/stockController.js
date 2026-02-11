const Stock = require("../models/Stock");
const mongoose = require("mongoose");

// @route   POST /api/stocks
// @desc    Add new stock entry (single item)
exports.addStock = async (req, res) => {
  try {
    const {
      date,
      productType,
      productName,
      productSubCategory = "", // Default to empty string
      totalStock,
      soldQty = 0,
      returnQty = 0,
      remainingQty = 0,
      unit = "pieces",
      location,
      notes = "",
      weatherCondition,
      weatherTemperature,
      weatherHighTemp,
      weatherLowTemp,
      weatherDescription,
    } = req.body;

    console.log("Received stock data:", {
      date,
      productType,
      productName,
      productSubCategory,
      totalStock,
      soldQty,
      returnQty,
      remainingQty,
      unit,
      location,
      weatherCondition,
      weatherTemperature,
      weatherHighTemp,
      weatherLowTemp,
      weatherDescription,
    });

    // Validate required fields - UPDATED: productSubCategory is not required
    if (
      !date ||
      !productType ||
      !productName ||
      totalStock === undefined ||
      totalStock === null ||
      !unit ||
      !location
    ) {
      console.log("Missing fields:", {
        date: !date,
        productType: !productType,
        productName: !productName,
        totalStock: totalStock === undefined || totalStock === null,
        unit: !unit,
        location: !location,
      });

      return res.status(400).json({
        message:
          "Each stock item must have date, productType, productName, totalStock, unit, and location",
      });
    }

    // Validate that sold and returned don't exceed total stock
    if (soldQty + returnQty > totalStock) {
      return res.status(400).json({
        message: "Stock sold and returned cannot exceed total stock",
      });
    }

    // Calculate remaining quantity if not provided
    const calculatedRemainingQty =
      remainingQty === undefined || remainingQty === null
        ? totalStock - soldQty - returnQty
        : remainingQty;

    // Handle weather data - use weatherTemperature for both high and low if separate values not provided
    const weatherHighTempValue =
      weatherHighTemp !== undefined ? weatherHighTemp : weatherTemperature;
    const weatherLowTempValue =
      weatherLowTemp !== undefined ? weatherLowTemp : weatherTemperature;

    const newStock = new Stock({
      date,
      productType,
      productName,
      productCategory: productName, // Using productName as productCategory for backward compatibility
      productSubCategory: productSubCategory || "",
      totalStock,
      soldQty,
      remainingQty: calculatedRemainingQty,
      returnQty,
      unit,
      location,
      notes,
      weatherCondition: weatherCondition || "Unknown",
      weatherHighTemp: weatherHighTempValue,
      weatherLowTemp: weatherLowTempValue,
      weatherDescription: weatherDescription || "No weather data",
      // Keep weatherTemperature for backward compatibility
      weatherTemperature: weatherTemperature || weatherHighTempValue,
    });

    await newStock.save();

    // Return all weather fields for consistency
    res.status(201).json({
      ...newStock.toObject(),
      id: newStock._id,
      weatherHighTemp: newStock.weatherHighTemp,
      weatherLowTemp: newStock.weatherLowTemp,
      weatherDescription: newStock.weatherDescription,
    });
  } catch (err) {
    console.error("Add stock error:", err);

    // Handle validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Validation error",
        errors: messages,
      });
    }

    res.status(500).json({ message: err.message });
  }
};

// @route   POST /api/stocks/bulk
// @desc    Add multiple stock entries at once
exports.addMultipleStocks = async (req, res) => {
  try {
    const stockData = req.body;
    console.log(`Saving ${stockData.length} stock items`);

    if (!Array.isArray(stockData) || stockData.length === 0) {
      return res.status(400).json({
        message: "Please provide an array of stock items",
      });
    }

    // Import the ProductCategory model to check if categories exist
    const ProductCategory = require("../models/ProductCategory");
    const ProductType = require("../models/ProductType");

    // Process each item
    const processedStockData = [];

    for (let i = 0; i < stockData.length; i++) {
      const item = stockData[i];

      console.log(`Processing item ${i + 1}:`, {
        productType: item.productType,
        productCategory: item.productCategory,
        productName: item.productName,
        totalStock: item.totalStock,
        weatherCondition: item.weatherCondition,
        weatherHighTemp: item.weatherHighTemp,
        weatherLowTemp: item.weatherLowTemp,
        weatherDescription: item.weatherDescription,
        weatherTemperature: item.weatherTemperature,
      });

      // Check for required fields
      if (
        !item.date ||
        !item.productType ||
        !item.productName ||
        item.totalStock === undefined ||
        item.totalStock === null ||
        Number.isNaN(item.totalStock) ||
        !item.unit ||
        !item.location
      ) {
        return res.status(400).json({
          message: `Each stock item must have date, productType, productName, totalStock, unit, and location. Check item ${i + 1}`,
        });
      }

      // Find or create ProductType
      let productTypeId;
      const productType = await ProductType.findOne({ name: item.productType });
      if (productType) {
        productTypeId = productType._id;
      } else {
        // Create new ProductType if it doesn't exist
        const newProductType = new ProductType({
          name: item.productType,
          hasSubcategory: false,
        });
        await newProductType.save();
        productTypeId = newProductType._id;
        console.log(`Created new ProductType: ${item.productType}`);
      }

      // Find or create ProductCategory
      let productCategoryName =
        item.productCategory?.trim() || item.productName?.trim() || "General";
      let productCategory;

      // Try to find existing category
      productCategory = await ProductCategory.findOne({
        name: productCategoryName,
        productType: productTypeId,
      });

      if (!productCategory) {
        // Create new ProductCategory
        productCategory = new ProductCategory({
          name: productCategoryName,
          productType: productTypeId,
        });
        await productCategory.save();
        console.log(
          `Created new ProductCategory: ${productCategoryName} for ${item.productType}`,
        );
      }

      // Validate quantities
      const totalStock = Number(item.totalStock) || 0;
      const returnQty = Number(item.returnQty) || 0;
      const soldQty = Math.max(0, totalStock - returnQty);

      // Handle weather data
      const weatherHighTempValue =
        item.weatherHighTemp !== undefined
          ? item.weatherHighTemp
          : item.weatherTemperature;
      const weatherLowTempValue =
        item.weatherLowTemp !== undefined
          ? item.weatherLowTemp
          : item.weatherTemperature;

      processedStockData.push({
        date: new Date(item.date),
        productType: item.productType.trim(), // String field
        productCategory: productCategoryName, // String field (name, not ID)
        productSubCategory: item.productSubCategory?.trim() || "",
        totalStock: totalStock,
        soldQty: soldQty,
        returnQty: returnQty,
        remainingQty: returnQty,
        unit: item.unit.trim(),
        location: item.location.trim(),
        notes: item.notes?.trim() || `Saved via AddStock page`,
        weatherCondition: item.weatherCondition?.trim() || "Unknown",
        weatherHighTemp: weatherHighTempValue,
        weatherLowTemp: weatherLowTempValue,
        weatherDescription:
          item.weatherDescription?.trim() || "No weather data",
        weatherTemperature: item.weatherTemperature || weatherHighTempValue, // For backward compatibility
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Delete existing stock entries for the same date and location
    if (processedStockData.length > 0) {
      const firstItem = processedStockData[0];
      const date = new Date(firstItem.date);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      await Stock.deleteMany({
        date: { $gte: startOfDay, $lte: endOfDay },
        location: firstItem.location,
      });
      console.log(
        `Cleared existing stock for ${date.toDateString()} at ${firstItem.location}`,
      );
    }

    // Insert all items
    const savedStocks = await Stock.insertMany(processedStockData);

    console.log(`Successfully saved ${savedStocks.length} stock items`);

    // Return the saved items
    const response = savedStocks.map((stock) => ({
      _id: stock._id,
      id: stock._id,
      date: stock.date,
      productType: stock.productType,
      productName: stock.productCategory, // For frontend compatibility
      productCategory: stock.productCategory, // The actual category name
      productSubCategory: stock.productSubCategory,
      totalStock: stock.totalStock,
      soldQty: stock.soldQty,
      returnQty: stock.returnQty,
      remainingQty: stock.remainingQty,
      unit: stock.unit,
      location: stock.location,
      notes: stock.notes,
      weatherCondition: stock.weatherCondition,
      weatherHighTemp: stock.weatherHighTemp,
      weatherLowTemp: stock.weatherLowTemp,
      weatherDescription: stock.weatherDescription,
      weatherTemperature: stock.weatherTemperature,
    }));

    console.log("Sample response item:", JSON.stringify(response[0], null, 2));

    res.status(201).json({
      message: `${savedStocks.length} stock items created successfully`,
      stocks: response,
    });
  } catch (error) {
    console.error("Error creating multiple stocks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   GET /api/stocks/daily
// @desc    Get stocks for a specific date and location
exports.getDailyStocks = async (req, res) => {
  try {
    const { date, location } = req.query;

    if (!date || !location) {
      return res.status(400).json({
        message: "Date and location are required",
      });
    }

    // Parse date and set to start/end of day
    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build query
    const query = {
      date: { $gte: startOfDay, $lte: endOfDay },
      location: location,
    };

    console.log("Daily stocks query:", query);

    // Get stocks sorted
    const stocks = await Stock.find(query).sort({
      productType: 1,
      productCategory: 1,
      createdAt: 1,
    });

    console.log(`Found ${stocks.length} stocks for ${date} at ${location}`);

    // Transform response - use the actual productCategory field from Stock
    const transformedStocks = stocks.map((stock) => ({
      _id: stock._id,
      id: stock._id,
      date: stock.date,
      productType: stock.productType,
      productName: stock.productCategory, // For frontend compatibility
      productCategory: stock.productCategory, // Use the string from Stock model
      productSubCategory: stock.productSubCategory,
      totalStock: stock.totalStock,
      soldQty: stock.soldQty,
      returnQty: stock.returnQty,
      remainingQty: stock.remainingQty,
      unit: stock.unit,
      location: stock.location,
      notes: stock.notes,
      weatherCondition: stock.weatherCondition,
      weatherHighTemp: stock.weatherHighTemp,
      weatherLowTemp: stock.weatherLowTemp,
      weatherDescription: stock.weatherDescription,
      weatherTemperature: stock.weatherTemperature,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    }));

    // Log first item for debugging
    if (transformedStocks.length > 0) {
      console.log("First stock item from database:", {
        productType: transformedStocks[0].productType,
        productCategory: transformedStocks[0].productCategory,
        productName: transformedStocks[0].productName,
        weatherCondition: transformedStocks[0].weatherCondition,
        weatherHighTemp: transformedStocks[0].weatherHighTemp,
        weatherLowTemp: transformedStocks[0].weatherLowTemp,
        weatherDescription: transformedStocks[0].weatherDescription,
      });
    }

    res.json(transformedStocks);
  } catch (err) {
    console.error("Error fetching daily stocks:", err);
    res.status(500).json({ message: err.message });
  }
};

// @route   GET /api/stocks
// @desc    Get all stock entries (with optional date filtering)
exports.getAllStocks = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      location,
      productType,
      productName,
      page = 1,
      limit = 50,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Location filter
    if (location) {
      query.location = location;
    }

    // Product type filter
    if (productType) {
      query.productType = productType;
    }

    // Product name filter
    if (productName) {
      query.productName = { $regex: productName, $options: "i" };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get total count for pagination
    const total = await Stock.countDocuments(query);

    // Get stocks
    const stocks = await Stock.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Transform data for frontend
    const transformedStocks = stocks.map((stock) => ({
      id: stock._id,
      date: stock.date,
      productType: stock.productType,
      productName: stock.productName,
      productSubCategory: stock.productSubCategory,
      totalStock: stock.totalStock,
      soldQty: stock.soldQty,
      returnQty: stock.returnQty,
      remainingQty: stock.remainingQty,
      unit: stock.unit,
      location: stock.location,
      notes: stock.notes,
      weatherCondition: stock.weatherCondition,
      weatherHighTemp: stock.weatherHighTemp,
      weatherLowTemp: stock.weatherLowTemp,
      weatherDescription: stock.weatherDescription,
      weatherTemperature: stock.weatherTemperature,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    }));

    res.json({
      stocks: transformedStocks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("Error fetching stocks:", err);
    res.status(500).json({ message: err.message });
  }
};

// @route   GET /api/stocks/summary
// @desc    Get stock summary
exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate, location } = req.query;

    // Build query
    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Location filter
    if (location) {
      query.location = location;
    }

    // Get all stocks matching query
    const stocks = await Stock.find(query);

    // Calculate summary
    const summary = {
      totalItems: stocks.length,
      totalStock: 0,
      totalSold: 0,
      totalReturned: 0,
      totalRemaining: 0,
      byProductType: {},
      byLocation: {},
      byDate: {},
    };

    stocks.forEach((stock) => {
      // Totals
      summary.totalStock += stock.totalStock || 0;
      summary.totalSold += stock.soldQty || 0;
      summary.totalReturned += stock.returnQty || 0;
      summary.totalRemaining += stock.remainingQty || 0;

      // By product type
      const productType = stock.productType || "Unknown";
      if (!summary.byProductType[productType]) {
        summary.byProductType[productType] = {
          count: 0,
          totalStock: 0,
          totalSold: 0,
          totalReturned: 0,
          totalRemaining: 0,
        };
      }
      summary.byProductType[productType].count++;
      summary.byProductType[productType].totalStock += stock.totalStock || 0;
      summary.byProductType[productType].totalSold += stock.soldQty || 0;
      summary.byProductType[productType].totalReturned += stock.returnQty || 0;
      summary.byProductType[productType].totalRemaining +=
        stock.remainingQty || 0;

      // By location
      const location = stock.location || "Unknown";
      if (!summary.byLocation[location]) {
        summary.byLocation[location] = {
          count: 0,
          totalStock: 0,
          totalSold: 0,
          totalReturned: 0,
          totalRemaining: 0,
        };
      }
      summary.byLocation[location].count++;
      summary.byLocation[location].totalStock += stock.totalStock || 0;
      summary.byLocation[location].totalSold += stock.soldQty || 0;
      summary.byLocation[location].totalReturned += stock.returnQty || 0;
      summary.byLocation[location].totalRemaining += stock.remainingQty || 0;

      // By date
      const dateStr = stock.date.toISOString().split("T")[0];
      if (!summary.byDate[dateStr]) {
        summary.byDate[dateStr] = {
          count: 0,
          totalStock: 0,
          totalSold: 0,
          totalReturned: 0,
          totalRemaining: 0,
        };
      }
      summary.byDate[dateStr].count++;
      summary.byDate[dateStr].totalStock += stock.totalStock || 0;
      summary.byDate[dateStr].totalSold += stock.soldQty || 0;
      summary.byDate[dateStr].totalReturned += stock.returnQty || 0;
      summary.byDate[dateStr].totalRemaining += stock.remainingQty || 0;
    });

    // Convert objects to arrays for easier consumption
    summary.byProductType = Object.entries(summary.byProductType).map(
      ([type, data]) => ({
        productType: type,
        ...data,
      }),
    );

    summary.byLocation = Object.entries(summary.byLocation).map(
      ([loc, data]) => ({
        location: loc,
        ...data,
      }),
    );

    summary.byDate = Object.entries(summary.byDate).map(([date, data]) => ({
      date,
      ...data,
    }));

    res.json(summary);
  } catch (err) {
    console.error("Error fetching summary:", err);
    res.status(500).json({ message: err.message });
  }
};

// @route   GET /api/stocks/report
// @desc    Get stocks by date range (for Reports.jsx)
exports.getStocksByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, location, groupBy = "day" } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "startDate and endDate are required",
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build query
    const query = {
      date: { $gte: start, $lte: end },
    };

    if (location) {
      query.location = location;
    }

    const stocks = await Stock.find(query).sort({ date: 1 });

    // Group data based on groupBy parameter
    let groupedData;

    if (groupBy === "day") {
      // Group by day
      groupedData = stocks.reduce((acc, stock) => {
        const dateStr = stock.date.toISOString().split("T")[0];

        if (!acc[dateStr]) {
          acc[dateStr] = {
            date: dateStr,
            items: [],
            totalStock: 0,
            totalSold: 0,
            totalReturned: 0,
            totalRemaining: 0,
            locations: new Set(),
          };
        }

        acc[dateStr].items.push({
          productType: stock.productType,
          productName: stock.productName,
          totalStock: stock.totalStock,
          soldQty: stock.soldQty,
          returnQty: stock.returnQty,
          remainingQty: stock.remainingQty,
          unit: stock.unit,
          location: stock.location,
        });

        acc[dateStr].totalStock += stock.totalStock || 0;
        acc[dateStr].totalSold += stock.soldQty || 0;
        acc[dateStr].totalReturned += stock.returnQty || 0;
        acc[dateStr].totalRemaining += stock.remainingQty || 0;
        acc[dateStr].locations.add(stock.location);

        return acc;
      }, {});

      // Convert to array and add location count
      groupedData = Object.values(groupedData).map((item) => ({
        ...item,
        locationCount: item.locations.size,
        locations: Array.from(item.locations),
      }));
    } else if (groupBy === "product") {
      // Group by product
      groupedData = stocks.reduce((acc, stock) => {
        const productKey = `${stock.productType}-${stock.productName}`;

        if (!acc[productKey]) {
          acc[productKey] = {
            productType: stock.productType,
            productName: stock.productName,
            unit: stock.unit,
            totalStock: 0,
            totalSold: 0,
            totalReturned: 0,
            totalRemaining: 0,
            days: new Set(),
            locations: new Set(),
          };
        }

        acc[productKey].totalStock += stock.totalStock || 0;
        acc[productKey].totalSold += stock.soldQty || 0;
        acc[productKey].totalReturned += stock.returnQty || 0;
        acc[productKey].totalRemaining += stock.remainingQty || 0;
        acc[productKey].days.add(stock.date.toISOString().split("T")[0]);
        acc[productKey].locations.add(stock.location);

        return acc;
      }, {});

      // Convert to array and add counts
      groupedData = Object.values(groupedData).map((item) => ({
        ...item,
        dayCount: item.days.size,
        days: Array.from(item.days),
        locationCount: item.locations.size,
        locations: Array.from(item.locations),
      }));
    } else if (groupBy === "location") {
      // Group by location
      groupedData = stocks.reduce((acc, stock) => {
        const location = stock.location || "Unknown";

        if (!acc[location]) {
          acc[location] = {
            location: location,
            items: [],
            totalStock: 0,
            totalSold: 0,
            totalReturned: 0,
            totalRemaining: 0,
            productTypes: new Set(),
          };
        }

        acc[location].items.push({
          date: stock.date.toISOString().split("T")[0],
          productType: stock.productType,
          productName: stock.productName,
          totalStock: stock.totalStock,
          soldQty: stock.soldQty,
          returnQty: stock.returnQty,
          remainingQty: stock.remainingQty,
          unit: stock.unit,
        });

        acc[location].totalStock += stock.totalStock || 0;
        acc[location].totalSold += stock.soldQty || 0;
        acc[location].totalReturned += stock.returnQty || 0;
        acc[location].totalRemaining += stock.remainingQty || 0;
        acc[location].productTypes.add(stock.productType);

        return acc;
      }, {});

      // Convert to array and add product type count
      groupedData = Object.values(groupedData).map((item) => ({
        ...item,
        productTypeCount: item.productTypes.size,
        productTypes: Array.from(item.productTypes),
      }));
    }

    res.json({
      startDate,
      endDate,
      totalItems: stocks.length,
      data: groupedData,
    });
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).json({ message: err.message });
  }
};

// @route   GET /api/stocks/product-options
// @desc    Get unique product options for dropdowns
exports.getProductOptions = async (req, res) => {
  try {
    // Get unique product types
    const productTypes = await Stock.distinct("productType");

    // Get unique product names
    const productNames = await Stock.distinct("productName");

    // Get unique product subcategories
    const productSubCategories = await Stock.distinct("productSubCategory");

    // Get unique locations
    const locations = await Stock.distinct("location");

    // Get unique units
    const units = await Stock.distinct("unit");

    // Get product name by type mapping
    const productsByType = {};
    for (const type of productTypes) {
      const names = await Stock.distinct("productName", { productType: type });
      productsByType[type] = names;
    }

    res.json({
      productTypes: productTypes.filter(Boolean).sort(),
      productNames: productNames.filter(Boolean).sort(),
      productSubCategories: productSubCategories.filter(Boolean).sort(),
      locations: locations.filter(Boolean).sort(),
      units: units.filter(Boolean).sort(),
      productsByType,
    });
  } catch (err) {
    console.error("Error fetching product options:", err);
    res.status(500).json({ message: err.message });
  }
};

// @route   GET /api/stocks/:id
// @desc    Get single stock by ID
exports.getStockById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid stock ID format" });
    }

    const stock = await Stock.findById(id);

    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    res.json({
      id: stock._id,
      date: stock.date,
      productType: stock.productType,
      productName: stock.productName,
      productSubCategory: stock.productSubCategory,
      totalStock: stock.totalStock,
      soldQty: stock.soldQty,
      returnQty: stock.returnQty,
      remainingQty: stock.remainingQty,
      unit: stock.unit,
      location: stock.location,
      notes: stock.notes,
      weatherCondition: stock.weatherCondition,
      weatherHighTemp: stock.weatherHighTemp,
      weatherLowTemp: stock.weatherLowTemp,
      weatherDescription: stock.weatherDescription,
      weatherTemperature: stock.weatherTemperature,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    });
  } catch (err) {
    console.error("Error fetching stock by ID:", err);
    res.status(500).json({ message: err.message });
  }
};

// @route   PUT /api/stocks/:id
// @desc    Update stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid stock ID format" });
    }

    // Check if stock exists
    const existingStock = await Stock.findById(id);
    if (!existingStock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    // Validate that sold and returned don't exceed total stock
    if (
      updateData.soldQty !== undefined &&
      updateData.returnQty !== undefined &&
      updateData.totalStock !== undefined
    ) {
      if (updateData.soldQty + updateData.returnQty > updateData.totalStock) {
        return res.status(400).json({
          message: "Stock sold and returned cannot exceed total stock",
        });
      }
    }

    // Calculate remaining quantity if totalStock, soldQty, or returnQty are updated
    if (
      updateData.totalStock !== undefined ||
      updateData.soldQty !== undefined ||
      updateData.returnQty !== undefined
    ) {
      const totalStock =
        updateData.totalStock !== undefined
          ? updateData.totalStock
          : existingStock.totalStock;
      const soldQty =
        updateData.soldQty !== undefined
          ? updateData.soldQty
          : existingStock.soldQty;
      const returnQty =
        updateData.returnQty !== undefined
          ? updateData.returnQty
          : existingStock.returnQty;

      updateData.remainingQty = totalStock - soldQty - returnQty;
    }

    // Handle weather data updates
    if (
      updateData.weatherHighTemp !== undefined ||
      updateData.weatherLowTemp !== undefined ||
      updateData.weatherTemperature !== undefined
    ) {
      // If weatherTemperature is provided but not high/low, use it for both
      if (
        updateData.weatherTemperature !== undefined &&
        updateData.weatherHighTemp === undefined
      ) {
        updateData.weatherHighTemp = updateData.weatherTemperature;
      }
      if (
        updateData.weatherTemperature !== undefined &&
        updateData.weatherLowTemp === undefined
      ) {
        updateData.weatherLowTemp = updateData.weatherTemperature;
      }

      // If high/low are provided but temperature isn't, use high for temperature
      if (
        updateData.weatherHighTemp !== undefined &&
        updateData.weatherTemperature === undefined
      ) {
        updateData.weatherTemperature = updateData.weatherHighTemp;
      }
    }

    // Update stock
    const updatedStock = await Stock.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true },
    );

    res.json({
      message: "Stock updated successfully",
      stock: {
        id: updatedStock._id,
        date: updatedStock.date,
        productType: updatedStock.productType,
        productName: updatedStock.productName,
        productSubCategory: updatedStock.productSubCategory,
        totalStock: updatedStock.totalStock,
        soldQty: updatedStock.soldQty,
        returnQty: updatedStock.returnQty,
        remainingQty: updatedStock.remainingQty,
        unit: updatedStock.unit,
        location: updatedStock.location,
        notes: updatedStock.notes,
        weatherCondition: updatedStock.weatherCondition,
        weatherHighTemp: updatedStock.weatherHighTemp,
        weatherLowTemp: updatedStock.weatherLowTemp,
        weatherDescription: updatedStock.weatherDescription,
        weatherTemperature: updatedStock.weatherTemperature,
        createdAt: updatedStock.createdAt,
        updatedAt: updatedStock.updatedAt,
      },
    });
  } catch (err) {
    console.error("Error updating stock:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Validation error",
        errors: messages,
      });
    }

    res.status(500).json({ message: err.message });
  }
};

// @route   DELETE /api/stocks/:id
// @desc    Delete a stock entry
exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid stock ID format" });
    }

    // Check if stock exists
    const stock = await Stock.findById(id);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    // Delete stock
    await Stock.findByIdAndDelete(id);

    res.json({
      message: "Stock deleted successfully",
      deletedStock: {
        id: stock._id,
        productName: stock.productName,
        date: stock.date,
        location: stock.location,
      },
    });
  } catch (err) {
    console.error("Error deleting stock:", err);
    res.status(500).json({ message: err.message });
  }
};
