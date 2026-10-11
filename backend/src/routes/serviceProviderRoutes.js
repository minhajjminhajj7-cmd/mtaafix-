const express = require("express");

const {
  getServiceProviders,
  getServiceProviderById,
  createServiceProvider,
  updateServiceProvider,
  saveServiceProviderAccount,
  updateServiceProviderStatus
} = require("../controllers/serviceProviderController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
 * Everything in this section is controlled
 * by the Super Admin.
 */
router.use(
  protect,
  authorize("super_admin")
);

router.get(
  "/",
  getServiceProviders
);

router.post(
  "/",
  createServiceProvider
);

router.get(
  "/:id",
  getServiceProviderById
);

router.patch(
  "/:id",
  updateServiceProvider
);

/*
 * Creates the login the first time.
 * Updates the same account afterwards.
 */
router.put(
  "/:id/account",
  saveServiceProviderAccount
);

router.patch(
  "/:id/status",
  updateServiceProviderStatus
);

module.exports = router;
