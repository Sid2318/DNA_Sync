const express = require("express");
const { runDnaProcess } = require("../services/runDnaProcess");

const router = express.Router();

router.post("/run", async (req, res) => {
  const { input, options } = req.body || {};

  try {
    const result = await runDnaProcess(input, options);
    res.json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const payload = err.payload || {
      error: err.message || "Failed to run executable",
    };
    res.status(statusCode).json(payload);
  }
});

module.exports = router;
