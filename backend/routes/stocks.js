const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");
const auth = require("../middleware/auth");
const Stock = require("../models/Stock");
const requireManager = require("../middleware/requireManager");

router.use(auth);

// -------------------- CREATE --------------------
//router.post("/", stockController.addStock);
//router.post("/bulk", stockController.addMultipleStocks);

// ---------- WRITE operations (manager only) ----------
router.post("/", requireManager, stockController.addStock);
router.post("/bulk", requireManager, stockController.addMultipleStocks);
//router.put("/returns/bulk", requireManager, async (req, res) => { ... });
//router.put("/:id", requireManager, stockController.updateStock);
//router.delete("/:id", requireManager, stockController.deleteStock);

// -------------------- READ --------------------
router.get("/", stockController.getAllStocks);
router.get("/summary", stockController.getSummary);
router.get("/report", stockController.getStocksByDateRange);
router.get("/product-options", stockController.getProductOptions);
router.get("/daily", stockController.getDailyStocks);
//router.get("/history", stockController.getStocksHistory); // or keep inline
//router.get("/:id", stockController.getStockById);

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
