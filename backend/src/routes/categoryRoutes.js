const express = require('express');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { optionalProtect, protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/', optionalProtect, getCategories);
router.post('/', protect, authorize('super_admin'), createCategory);
router.patch('/:id', protect, authorize('super_admin'), updateCategory);
router.delete('/:id', protect, authorize('super_admin'), deleteCategory);
module.exports = router;
