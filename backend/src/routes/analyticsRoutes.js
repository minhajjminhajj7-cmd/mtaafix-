const express = require('express');
const { getAnalyticsSummary } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/summary', protect, authorize('super_admin', 'service_provider'), getAnalyticsSummary);
module.exports = router;
