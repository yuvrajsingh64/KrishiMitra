const mongoose = require('mongoose');

const agentLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: { type: String, required: true },
  userMessage: { type: String, required: true },
  toolCalls: [{
    tool: { type: String },
    args: { type: mongoose.Schema.Types.Mixed },
    result: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  }],
  agentResponse: { type: String },
  responseData: { type: mongoose.Schema.Types.Mixed },
  provider: { type: String, default: 'gemini' },
  durationMs: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AgentLog', agentLogSchema);
