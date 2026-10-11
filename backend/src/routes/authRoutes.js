const express = require("express");

const {
  register,
  login,
  requestPhoneOtp,
  verifyPhoneOtp
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/otp/request", requestPhoneOtp);
router.post("/otp/verify", verifyPhoneOtp);

module.exports = router;
