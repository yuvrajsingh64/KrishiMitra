const express = require('express');
const router = express.Router();
const { agentChat, getAgentLogs } = require('../controllers/agentController');
const { protect } = require('../middleware/authMiddleware');

// AI Agent chat endpoint
router.post('/chat', protect, agentChat);

// Agent audit logs
router.get('/logs', protect, getAgentLogs);

module.exports = router;
