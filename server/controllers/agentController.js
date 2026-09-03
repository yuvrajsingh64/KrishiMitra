const axios = require('axios');
const AgentLog = require('../models/AgentLog');
const { searchServices, bookService, checkBookingStatus, getMyBookings } = require('../tools/serviceTools');
const { createPaymentLink, processRefund } = require('../tools/paymentTools');

// ── Tool Definitions for Gemini Function Calling ──
const TOOL_DECLARATIONS = [
  {
    name: 'search_services',
    description: 'Search for agricultural services available on KrishiMitra. Use this when a farmer asks about available services, machinery, irrigation, pesticide, labor, transport, or wants to find a specific type of service in a location.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Search keyword (e.g., tractor, drone, sprayer, plowing)' },
        category: { type: 'STRING', description: 'Service category. One of: Machinery, Irrigation, Advanced, Pesticide, Labor, Transport, All', enum: ['Machinery', 'Irrigation', 'Advanced', 'Pesticide', 'Labor', 'Transport', 'All'] },
        location: { type: 'STRING', description: 'Location to search near (e.g., Nagpur, Mumbai, Delhi)' },
      },
    },
  },
  {
    name: 'book_service',
    description: 'Book an agricultural service for the farmer. Only use this AFTER the farmer has confirmed they want to book a specific service. Always confirm with the farmer before calling this.',
    parameters: {
      type: 'OBJECT',
      properties: {
        serviceId: { type: 'STRING', description: 'The _id of the service to book' },
        scheduledDate: { type: 'STRING', description: 'The date for the service in ISO format (YYYY-MM-DD)' },
        notes: { type: 'STRING', description: 'Any additional notes from the farmer' },
      },
      required: ['serviceId', 'scheduledDate'],
    },
  },
  {
    name: 'create_payment_link',
    description: 'Generate a Razorpay payment link for a booking so the farmer can pay. Only call this AFTER a booking has been created and the farmer wants to pay.',
    parameters: {
      type: 'OBJECT',
      properties: {
        bookingId: { type: 'STRING', description: 'The _id of the booking to create payment for' },
      },
      required: ['bookingId'],
    },
  },
  {
    name: 'check_booking_status',
    description: 'Check the status of a specific booking including payment status.',
    parameters: {
      type: 'OBJECT',
      properties: {
        bookingId: { type: 'STRING', description: 'The _id of the booking to check' },
      },
      required: ['bookingId'],
    },
  },
  {
    name: 'get_my_bookings',
    description: 'Get the farmer\'s recent bookings list. Use when the farmer asks about their bookings, orders, or payment history.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'request_refund',
    description: 'Request a refund for a paid booking. Only use when the farmer explicitly asks for a refund and the booking has been paid. Always confirm the amount with the farmer first.',
    parameters: {
      type: 'OBJECT',
      properties: {
        bookingId: { type: 'STRING', description: 'The _id of the booking to refund' },
      },
      required: ['bookingId'],
    },
  },
];

const SYSTEM_PROMPT = `You are Krishi Mitra AI Agent, an intelligent agricultural assistant powered by AI. You help farmers on the KrishiMitra platform with:

1. **Finding Services**: Search for agricultural services (tractors, drones, irrigation, pesticide spraying, labor, transport) by location and category.
2. **Booking Services**: Help farmers book services for specific dates.
3. **Making Payments**: Generate Razorpay payment links so farmers can pay directly.
4. **Tracking Bookings**: Check booking and payment status.
5. **Processing Refunds**: Help with refund requests for paid bookings.
6. **Farm Advisory**: General agricultural advice about crops, soil, weather, pests, government schemes.

IMPORTANT RULES:
- Always search for services first before trying to book anything.
- ALWAYS ask for confirmation before booking a service or processing a payment. Say something like "Should I proceed with booking [service] for ₹[amount] on [date]?"
- ALWAYS ask for confirmation before processing a refund. Say "Are you sure you want to refund ₹[amount] for booking [id]?"
- When presenting services, format them clearly with title, price, location, and rating.
- When a payment link is created, prominently display it so the farmer can click and pay.
- Keep responses conversational, helpful, and concise.
- If you can't find services, suggest the farmer try different search terms or check back later.
- For non-farming questions, politely redirect to agriculture topics.
- Today's date is ${new Date().toISOString().split('T')[0]}.`;

