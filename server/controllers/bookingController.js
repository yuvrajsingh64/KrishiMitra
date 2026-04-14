const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { processRefund } = require('./paymentController');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Farmer only)
const createBooking = async (req, res) => {
  const { serviceId, scheduledDate, notes, totalAmount } = req.body;

  try {
    const service = await Service.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can book services' });
    }

    const booking = await Booking.create({
      service: service._id,
      farmer: req.user._id,
      provider: service.provider, // pulled from service
      scheduledDate,
      notes,
      totalAmount
    });

    // Notify Provider in real-time
    req.io.to(service.provider.toString()).emit('new_bookingRequest', {
      message: `You have a new booking request for ${service.title}`,
      booking
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
  try {
    let bookings;
    
    // Depending on role, fetch relevant bookings
    if (req.user.role === 'farmer') {
      bookings = await Booking.find({ farmer: req.user._id })
        .populate('service', 'title category price priceUnit location iconName')
        .populate('provider', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Provider — show ONLY bookings for their services
      bookings = await Booking.find({ provider: req.user._id })
        .populate('service', 'title category price priceUnit location iconName')
        .populate('farmer', 'name email')
        .sort({ createdAt: -1 });
    }
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Provider only)
const updateBookingStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only the assigned provider can update status (or admin)
    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    booking.status = status;
    const updatedBooking = await booking.save();

    // ── Auto-refund on rejection ──
    let refundResult = null;
    if (status === 'rejected' && booking.paymentStatus === 'paid') {
      refundResult = await processRefund(booking._id, req.io);
      console.log(`[Booking] Rejection refund for ${booking._id}:`, refundResult.message);
    }

    // Setup targeted real-time alert to Farmer
    const statusMessage = status === 'rejected' && refundResult?.success
      ? `Your booking has been rejected. ₹${booking.totalAmount} will be refunded to your account.`
      : `Your booking status is now ${status}`;

    req.io.to(booking.farmer.toString()).emit('booking_statusUpdated', {
      message: statusMessage,
      booking: updatedBooking,
      refund: refundResult || null,
    });

    res.json({ 
      ...updatedBooking.toObject(), 
      refund: refundResult || null 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getBookings,
  updateBookingStatus
};
