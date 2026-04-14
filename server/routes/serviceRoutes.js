const express = require('express');
const router = express.Router();
const { getServices, getMyServices, createService, deleteService } = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

// Provider's own services (must be ABOVE /:id to avoid route conflict)
router.get('/mine', protect, getMyServices);

router.route('/')
  .get(getServices)
  .post(protect, createService);

router.route('/:id')
  .delete(protect, deleteService);

module.exports = router;
