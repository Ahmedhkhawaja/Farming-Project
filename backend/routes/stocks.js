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
