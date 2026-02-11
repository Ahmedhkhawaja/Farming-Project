// routes/reports.js
const express = require("express");
const router = express.Router();
const Stock = require("../models/Stock");

// GET sales report by location and date range (with weather data)
router.get("/sales-by-location", async (req, res) => {
  try {
    const { location, startDate, endDate, includeWeather } = req.query;

    // Convert dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build match conditions
    const matchConditions = {
      date: {
        $gte: start,
        $lte: end,
      },
    };

    if (location && location !== "undefined") {
      matchConditions.location = location;
    }

    // Group by date and include weather data
    const salesData = await Stock.aggregate([
      {
        $match: matchConditions,
      },
      {
        $group: {
          _id: "$date",
          totalStock: { $sum: "$totalStock" },
          returnQty: { $sum: "$returnQty" },
          soldQty: { $sum: "$soldQty" },
          // Include weather data from the first document of the day
          weatherCondition: { $first: "$weatherCondition" },
          weatherHighTemp: { $first: "$weatherHighTemp" },
          weatherLowTemp: { $first: "$weatherLowTemp" },
          weatherDescription: { $first: "$weatherDescription" },
        },
      },
      {
        $project: {
          date: "$_id",
          totalStock: 1,
          returnQty: 1,
          soldQty: 1,
          weatherCondition: 1,
          weatherHighTemp: 1,
          weatherLowTemp: 1,
          weatherDescription: 1,
          _id: 0,
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    res.json(salesData);
  } catch (error) {
    console.error("Error fetching sales report:", error);
    res.status(500).json({
      message: "Error fetching sales report",
      error: error.message,
    });
  }
});

// GET location comparison report
router.get("/location-comparison", async (req, res) => {
  console.log("=== LOCATION COMPARISON REQUEST ===");
  console.log("Query params:", req.query);

  try {
    const { month, year, locations } = req.query;

    // Debug: Log received parameters
    console.log("Received params:", { month, year, locations });

    // Validate required parameters
    if (!month || !year) {
      console.error("Missing month or year parameters");
      return res.status(400).json({
        message: "Month and year are required parameters",
      });
    }

    // Parse month and year
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    console.log("Parsed monthNum:", monthNum, "yearNum:", yearNum);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        message: "Month must be a number between 1 and 12",
      });
    }

    // Calculate start and end dates for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0); // Last day of the month
    endDate.setHours(23, 59, 59, 999);

    console.log("Date range:", { startDate, endDate });

    // Build match conditions
    const matchConditions = {
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // If specific locations are provided, add them to match conditions
    if (locations && locations.trim() !== "") {
      const locationArray = locations.split(",").map((loc) => loc.trim());
      console.log("Location array:", locationArray);
      console.log("Location array length:", locationArray.length);

      matchConditions.location = { $in: locationArray };
    }

    console.log("Match conditions:", JSON.stringify(matchConditions, null, 2));

    // First, check if we have any data matching the date range
    const count = await Stock.countDocuments({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    console.log(`Found ${count} records for date range`);

    // Aggregate data by location for the given month
    const comparisonData = await Stock.aggregate([
      {
        $match: matchConditions,
      },
      {
        $group: {
          _id: "$location",
          totalStock: { $sum: "$totalStock" },
          totalSold: { $sum: "$soldQty" },
          totalReturned: { $sum: "$returnQty" },
          recordCount: { $sum: 1 }, // Count of records per location
        },
      },
      {
        $project: {
          location: "$_id",
          totalStock: 1,
          totalSold: 1,
          totalReturned: 1,
          recordCount: 1,
          // FIXED: Changed second 'then' to 'else' in $cond operator
          salesPercentage: {
            $cond: {
              if: { $gt: ["$totalStock", 0] },
              then: {
                $multiply: [{ $divide: ["$totalSold", "$totalStock"] }, 100],
              },
              else: 0, // Changed from 'then: 0' to 'else: 0'
            },
          },
          _id: 0,
        },
      },
      {
        $sort: { totalSold: -1 },
      },
    ]);

    console.log("Aggregation result:", comparisonData);
    console.log("Number of locations in result:", comparisonData.length);

    // Format the data for frontend
    const formattedData = comparisonData.map((item) => ({
      ...item,
      salesPercentage: item.salesPercentage
        ? parseFloat(item.salesPercentage.toFixed(1))
        : 0,
      revenue: 0, // Placeholder - add if you have price data
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("ERROR in location-comparison endpoint:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error fetching location comparison report",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// GET product-wise returns report (products with highest returns)
router.get("/product-wise-returns", async (req, res) => {
  try {
    const { location, productType, startDate, endDate } = req.query;

    if (!location || !startDate || !endDate || !productType) {
      return res.status(400).json({
        message: "Location, productType, startDate, and endDate are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    console.log("Product-wise returns params:", {
      location,
      productType,
      startDate,
      endDate,
      start,
      end,
    });

    // First, match by location, date range, and product type
    const productData = await Stock.aggregate([
      {
        $match: {
          location: location,
          productType: productType, // Filter by product type
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: {
            productName: "$productName",
            productType: "$productType",
            productCategory: "$productCategory",
            productSubCategory: "$productSubCategory",
          },
          totalStock: { $sum: "$totalStock" },
          soldQty: { $sum: "$soldQty" },
          returnQty: { $sum: "$returnQty" },
        },
      },
      {
        $project: {
          productName: "$_id.productName",
          productType: "$_id.productType",
          category: "$_id.productCategory",
          subCategory: "$_id.productSubCategory",
          totalStock: 1,
          soldQty: 1,
          returnQty: 1,
          _id: 0,
        },
      },
      {
        $match: {
          returnQty: { $gt: 0 }, // Only include products with returns
        },
      },
      {
        $sort: { returnQty: -1 }, // Sort by return quantity descending
      },
      {
        $limit: 20, // Limit to top 20 returned products
      },
    ]);

    console.log(`Found ${productData.length} products with returns`);

    // Format the data for frontend
    const formattedData = productData.map((product) => ({
      ...product,
      returnRate:
        product.totalStock > 0
          ? parseFloat(
              ((product.returnQty / product.totalStock) * 100).toFixed(1),
            )
          : 0,
      salesRate:
        product.totalStock > 0
          ? parseFloat(
              ((product.soldQty / product.totalStock) * 100).toFixed(1),
            )
          : 0,
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching product-wise returns report:", error);
    res.status(500).json({
      message: "Error fetching product-wise returns report",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// GET product-wise report
router.get("/product-wise", async (req, res) => {
  try {
    const { location, startDate, endDate } = req.query;

    if (!location || !startDate || !endDate) {
      return res.status(400).json({
        message: "Location, startDate, and endDate are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const productData = await Stock.aggregate([
      {
        $match: {
          location: location,
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: "$productName",
          totalStock: { $sum: "$totalStock" },
          soldQty: { $sum: "$soldQty" },
          returnQty: { $sum: "$returnQty" },
        },
      },
      {
        $project: {
          productName: "$_id",
          totalStock: 1,
          soldQty: 1,
          returnQty: 1,
          _id: 0,
        },
      },
      {
        $sort: { soldQty: -1 },
      },
    ]);

    res.json(productData);
  } catch (error) {
    console.error("Error fetching product-wise report:", error);
    res.status(500).json({
      message: "Error fetching product-wise report",
      error: error.message,
    });
  }
});

// GET daily sales trend
router.get("/daily-sales", async (req, res) => {
  try {
    const { location, startDate, endDate } = req.query;

    if (!location || !startDate || !endDate) {
      return res.status(400).json({
        message: "Location, startDate, and endDate are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const dailyData = await Stock.aggregate([
      {
        $match: {
          location: location,
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          totalStock: { $sum: "$totalStock" },
          soldQty: { $sum: "$soldQty" },
          returnQty: { $sum: "$returnQty" },
        },
      },
      {
        $project: {
          date: "$_id",
          totalStock: 1,
          soldQty: 1,
          returnQty: 1,
          _id: 0,
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    res.json(dailyData);
  } catch (error) {
    console.error("Error fetching daily sales report:", error);
    res.status(500).json({
      message: "Error fetching daily sales report",
      error: error.message,
    });
  }
});

// GET weather impact analysis report
router.get("/weather-impact", async (req, res) => {
  try {
    const { location, startDate, endDate } = req.query;

    if (!location || !startDate || !endDate) {
      return res.status(400).json({
        message: "Location, startDate, and endDate are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    console.log("Weather impact params:", {
      location,
      startDate,
      endDate,
      start,
      end,
    });

    // Get daily sales data with weather information
    const weatherData = await Stock.aggregate([
      {
        $match: {
          location: location,
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: "$date",
          totalStock: { $sum: "$totalStock" },
          soldQty: { $sum: "$soldQty" },
          returnQty: { $sum: "$returnQty" },
          // Get weather data from the first record of the day (assuming consistent for the day)
          weatherCondition: { $first: "$weatherCondition" },
          weatherHighTemp: { $first: "$weatherHighTemp" },
          weatherLowTemp: { $first: "$weatherLowTemp" },
          weatherDescription: { $first: "$weatherDescription" },
        },
      },
      {
        $project: {
          date: "$_id",
          totalStock: 1,
          soldQty: 1,
          returnQty: 1,
          weatherCondition: 1,
          weatherHighTemp: 1,
          weatherLowTemp: 1,
          weatherDescription: 1,
          salesPercentage: {
            $cond: {
              if: { $gt: ["$totalStock", 0] },
              then: {
                $multiply: [{ $divide: ["$soldQty", "$totalStock"] }, 100],
              },
              else: 0,
            },
          },
          _id: 0,
        },
      },
      {
        $match: {
          soldQty: { $gt: 0 }, // Only include days with sales
          weatherCondition: { $exists: true, $ne: null }, // Only include days with weather data
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    console.log(`Found ${weatherData.length} days with weather data`);

    // Calculate average sales for the period
    const totalSales = weatherData.reduce((sum, day) => sum + day.soldQty, 0);
    const avgSales =
      weatherData.length > 0 ? totalSales / weatherData.length : 0;

    // Group by weather condition to get statistics
    const weatherStats = {};
    weatherData.forEach((day) => {
      const condition = day.weatherCondition || "Unknown";
      if (!weatherStats[condition]) {
        weatherStats[condition] = {
          condition: condition,
          days: 0,
          totalSales: 0,
          totalStock: 0,
          avgTemp: 0,
          tempCount: 0,
        };
      }
      weatherStats[condition].days++;
      weatherStats[condition].totalSales += day.soldQty;
      weatherStats[condition].totalStock += day.totalStock;

      // Calculate average temperature if available
      if (day.weatherHighTemp && day.weatherLowTemp) {
        const avgTemp = (day.weatherHighTemp + day.weatherLowTemp) / 2;
        weatherStats[condition].avgTemp += avgTemp;
        weatherStats[condition].tempCount++;
      }
    });

    // Calculate averages and impact percentages
    const weatherSummary = Object.values(weatherStats).map((stat) => {
      const avgDailySales = stat.days > 0 ? stat.totalSales / stat.days : 0;
      const avgTemp = stat.tempCount > 0 ? stat.avgTemp / stat.tempCount : 0;

      // Calculate impact relative to overall average
      const impact =
        avgSales > 0
          ? (((avgDailySales - avgSales) / avgSales) * 100).toFixed(1)
          : 0;

      return {
        weatherCondition: stat.condition,
        days: stat.days,
        avgSales: parseFloat(avgDailySales.toFixed(1)),
        avgTemp: parseFloat(avgTemp.toFixed(1)),
        totalSales: stat.totalSales,
        salesPerDay:
          stat.days > 0 ? Math.round(stat.totalSales / stat.days) : 0,
        impact: parseFloat(impact),
        percentage:
          weatherData.length > 0
            ? parseFloat(((stat.days / weatherData.length) * 100).toFixed(1))
            : 0,
      };
    });

    // Format the response
    const formattedData = {
      dailyData: weatherData.map((day) => ({
        ...day,
        salesPercentage: parseFloat(day.salesPercentage.toFixed(1)),
        dateString: day.date.toISOString().split("T")[0],
        formattedDate: day.date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      })),
      summary: {
        totalDays: weatherData.length,
        avgSales: parseFloat(avgSales.toFixed(1)),
        totalSales: totalSales,
        weatherStats: weatherSummary,
      },
      lowSalesThreshold: 50, // Default threshold for frontend
    };

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching weather impact report:", error);
    res.status(500).json({
      message: "Error fetching weather impact report",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// GET detailed weather impact analysis with low sales days
router.get("/weather-impact-detailed", async (req, res) => {
  try {
    const { location, startDate, endDate, threshold = 50 } = req.query;

    if (!location || !startDate || !endDate) {
      return res.status(400).json({
        message: "Location, startDate, and endDate are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const thresholdPercent = parseFloat(threshold) / 100;

    console.log("Weather impact detailed params:", {
      location,
      startDate,
      endDate,
      threshold,
      thresholdPercent,
    });

    // Get daily sales data with weather information
    const weatherData = await Stock.aggregate([
      {
        $match: {
          location: location,
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: "$date",
          totalStock: { $sum: "$totalStock" },
          soldQty: { $sum: "$soldQty" },
          returnQty: { $sum: "$returnQty" },
          // Get weather data from the first record of the day
          weatherCondition: { $first: "$weatherCondition" },
          weatherHighTemp: { $first: "$weatherHighTemp" },
          weatherLowTemp: { $first: "$weatherLowTemp" },
          weatherDescription: { $first: "$weatherDescription" },
        },
      },
      {
        $project: {
          date: "$_id",
          totalStock: 1,
          soldQty: 1,
          returnQty: 1,
          weatherCondition: 1,
          weatherHighTemp: 1,
          weatherLowTemp: 1,
          weatherDescription: 1,
          _id: 0,
        },
      },
      {
        $match: {
          soldQty: { $gt: 0 }, // Only include days with sales
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    // Calculate average sales
    const totalSales = weatherData.reduce((sum, day) => sum + day.soldQty, 0);
    const avgSales =
      weatherData.length > 0 ? totalSales / weatherData.length : 0;

    // Identify low sales days based on threshold
    const lowSalesDays = weatherData
      .filter((day) => {
        const salesRatio = day.soldQty / avgSales;
        return salesRatio < thresholdPercent;
      })
      .map((day) => ({
        ...day,
        salesRatio: day.soldQty / avgSales,
        salesPercentageOfAvg: ((day.soldQty / avgSales) * 100).toFixed(1),
      }));

    // Group low sales days by weather condition
    const lowSalesByWeather = {};
    lowSalesDays.forEach((day) => {
      const condition = day.weatherCondition || "Unknown";
      if (!lowSalesByWeather[condition]) {
        lowSalesByWeather[condition] = {
          condition: condition,
          days: 0,
          totalSales: 0,
          avgSales: 0,
        };
      }
      lowSalesByWeather[condition].days++;
      lowSalesByWeather[condition].totalSales += day.soldQty;
    });

    // Calculate averages for low sales by weather
    Object.keys(lowSalesByWeather).forEach((condition) => {
      const stat = lowSalesByWeather[condition];
      stat.avgSales = stat.days > 0 ? stat.totalSales / stat.days : 0;
    });

    // Prepare response
    const response = {
      summary: {
        totalDays: weatherData.length,
        lowSalesDays: lowSalesDays.length,
        lowSalesPercentage:
          weatherData.length > 0
            ? ((lowSalesDays.length / weatherData.length) * 100).toFixed(1)
            : 0,
        avgSales: parseFloat(avgSales.toFixed(1)),
        threshold: parseFloat(threshold),
      },
      lowSalesDays: lowSalesDays.map((day) => ({
        date: day.date,
        dateString: day.date.toISOString().split("T")[0],
        formattedDate: day.date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        soldQty: day.soldQty,
        totalStock: day.totalStock,
        salesPercentage:
          day.totalStock > 0
            ? ((day.soldQty / day.totalStock) * 100).toFixed(1)
            : 0,
        salesPercentageOfAvg: day.salesPercentageOfAvg,
        weatherCondition: day.weatherCondition,
        weatherHighTemp: day.weatherHighTemp,
        weatherLowTemp: day.weatherLowTemp,
        weatherDescription: day.weatherDescription,
        isCritical: parseFloat(day.salesPercentageOfAvg) < 30,
      })),
      weatherImpact: Object.values(lowSalesByWeather).map((stat) => ({
        condition: stat.condition,
        lowSalesDays: stat.days,
        avgSalesDuringLow: parseFloat(stat.avgSales.toFixed(1)),
        impact:
          avgSales > 0
            ? (((stat.avgSales - avgSales) / avgSales) * 100).toFixed(1)
            : 0,
      })),
      allDays: weatherData.map((day) => ({
        date: day.date,
        formattedDate: day.date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        soldQty: day.soldQty,
        weatherCondition: day.weatherCondition,
        weatherHighTemp: day.weatherHighTemp,
        weatherLowTemp: day.weatherLowTemp,
      })),
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching detailed weather impact report:", error);
    res.status(500).json({
      message: "Error fetching detailed weather impact report",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

module.exports = router;
