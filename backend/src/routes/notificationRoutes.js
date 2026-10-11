const express = require("express");
const { getNotifications, markNotificationRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/", protect, getNotifications);
router.patch("/:id/read", protect, markNotificationRead);
module.exports = router;
