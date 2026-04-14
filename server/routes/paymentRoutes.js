const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getPaymentByBooking } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/:bookingId', protect, getPaymentByBooking);

module.exports = router;
