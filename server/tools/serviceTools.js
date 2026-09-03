const Service = require('../models/Service');
const Booking = require('../models/Booking');

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
  const service = await Service.findById(serviceId).populate('provider', 'name');

  if (!service) {
    return { success: false, error: 'Service not found' };
  }

  const booking = await Booking.create({
    service: service._id,
    farmer: farmerId,
    provider: service.provider._id,
    scheduledDate: new Date(scheduledDate),
    notes: notes || '',
    totalAmount: service.price,
    status: 'pending',
    paymentStatus: 'pending',
  });

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
    },
  };
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
