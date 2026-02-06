const express = require('express');
const { createPromoTransaction, deletePromotionEntryController } = require('../controllers/promoController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Route to create promotion transaction (protected route)
router.post('/create', authMiddleware, createPromoTransaction);
// Route to delete promotion entry (protected route)
router.delete('/:name', authMiddleware, deletePromotionEntryController);

module.exports = router;