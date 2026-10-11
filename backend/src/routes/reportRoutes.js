const express = require("express");

const {
  createReport,
  getNearbyIncidents,
  getMyReports,
  trackReport,
  deleteMyReport,
} = require("../controllers/reportController");

const {
  protect,
  optionalProtect,
} = require("../middleware/authMiddleware");

const {
  uploadReportEvidence,
} = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/nearby", getNearbyIncidents);

// Public or authenticated citizen reporting.
// Legacy mobile clients can still upload `image`.
// New clients can upload up to 5 `evidence` files.
router.post(
  "/",
  uploadReportEvidence.fields([
    { name: "image", maxCount: 1 },
    { name: "evidence", maxCount: 5 },
  ]),
  optionalProtect,
  createReport,
);

router.get(
  "/track/:trackingCode",
  trackReport,
);

router.get(
  "/my",
  protect,
  getMyReports,
);

router.delete(
  "/:id",
  protect,
  deleteMyReport,
);

module.exports = router;
