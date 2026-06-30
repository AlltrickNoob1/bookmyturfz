const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/paymentController');

const router = express.Router();

// POST /api/payment/create-order
router.post('/create-order', createOrder);

// POST /api/payment/verify-payment
router.post('/verify-payment', verifyPayment);

module.exports = router;
