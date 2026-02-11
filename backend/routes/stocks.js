const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");
const auth = require("../middleware/auth");
const Stock = require("../models/Stock");

router.use(auth);

// -------------------- CREATE --------------------
router.post("/", stockController.addStock);
router.post("/bulk", stockController.addMultipleStocks);

// -------------------- READ --------------------
router.get("/", stockController.getAllStocks);
router.get("/summary", stockController.getSummary);
router.get("/report", stockController.getStocksByDateRange);
router.get("/product-options", stockController.getProductOptions);
router.get("/daily", stockController.getDailyStocks);

// ✅ DAILY MUST COME BEFORE :id
router.get("/daily", async (req, res) => {
  try {
    const { date, location } = req.query;

    if (!date || !location) {
      return res
        .status(400)
        .json({ message: "Date and location are required" });
    }

    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

    const stocks = await Stock.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      location,
    }).sort({ productType: 1, productName: 1 });

    res.json(
      stocks.map((stock) => ({
        id: stock._id,
        productType: stock.productType,
        productName: stock.productName,
        totalStock: stock.totalStock || 0,
        soldQty: stock.soldQty || 0,
        returnQty: stock.returnQty || 0,
        remainingQty: stock.remainingQty || 0,
        unit: stock.unit,
        location: stock.location,
        date: stock.date,
      })),
    );
  } catch (err) {
    console.error("Daily stock error:", err);
    res.status(500).json({ message: err.message });
  }
});

// -------------------- RETURNS --------------------
router.put("/returns/bulk", async (req, res) => {
  try {
    const { returns } = req.body;

    await Promise.all(
      returns.map((item) =>
        Stock.findByIdAndUpdate(item.id, {
          returnQty: item.returnQty,
          remainingQty: item.finalRemaining,
          updatedAt: new Date(),
        }),
      ),
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------- HISTORY --------------------
router.get("/history", async (req, res) => {
  try {
    const { days = 7, location, productType } = req.query;

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const query = { date: { $gte: dateLimit } };
    if (location) query.location = location;
    if (productType) query.productType = productType;

    const stocks = await Stock.find(query).sort({ date: 1 });
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------- PARAM ROUTES (LAST) --------------------
router.get("/:id", stockController.getStockById);
router.put("/:id", stockController.updateStock);
router.delete("/:id", stockController.deleteStock);

module.exports = router;