// ── Execute a tool call ──
async function executeTool(toolName, args, userId, userInfo) {
  console.log(`[Agent] Executing tool: ${toolName}`, args);

  switch (toolName) {
    case 'search_services':
      return await searchServices(args);

    case 'book_service':
      return await bookService({
        ...args,
        farmerId: userId,
      });

    case 'create_payment_link':
      return await createPaymentLink({
        bookingId: args.bookingId,
        farmerName: userInfo?.name || 'Farmer',
        farmerEmail: userInfo?.email || '',
      });

    case 'check_booking_status':
      return await checkBookingStatus(args);

    case 'get_my_bookings':
      return await getMyBookings({ farmerId: userId });

    case 'request_refund':
      return await processRefund(args);

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ── Gemini Function Calling Loop ──
async function runAgentLoop(userMessage, userId, userInfo, conversationHistory) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const model = 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Build contents array with conversation history
  const contents = [
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: 'I am Krishi Mitra AI Agent, ready to help you with agricultural services, bookings, payments, and farm advice. How can I assist you today?' }] },
    ...conversationHistory,
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const toolCalls = [];
  let responseData = null;
  const MAX_ITERATIONS = 5;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await axios.post(url, {
      contents,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      generationConfig: {
        maxOutputTokens: 1200,
        temperature: 0.7,
      },
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    const candidate = response.data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // Check if model wants to call a function
    const functionCallPart = parts.find(p => p.functionCall);

    if (functionCallPart) {
      const { name, args } = functionCallPart.functionCall;

      // Execute the tool
      let result;
      try {
        result = await executeTool(name, args || {}, userId, userInfo);
      } catch (err) {
        result = { error: err.message };
      }

      // Track the tool call for audit
      toolCalls.push({
        tool: name,
        args: args || {},
        result,
        timestamp: new Date(),
      });

      // Track response data for frontend rendering
      if (name === 'search_services' && Array.isArray(result)) {
        responseData = { type: 'services', services: result };
      } else if (name === 'book_service' && result?.success) {
        responseData = { type: 'booking', booking: result.booking };
      } else if (name === 'create_payment_link' && result?.success) {
        responseData = { type: 'payment_link', paymentLink: result.paymentLink };
      } else if (name === 'check_booking_status' && result?.success) {
        responseData = { type: 'booking_status', booking: result.booking };
      } else if (name === 'get_my_bookings') {
        responseData = { type: 'bookings_list', bookings: result };
      } else if (name === 'request_refund' && result?.success) {
        responseData = { type: 'refund', refund: result.refund };
      }

      // Add model's exact response (which includes functionCall and possible thought_signature)
      contents.push(candidate.content);
      const formattedResponse = Array.isArray(result) ? { items: result } : (result || { status: 'success' });

      contents.push({
        role: 'user',
        parts: [{ functionResponse: { name, response: formattedResponse } }],
      });

      // Continue loop — model may want to call another tool or respond
      continue;
    }

    // Model returned text — we're done
    const textPart = parts.find(p => p.text);
    if (textPart) {
      return {
        text: textPart.text,
        toolCalls,
        responseData,
      };
    }
  }

  return {
    text: 'I processed your request but couldn\'t generate a complete response. Please try again.',
    toolCalls,
    responseData,
  };
}

// ── API Handler ──
// @desc    AI Agent chat with function calling
// @route   POST /api/agent/chat
// @access  Private
const agentChat = async (req, res) => {
  const { message, conversationHistory = [], sessionId } = req.body;
  const startTime = Date.now();

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Please provide a message.' });
  }

  try {
    const result = await runAgentLoop(
      message.trim(),
      req.user._id.toString(),
      { name: req.user.name, email: req.user.email },
      conversationHistory
    );

    // Log the interaction for audit
    try {
      await AgentLog.create({
        user: req.user._id,
        sessionId: sessionId || `session_${Date.now()}`,
        userMessage: message.trim(),
        toolCalls: result.toolCalls,
        agentResponse: result.text,
        responseData: result.responseData,
        provider: 'gemini',
        durationMs: Date.now() - startTime,
      });
    } catch (logErr) {
      console.error('[Agent] Failed to save log:', logErr.message);
    }

    return res.json({
      text: result.text,
      toolCalls: result.toolCalls,
      data: result.responseData,
      provider: 'gemini',
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[Agent] Error:', error.response?.data || error.message);

    // Fallback to basic chat if function calling fails
    return res.status(500).json({
      message: 'The AI agent encountered an error. Please try again.',
      error: error.message,
    });
  }
};

// @desc    Get agent audit logs for the current user
// @route   GET /api/agent/logs
// @access  Private
const getAgentLogs = async (req, res) => {
  try {
    const logs = await AgentLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('userMessage agentResponse toolCalls durationMs createdAt');

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  agentChat,
  getAgentLogs,
};
