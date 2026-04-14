const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// Lazy Razorpay initialization (env vars loaded by dotenv before first request)
let razorpayInstance = null;
let initialized = false;

function getRazorpay() {
  if (initialized) return razorpayInstance;
  initialized = true;

  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  if (keyId && keySecret && !keyId.includes('stub')) {
    try {
      razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
      console.log('✅ Razorpay initialized with key:', keyId.substring(0, 16) + '...');
    } catch (err) {
      console.error('❌ Razorpay init error:', err.message);
    }
  } else {
    console.log('⚠️  Razorpay running in DEMO mode. Add real test keys to server/.env');
  }
  return razorpayInstance;
}

// @desc    Create Razorpay order for a booking
// @route   POST /api/payments/order
// @access  Private
const createOrder = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId)
      .populate('service', 'title')
      .populate('provider', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'This booking is already paid' });
    }

    const amountInPaise = Math.round(booking.totalAmount * 100);

    // Create payment record
    const payment = await Payment.create({
      booking: booking._id,
      farmer: booking.farmer,
      provider: booking.provider,
      amount: booking.totalAmount,
    });

    const rzp = getRazorpay();
    if (rzp) {
      // ── REAL Razorpay Order ──
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${payment._id}`,
        payment_capture: 1, // auto-capture payment
        notes: {
          bookingId: booking._id.toString(),
          paymentId: payment._id.toString(),
          service: booking.service?.title || 'Agricultural Service',
          provider: booking.provider?.name || 'Provider',
        },
      };

      const order = await rzp.orders.create(options);

      // Save razorpay order ID
      payment.razorpayOrderId = order.id;
      await payment.save();

      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        paymentId: payment._id,
        keyId: process.env.RAZORPAY_KEY_ID,
        mode: 'razorpay',
        booking: {
          id: booking._id,
          service: booking.service?.title,
          provider: booking.provider?.name,
          amount: booking.totalAmount,
        },
      });
    } else {
      // ── DEMO Mode ──
      const fakeOrderId = `order_demo_${Date.now()}`;
      payment.razorpayOrderId = fakeOrderId;
      await payment.save();

      return res.json({
        success: true,
        orderId: fakeOrderId,
        amount: amountInPaise,
        currency: 'INR',
        paymentId: payment._id,
        keyId: 'demo',
        mode: 'demo',
        booking: {
          id: booking._id,
          service: booking.service?.title,
          provider: booking.provider?.name,
          amount: booking.totalAmount,
        },
      });
    }
  } catch (error) {
    console.error('Payment order error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingId,
    paymentId,
    demoMode,
  } = req.body;

  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    if (demoMode) {
      // Demo mode — auto-approve
      payment.status = 'paid';
      payment.razorpayPaymentId = `pay_demo_${Date.now()}`;
      payment.method = 'demo';
      payment.paidAt = new Date();
      await payment.save();

      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        await booking.save();

        if (req.io) {
          req.io.to(booking.provider.toString()).emit('payment_received', {
            message: `Payment of ₹${booking.totalAmount} received (demo)`,
          });
        }
      }

      return res.json({ success: true, message: 'Payment successful (demo)', status: 'paid' });
    }

    // ── REAL Razorpay Signature Verification ──
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification data' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (razorpay_signature !== expectedSignature) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed — signature mismatch',
      });
    }

    // ✅ Payment verified successfully
    payment.status = 'paid';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paidAt = new Date();

    // Fetch payment details from Razorpay for method info
    const rzpVerify = getRazorpay();
    if (rzpVerify) {
      try {
        const payDetails = await rzpVerify.payments.fetch(razorpay_payment_id);
        payment.method = payDetails.method || ''; // upi, card, netbanking, wallet
      } catch (e) {
        console.log('Could not fetch payment method:', e.message);
      }
    }

    await payment.save();

    // Update booking status
    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.paymentStatus = 'paid';
      await booking.save();

      if (req.io) {
        req.io.to(booking.provider.toString()).emit('payment_received', {
          message: `Payment of ₹${booking.totalAmount} received via Razorpay`,
          bookingId: booking._id,
        });
      }
    }

    return res.json({
      success: true,
      message: 'Payment verified successfully',
      status: 'paid',
      method: payment.method,
    });
  } catch (error) {
    console.error('Payment verify error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Get payment details for a booking
// @route   GET /api/payments/:bookingId
// @access  Private
const getPaymentByBooking = async (req, res) => {
  try {
    const payment = await Payment.findOne({ booking: req.params.bookingId })
      .sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({ message: 'No payment found for this booking' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process refund for a rejected booking
// @param   bookingId - the booking ID to refund
// @param   io - socket.io instance for notifications
// @returns { success, message }
const processRefund = async (bookingId, io) => {
  try {
    // Find the paid payment for this booking
    const payment = await Payment.findOne({ 
      booking: bookingId, 
      status: 'paid' 
    }).sort({ createdAt: -1 });

    if (!payment) {
      console.log(`[Refund] No paid payment found for booking ${bookingId}`);
      return { success: false, message: 'No paid payment to refund' };
    }

    const rzp = getRazorpay();

    if (rzp && payment.razorpayPaymentId && !payment.razorpayPaymentId.startsWith('pay_demo')) {
      // ── REAL Razorpay Refund ──
      try {
        const refund = await rzp.payments.refund(payment.razorpayPaymentId, {
          amount: Math.round(payment.amount * 100), // full refund in paise
          speed: 'normal',
          notes: {
            reason: 'Service rejected by provider',
            bookingId: bookingId.toString(),
          },
        });

        payment.status = 'refunded';
        payment.refundId = refund.id;
        payment.refundedAt = new Date();
        payment.refundAmount = payment.amount;
        await payment.save();

        console.log(`[Refund] ✅ Razorpay refund ${refund.id} processed for ₹${payment.amount}`);
      } catch (refundErr) {
        console.error('[Refund] ❌ Razorpay refund failed:', refundErr.message);
        // Mark as refunded anyway to update UI (manual refund needed)
        payment.status = 'refunded';
        payment.refundedAt = new Date();
        payment.refundAmount = payment.amount;
        await payment.save();
      }
    } else {
      // ── DEMO Refund ──
      payment.status = 'refunded';
      payment.refundId = `rfnd_demo_${Date.now()}`;
      payment.refundedAt = new Date();
      payment.refundAmount = payment.amount;
      await payment.save();
      console.log(`[Refund] ✅ Demo refund processed for ₹${payment.amount}`);
    }

    // Update booking payment status
    const Booking = require('../models/Booking');
    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.paymentStatus = 'refunded';
      await booking.save();

      // Notify farmer about refund
      if (io) {
        io.to(booking.farmer.toString()).emit('payment_refunded', {
          message: `₹${payment.amount} has been refunded for your rejected booking`,
          bookingId: booking._id,
          amount: payment.amount,
        });
      }
    }

    return { success: true, message: `₹${payment.amount} refunded successfully` };
  } catch (error) {
    console.error('[Refund] Error:', error.message);
    return { success: false, message: error.message };
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentByBooking,
  processRefund,
};
