const axios = require('axios');

const SYSTEM_PROMPT = `You are Krishi Mitra, an expert AI assistant for Indian agriculture. You help farmers with:
- Crop selection and planting advice based on season and region
- Soil health analysis and fertilizer recommendations
- Pest and disease identification and treatment
- Weather-based farming suggestions
- Irrigation and water management
- Market prices and selling strategies
- Government schemes for farmers
- Modern farming techniques and equipment guidance
Keep responses concise, practical, and in simple language. If asked about non-farming topics, politely redirect to agriculture.`;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ── Model list: try multiple models in case one is rate-limited ──
const GEMINI_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
];

// Primary: Try Gemini with multiple model fallbacks
async function tryGemini(prompt, apiKey) {
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[AI] Trying Gemini model: ${model}`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const response = await axios.post(url, {
        contents: [{
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${prompt}` }]
        }],
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.7,
        }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log(`[AI] ✓ Gemini ${model} succeeded`);
        return text;
      }
    } catch (error) {
      const status = error.response?.status;
      console.log(`[AI] ✗ Gemini ${model} failed (${status || error.message})`);
      
      // If it's not a rate limit, try next model immediately
      // If rate limited, wait a bit then try next model
      if (status === 429) {
        await sleep(500);
      }
    }
  }
  throw new Error('All Gemini models failed');
}

// Fallback 1: Groq (free tier, very fast)
async function tryGroq(prompt) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error('GROQ_API_KEY not configured');

  console.log('[AI] Trying Groq...');
  const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    max_tokens: 800,
    temperature: 0.7
  }, {
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 20000
  });

  const text = response.data?.choices?.[0]?.message?.content;
  if (text) {
    console.log('[AI] ✓ Groq succeeded');
    return text;
  }
  throw new Error('Empty Groq response');
}

// Fallback 2: Smart offline response based on keyword matching
function getOfflineResponse(prompt) {
  const lower = prompt.toLowerCase();
  
  const responses = {
    crop: "🌾 **Crop Advice**: For the current Kharif season, consider planting rice, maize, or cotton depending on your region. Ensure soil pH is between 6.0-7.5 for best yields. Use certified seeds from government-approved agencies for better germination rates.",
    weather: "🌤️ **Weather Tip**: Check IMD (India Meteorological Department) for your region's forecast at mausam.imd.gov.in. During monsoon, ensure proper drainage in fields. Avoid spraying pesticides before expected rain.",
    pest: "🐛 **Pest Control**: For common pests, try neem oil spray (5ml/liter water) as an organic solution. For larger infestations, contact your nearest Krishi Vigyan Kendra (KVK). Maintain crop rotation to naturally reduce pest populations.",
    soil: "🌱 **Soil Health**: Get your soil tested at the nearest government soil testing lab (free of cost). Maintain organic matter by adding compost and green manure. Avoid over-use of chemical fertilizers — they degrade soil health over time.",
    water: "💧 **Water Management**: Drip irrigation saves 30-50% water compared to flood irrigation. Mulching helps retain soil moisture. Water crops early morning or late evening to reduce evaporation losses.",
    price: "📊 **Market Prices**: Check eNAM (enam.gov.in) for real-time mandi prices across India. Consider joining a Farmer Producer Organization (FPO) for better bargaining power. Store produce properly to sell when prices are favorable.",
    scheme: "🏛️ **Government Schemes**: PM-KISAN provides ₹6,000/year to farmer families. Fasal Bima Yojana covers crop insurance. NABARD offers subsidized loans. Visit your nearest CSC center or agriculture office for applications.",
    fertilizer: "🧪 **Fertilizer Guide**: Use DAP for phosphorus, MOP for potassium, and urea for nitrogen. Follow soil test recommendations for optimal usage. Apply fertilizers when soil has adequate moisture for better absorption.",
    seed: "🌰 **Seed Selection**: Always buy certified seeds from authorized dealers. Check germination rate (should be >80%). For hybrid varieties, consult your local agriculture extension officer.",
    organic: "🌿 **Organic Farming**: Use vermicompost, cow dung manure, and green manure for nutrients. Neem-based pesticides are effective for pest control. Organic certification takes 3 years — start transitioning gradually.",
  };

  // Find matching topic
  for (const [keyword, response] of Object.entries(responses)) {
    if (lower.includes(keyword)) return response;
  }

  // Generic farming response
  return "🌾 **Krishi Mitra Tip**: I'm currently experiencing high demand, but here are some quick tips:\n\n" +
    "• **Soil**: Get free soil testing at your nearest government lab\n" +
    "• **Seeds**: Use certified seeds for 20-30% better yields\n" +
    "• **Water**: Drip irrigation saves 30-50% water\n" +
    "• **Market**: Check eNAM (enam.gov.in) for real-time prices\n" +
    "• **Schemes**: PM-KISAN gives ₹6,000/year — apply via CSC center\n\n" +
    "Please try asking again in a moment for a more detailed AI-powered response!";
}

// @desc    Get AI Advisory or Chat response (with fallback chain)
// @route   POST /api/ai/chat
// @access  Private
const getAIChatResponse = async (req, res) => {
  const { prompt } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ message: 'Please provide a question.' });
  }

  // ── Tier 1: Gemini (try multiple models) ──
  if (geminiKey) {
    try {
      const text = await tryGemini(prompt, geminiKey);
      return res.json({ text, provider: 'gemini' });
    } catch (error) {
      console.log('[AI] All Gemini models exhausted');
    }
  }

  // ── Tier 2: Groq ──
  try {
    const text = await tryGroq(prompt);
    return res.json({ text, provider: 'groq' });
  } catch (groqError) {
    console.log('[AI] Groq failed:', groqError.message);
  }

  // ── Tier 3: Smart offline response ──
  console.log('[AI] Using smart offline response');
  const text = getOfflineResponse(prompt);
  return res.json({ text, provider: 'offline' });
};

module.exports = {
  getAIChatResponse
};
