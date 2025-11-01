const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const x402 = require('../middleware/calculatePriceMiddleware');
const { addPurchaseTokensController, getTokenTransactionsController } = require('../controllers/tokenTransactionController');
const { verifyPaymentMiddleware } = require('../middleware/verifyPaymentMiddleware');

const router = express.Router();

// Route to purchase tokens with crypto
router.post('/purchase/crypto', (req, res, next) => {
    req.x402 = { price: `${Number(req.body.amount).toFixed(2)}` };
    req.paymentMethod = 'crypto';
    next();
}, x402, authMiddleware, addPurchaseTokensController);

// Route to purchase tokens with Paystack
router.post('/purchase', verifyPaymentMiddleware, authMiddleware, addPurchaseTokensController);

// Route to get token transactions for a user
router.get('/transactions', authMiddleware, getTokenTransactionsController);

module.exports = router;