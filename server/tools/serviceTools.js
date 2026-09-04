const Service = require('../models/Service');
const Booking = require('../models/Booking');
const { createPaymentLink } = require('./paymentTools');

/**
 * Search services in the database by keyword, category, and location.
 */
async function searchServices({ query, category, location }) {
  const filter = {};

  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ];
  }

  if (category && category !== 'All') {
    filter.category = { $regex: category, $options: 'i' };
  }

  if (location) {
    // If no $or already, create one; otherwise merge
    const locFilter = { location: { $regex: location, $options: 'i' } };
    if (filter.$or) {
      filter.$or.push(locFilter);
    } else {
      Object.assign(filter, locFilter);
    }
  }

  const services = await Service.find(filter)
    .populate('provider', 'name email')
    .sort({ rating: -1 })
    .limit(5);

  return services.map(s => ({
    _id: s._id.toString(),
    title: s.title,
    description: s.description || '',
    category: s.category,
    price: s.price,
    priceUnit: s.priceUnit,
    location: s.location,
    rating: s.rating,
    provider: s.provider?.name || 'Unknown',
    providerId: s.provider?._id?.toString() || '',
    mobileNumber: s.mobileNumber || '',
  }));
}

/**
 * Create a booking for a farmer.
 */
async function bookService({ serviceId, farmerId, scheduledDate, notes }) {
  try {
    if (!serviceId) return { success: false, error: 'Service ID is required' };
    if (!scheduledDate) return { success: false, error: 'Scheduled date is required' };

    const service = await Service.findById(serviceId).populate('provider', 'name');

    if (!service) {
      return { success: false, error: 'Service not found. Please search for services first.' };
    }

    if (!service.provider) {
      return { success: false, error: 'Service provider not available.' };
    }

    // Robust date parsing
    let parsedDate = new Date(scheduledDate);
    if (isNaN(parsedDate.getTime())) {
      // Try common formats like "5 sep", "sep 5", "5 september 2026"
      const currentYear = new Date().getFullYear();
      parsedDate = new Date(`${scheduledDate} ${currentYear}`);
    }
    if (isNaN(parsedDate.getTime())) {
      return { success: false, error: `Could not parse date: "${scheduledDate}". Please use YYYY-MM-DD format.` };
    }

    const booking = await Booking.create({
      service: service._id,
      farmer: farmerId,
      provider: service.provider._id,
      scheduledDate: parsedDate,
      notes: notes || '',
      totalAmount: service.price,
      status: 'pending',
      paymentStatus: 'pending',
    });

    // Automatically generate Razorpay payment link for instant checkout
    let paymentLinkData = null;
    try {
      const plResult = await createPaymentLink({
        bookingId: booking._id.toString(),
        farmerName: 'Farmer',
      });
      if (plResult.success) {
        paymentLinkData = plResult.paymentLink;
      }
    } catch (plErr) {
      console.error('[bookService] Auto payment link failed:', plErr.message);
    }

    return {
      success: true,
      booking: {
        _id: booking._id.toString(),
        service: service.title,
        provider: service.provider.name,
        amount: service.price,
        priceUnit: service.priceUnit,
        scheduledDate: booking.scheduledDate.toISOString(),
        status: booking.status,
        paymentLinkUrl: paymentLinkData?.url || null,
      },
      paymentLink: paymentLinkData,
    };
  } catch (err) {
    console.error('[bookService] Error:', err.message);
    return { success: false, error: `Booking failed: ${err.message}` };
  }
}

/**
 * Get booking status by booking ID.
 */
async function checkBookingStatus({ bookingId }) {
  const booking = await Booking.findById(bookingId)
    .populate('service', 'title price priceUnit')
    .populate('provider', 'name')
    .populate('farmer', 'name');

  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  return {
    success: true,
    booking: {
      _id: booking._id.toString(),
      service: booking.service?.title || 'Unknown',
      provider: booking.provider?.name || 'Unknown',
      farmer: booking.farmer?.name || 'Unknown',
      amount: booking.totalAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      scheduledDate: booking.scheduledDate?.toISOString(),
      createdAt: booking.createdAt?.toISOString(),
    },
  };
}

/**
 * Get all bookings for a farmer (recent ones).
 */
async function getMyBookings({ farmerId }) {
  const bookings = await Booking.find({ farmer: farmerId })
    .populate('service', 'title price priceUnit')
    .populate('provider', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  return bookings.map(b => ({
    _id: b._id.toString(),
    service: b.service?.title || 'Unknown',
    provider: b.provider?.name || 'Unknown',
    amount: b.totalAmount,
    status: b.status,
    paymentStatus: b.paymentStatus,
    scheduledDate: b.scheduledDate?.toISOString(),
  }));
}

module.exports = {
  searchServices,
  bookService,
  checkBookingStatus,
  getMyBookings,
};
