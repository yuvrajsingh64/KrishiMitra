const axios = require('axios');
const AgentLog = require('../models/AgentLog');
const { searchServices, bookService, checkBookingStatus, getMyBookings } = require('../tools/serviceTools');
const { createPaymentLink, processRefund } = require('../tools/paymentTools');

// ── Tool Definitions (OpenAI format for Groq) ──
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_services',
      description: 'Search for agricultural services available on KrishiMitra. Use this when a farmer asks about available services, machinery, irrigation, pesticide, labor, transport, or wants to find a specific type of service in a location.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keyword (e.g., tractor, drone, sprayer, plowing)' },
          category: { type: 'string', description: 'Service category', enum: ['Machinery', 'Irrigation', 'Advanced', 'Pesticide', 'Labor', 'Transport', 'All'] },
          location: { type: 'string', description: 'Location to search near (e.g., Nagpur, Mumbai, Delhi)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_service',
      description: 'Book an agricultural service for the farmer. Only use this AFTER the farmer has confirmed they want to book a specific service. Always confirm with the farmer before calling this.',
      parameters: {
        type: 'object',
        properties: {
          serviceId: { type: 'string', description: 'The _id of the service to book' },
          scheduledDate: { type: 'string', description: 'The date for the service in ISO format (YYYY-MM-DD)' },
          notes: { type: 'string', description: 'Any additional notes from the farmer' },
        },
        required: ['serviceId', 'scheduledDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_payment_link',
      description: 'Generate a Razorpay payment link for a booking so the farmer can pay. Only call this AFTER a booking has been created and the farmer wants to pay.',
      parameters: {
        type: 'object',
        properties: {
          bookingId: { type: 'string', description: 'The _id of the booking to create payment for' },
        },
        required: ['bookingId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_booking_status',
      description: 'Check the status of a specific booking including payment status.',
      parameters: {
        type: 'object',
        properties: {
          bookingId: { type: 'string', description: 'The _id of the booking to check' },
        },
        required: ['bookingId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_bookings',
      description: "Get the farmer's recent bookings list. Use when the farmer asks about their bookings, orders, or payment history.",
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_refund',
      description: 'Request a refund for a paid booking. Only use when the farmer explicitly asks for a refund and the booking has been paid. Always confirm the amount with the farmer first.',
      parameters: {
        type: 'object',
        properties: {
          bookingId: { type: 'string', description: 'The _id of the booking to refund' },
        },
        required: ['bookingId'],
      },
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
- ALWAYS ask for confirmation before processing a refund.
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
      return await bookService({ ...args, farmerId: userId });
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

// ── Groq Tool-Calling Loop ──
async function runAgentLoop(userMessage, userId, userInfo, conversationHistory) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error('GROQ_API_KEY not configured');

  // Build messages array
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const toolCalls = [];
  let responseData = null;
  const MAX_ITERATIONS = 5;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // Retry Groq call up to 2 times on transient errors
    let response;
    for (let retry = 0; retry < 2; retry++) {
      try {
        response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'qwen/qwen3.8-27b',
          messages,
          tools: TOOLS,
          tool_choice: 'auto',
          max_tokens: 1200,
          temperature: 0.7,
        }, {
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        });
        break; // success
      } catch (apiErr) {
        console.error(`[Agent] Groq attempt ${retry + 1} failed:`, apiErr.response?.status || apiErr.message);
        if (retry === 0) {
          await new Promise(r => setTimeout(r, 1000)); // wait 1s before retry
        } else {
          throw apiErr; // give up after 2nd attempt
        }
      }
    }

    const choice = response.data?.choices?.[0];
    const assistantMessage = choice?.message;

    if (!assistantMessage) break;

    // Check if model wants to call tools
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Add the assistant's message (with tool_calls) to history
      messages.push(assistantMessage);

      // Execute each tool call
      for (const tc of assistantMessage.tool_calls) {
        const fnName = tc.function.name;
        let fnArgs = {};
        try {
          fnArgs = JSON.parse(tc.function.arguments || '{}');
        } catch (e) {
          fnArgs = {};
        }

        let result;
        try {
          result = await executeTool(fnName, fnArgs, userId, userInfo);
        } catch (err) {
          result = { error: err.message };
        }

        // Track the tool call for audit
        toolCalls.push({
          tool: fnName,
          args: fnArgs,
          result,
          timestamp: new Date(),
        });

        // Track response data for frontend rendering
        if (fnName === 'search_services' && Array.isArray(result)) {
          responseData = { type: 'services', services: result };
        } else if (fnName === 'book_service' && result?.success) {
          responseData = { type: 'booking', booking: result.booking };
        } else if (fnName === 'create_payment_link' && result?.success) {
          responseData = { type: 'payment_link', paymentLink: result.paymentLink };
        } else if (fnName === 'check_booking_status' && result?.success) {
          responseData = { type: 'booking_status', booking: result.booking };
        } else if (fnName === 'get_my_bookings') {
          responseData = { type: 'bookings_list', bookings: result };
        } else if (fnName === 'request_refund' && result?.success) {
          responseData = { type: 'refund', refund: result.refund };
        }

        // Add tool result to messages
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

      // Continue loop — model may want to call more tools or respond with text
      continue;
    }

    // Model returned text — we're done
    if (assistantMessage.content) {
      return {
        text: assistantMessage.content,
        toolCalls,
        responseData,
      };
    }
  }

  return {
    text: "I processed your request but couldn't generate a complete response. Please try again.",
    toolCalls,
    responseData,
  };
}

// ── API Handler ──
// @desc    AI Agent chat with tool calling
// @route   POST /api/agent/chat
// @access  Private
const agentChat = async (req, res) => {
  const { message, conversationHistory = [], sessionId } = req.body;
  const startTime = Date.now();

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Please provide a message.' });
  }

  try {
    // Convert frontend conversation history to OpenAI message format
    const formattedHistory = conversationHistory.map(msg => {
      if (msg.role === 'user') {
        return { role: 'user', content: msg.parts?.[0]?.text || msg.content || '' };
      } else if (msg.role === 'model' || msg.role === 'assistant') {
        return { role: 'assistant', content: msg.parts?.[0]?.text || msg.content || '' };
      }
      return null;
    }).filter(Boolean);

    const result = await runAgentLoop(
      message.trim(),
      req.user._id.toString(),
      { name: req.user.name, email: req.user.email },
      formattedHistory
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
        provider: 'groq',
        durationMs: Date.now() - startTime,
      });
    } catch (logErr) {
      console.error('[Agent] Failed to save log:', logErr.message);
    }

    return res.json({
      text: result.text,
      toolCalls: result.toolCalls,
      data: result.responseData,
      provider: 'groq',
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[Agent] Error:', error.response?.data || error.message);
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
