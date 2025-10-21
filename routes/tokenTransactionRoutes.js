const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const x402 = require('../middleware/calculatePriceMiddleware');
const { addPurchaseTokensController, getTokenTransactionsController } = require('../controllers/tokenTransactionController');

const router = express.Router();

// Route to purchase tokens
router.post('/purchase', (req, res, next) => {
    req.x402 = { price: `$${Number(req.body.amount).toFixed(2)}` };
    next();
}, x402, authMiddleware, addPurchaseTokensController);

// Route to get token transactions for a user
router.get('/transactions', authMiddleware, getTokenTransactionsController);

module.exports = router;