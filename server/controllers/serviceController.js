const Service = require('../models/Service');

// @desc    Get all services (with search, filter, category)
// @route   GET /api/services?search=tractor&category=Machinery&location=Mumbai
// @access  Public
const getServices = async (req, res) => {
  try {
    const { search, category, location } = req.query;
    
    let query = {};

    // Text search on title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const services = await Service.find(query)
      .populate('provider', 'name email')
      .sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get provider's own services
// @route   GET /api/services/mine
// @access  Private (Provider only)
const getMyServices = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can access this' });
    }

    const services = await Service.find({ provider: req.user._id })
      .sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new service
// @route   POST /api/services
// @access  Private (Provider only)
const createService = async (req, res) => {
  const { title, description, category, price, priceUnit, location, iconName, colorClass, mobileNumber } = req.body;

  if (req.user.role !== 'provider') {
    return res.status(403).json({ message: 'Only providers can create services' });
  }

  try {
    const service = await Service.create({
      provider: req.user._id,
      title,
      description,
      category,
      price,
      priceUnit: priceUnit || 'hr',
      location,
      iconName: iconName || 'Tractor',
      colorClass: colorClass || 'text-emerald-400',
      mobileNumber: mobileNumber || ''
    });

    // Return with populated provider
    const populated = await Service.findById(service._id).populate('provider', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private (Provider only — own services)
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this service' });
    }

    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getServices,
  getMyServices,
  createService,
  deleteService
};
