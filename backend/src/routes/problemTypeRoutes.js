const express = require('express');
const {
  getProblemTypes,
  createProblemType,
  updateProblemType,
  deleteProblemType,
} = require('../controllers/problemTypeController');
const { optionalProtect, protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/', optionalProtect, getProblemTypes);
router.post('/', protect, authorize('super_admin'), createProblemType);
router.patch('/:id', protect, authorize('super_admin'), updateProblemType);
router.delete('/:id', protect, authorize('super_admin'), deleteProblemType);
module.exports = router;
