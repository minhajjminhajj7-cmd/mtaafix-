const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      fullName: req.user.full_name,
      phone: req.user.phone,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;
