const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

/**
 * Get or create Razorpay instance.
 */
function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  if (keyId && keySecret && !keyId.includes('stub')) {
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return null;
}

/**
 * Create a Razorpay Payment Link for a booking.
 * This is the key agentic commerce feature — payment happens via link, not checkout form.
 */
async function createPaymentLink({ bookingId, farmerName, farmerEmail }) {
  const booking = await Booking.findById(bookingId)
    .populate('service', 'title price')
    .populate('provider', 'name');

  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  if (booking.paymentStatus === 'paid') {
    return { success: false, error: 'This booking is already paid' };
  }

  const amountInPaise = Math.round(booking.totalAmount * 100);

  // Create payment record
  let payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 });
  if (!payment) {
    payment = await Payment.create({
      booking: booking._id,
      farmer: booking.farmer,
      provider: booking.provider._id,
      amount: booking.totalAmount,
    });
  }

  const rzp = getRazorpay();

  if (rzp) {
    try {
      // Create Razorpay Payment Link
      const paymentLink = await rzp.paymentLink.create({
        amount: amountInPaise,
        currency: 'INR',
        accept_partial: false,
        description: `${booking.service?.title || 'Agricultural Service'} - KrishiMitra`,
        customer: {
          name: farmerName || 'Farmer',
          email: farmerEmail || '',
        },
        notify: {
          email: !!farmerEmail,
        },
        reminder_enable: true,
        notes: {
          bookingId: booking._id.toString(),
          paymentId: payment._id.toString(),
          service: booking.service?.title || 'Service',
          provider: booking.provider?.name || 'Provider',
          source: 'ai_agent',
        },
        callback_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/bookings`,
        callback_method: 'get',
      });

      // Save razorpay info
      payment.razorpayOrderId = paymentLink.id;
      await payment.save();

      return {
        success: true,
        paymentLink: {
          url: paymentLink.short_url,
          amount: booking.totalAmount,
          currency: 'INR',
          id: paymentLink.id,
          service: booking.service?.title,
          provider: booking.provider?.name,
          expiresBy: paymentLink.expire_by ? new Date(paymentLink.expire_by * 1000).toISOString() : null,
        },
      };
    } catch (err) {
      console.error('[PaymentTools] Razorpay Payment Link error:', err.message);
      return { success: false, error: `Payment link creation failed: ${err.message}` };
    }
  } else {
    // Demo mode
    const demoUrl = `https://rzp.io/l/demo-${booking._id.toString().slice(-6)}`;
    payment.razorpayOrderId = `plink_demo_${Date.now()}`;
    await payment.save();

    return {
      success: true,
      paymentLink: {
        url: demoUrl,
        amount: booking.totalAmount,
        currency: 'INR',
        id: payment.razorpayOrderId,
        service: booking.service?.title,
        provider: booking.provider?.name,
        mode: 'demo',
      },
    };
  }
}

/**
 * Process a refund for a booking (wraps existing refund logic).
 */
async function processRefund({ bookingId }) {
  const payment = await Payment.findOne({
    booking: bookingId,
    status: 'paid',
  }).sort({ createdAt: -1 });

  if (!payment) {
    return { success: false, error: 'No paid payment found to refund' };
  }

  const rzp = getRazorpay();

  if (rzp && payment.razorpayPaymentId && !payment.razorpayPaymentId.startsWith('pay_demo')) {
    try {
      const refund = await rzp.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(payment.amount * 100),
        speed: 'normal',
        notes: {
          reason: 'Refund requested via AI agent',
          bookingId: bookingId.toString(),
        },
      });

      payment.status = 'refunded';
      payment.refundId = refund.id;
      payment.refundedAt = new Date();
      payment.refundAmount = payment.amount;
      await payment.save();

      // Update booking
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.paymentStatus = 'refunded';
        await booking.save();
      }

      return {
        success: true,
        refund: {
          id: refund.id,
          amount: payment.amount,
          bookingId: bookingId,
        },
      };
    } catch (err) {
      return { success: false, error: `Refund failed: ${err.message}` };
    }
  } else {
    // Demo refund
    payment.status = 'refunded';
    payment.refundId = `rfnd_demo_${Date.now()}`;
    payment.refundedAt = new Date();
    payment.refundAmount = payment.amount;
    await payment.save();

    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.paymentStatus = 'refunded';
      await booking.save();
    }

    return {
      success: true,
      refund: {
        id: payment.refundId,
        amount: payment.amount,
        bookingId: bookingId,
        mode: 'demo',
      },
    };
  }
}

module.exports = {
  createPaymentLink,
  processRefund,
};
