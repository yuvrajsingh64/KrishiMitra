import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, MapPin, Star, CreditCard, ExternalLink, Clock, CheckCircle, XCircle, RefreshCw, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

// ── Rich Message Components ──

function ServiceCard({ service }) {
  return (
    <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600/50">
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md font-medium">{service.category}</span>
        <div className="flex items-center gap-1 text-xs text-amber-400">
          <Star size={10} className="fill-amber-400" />
          {service.rating || 0}
        </div>
      </div>
      <h4 className="text-sm font-semibold text-slate-100 mt-1">{service.title}</h4>
      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
        <MapPin size={10} />
        <span>{service.location}</span>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-emerald-400 font-bold text-sm">₹{service.price}/{service.priceUnit}</span>
        <span className="text-xs text-slate-500">by {service.provider}</span>
      </div>
    </div>
  );
}

function PaymentLinkCard({ paymentLink }) {
  return (
    <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl p-4 border border-emerald-500/30">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard size={16} className="text-emerald-400" />
        <span className="text-sm font-semibold text-emerald-300">Payment Ready</span>
      </div>
      <div className="text-xs text-slate-300 mb-1">
        {paymentLink.service} • {paymentLink.provider}
      </div>
      <div className="text-lg font-bold text-white mb-3">
        ₹{paymentLink.amount}
      </div>
      <a
        href={paymentLink.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
      >
        <CreditCard size={14} />
        Pay Now
        <ExternalLink size={12} />
      </a>
      {paymentLink.mode === 'demo' && (
        <p className="text-xs text-amber-400 mt-2 text-center">Demo Mode</p>
      )}
    </div>
  );
}

function BookingCard({ booking }) {
  const statusColors = {
    pending: 'text-amber-400',
    accepted: 'text-emerald-400',
    rejected: 'text-red-400',
    completed: 'text-cyan-400',
  };
  const paymentColors = {
    pending: 'text-amber-400',
    paid: 'text-emerald-400',
    failed: 'text-red-400',
    refunded: 'text-purple-400',
  };

  return (
    <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600/50">
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-sm font-semibold text-slate-100">{booking.service}</h4>
        <span className={`text-xs font-medium ${statusColors[booking.status] || 'text-slate-400'}`}>
          {booking.status?.toUpperCase()}
        </span>
      </div>
      <div className="text-xs text-slate-400">Provider: {booking.provider}</div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-emerald-400 font-bold text-sm">₹{booking.amount}</span>
        <span className={`text-xs ${paymentColors[booking.paymentStatus] || 'text-slate-400'}`}>
          Payment: {booking.paymentStatus}
        </span>
      </div>
      {booking.scheduledDate && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
          <Clock size={10} />
          {new Date(booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      )}
    </div>
  );
}

function ToolCallBadge({ toolCalls }) {
  if (!toolCalls || toolCalls.length === 0) return null;
  
  const toolIcons = {
    search_services: '🔍',
    book_service: '📋',
    create_payment_link: '💳',
    check_booking_status: '📊',
    get_my_bookings: '📦',
    request_refund: '💰',
  };

  return (
    <div className="flex flex-wrap gap-1 mb-1">
      {toolCalls.map((tc, i) => (
        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">
          {toolIcons[tc.tool] || '⚙️'} {tc.tool.replace(/_/g, ' ')}
        </span>
      ))}
    </div>
  );
}

function RichData({ data }) {
  if (!data) return null;

  switch (data.type) {
    case 'services':
      return (
        <div className="space-y-2 mt-2">
          {data.services?.map((s, i) => <ServiceCard key={i} service={s} />)}
        </div>
      );
    case 'payment_link':
      return (
        <div className="mt-2">
          <PaymentLinkCard paymentLink={data.paymentLink} />
        </div>
      );
    case 'booking':
      return (
        <div className="mt-2">
          <BookingCard booking={data.booking} />
        </div>
      );
    case 'booking_status':
      return (
        <div className="mt-2">
          <BookingCard booking={data.booking} />
        </div>
      );
    case 'bookings_list':
      return (
        <div className="space-y-2 mt-2">
          {data.bookings?.map((b, i) => <BookingCard key={i} booking={b} />)}
        </div>
      );
    case 'refund':
      return (
        <div className="bg-purple-500/20 rounded-xl p-3 border border-purple-500/30 mt-2">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">Refund Processed</span>
          </div>
          <p className="text-xs text-slate-300 mt-1">₹{data.refund?.amount} refunded successfully</p>
        </div>
      );
    default:
      return null;
  }
}

// ── Main Chatbot Component ──

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{
    role: 'ai',
    text: '👋 Hello! I\'m **Krishi Mitra AI Agent**.\n\nI can help you:\n🔍 **Search** for agricultural services\n📋 **Book** services for your farm\n💳 **Pay** via secure Razorpay links\n📊 **Track** your bookings\n\nJust tell me what you need!',
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [sessionId] = useState(`session_${Date.now()}`);
  const { user } = useAuth();
  const chatEndRef = useRef(null);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handler);
    return () => window.removeEventListener('open-chatbot', handler);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    if (!user) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', text: '🔒 You need to be logged in to use the AI Agent!' }]);
        setIsTyping(false);
      }, 500);
      return;
    }

    try {
      const { data } = await api.post('/api/agent/chat', {
        message: userMessage,
        conversationHistory,
        sessionId,
      });

      // Build rich assistant context including tool results for multi-turn
      let assistantContent = data.text;
      if (data.toolCalls && data.toolCalls.length > 0) {
        const toolContext = data.toolCalls.map(tc => {
          return `[Tool: ${tc.tool}, Args: ${JSON.stringify(tc.args)}, Result: ${JSON.stringify(tc.result)}]`;
        }).join('\n');
        assistantContent += `\n\n[CONTEXT FOR NEXT TURN - service/booking IDs from tools]\n${toolContext}`;
      }

      // Update conversation history for context (OpenAI format for Groq)
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantContent },
      ].slice(-10)); // Keep last 10 messages for context

      setMessages(prev => [...prev, {
        role: 'ai',
        text: data.text,
        toolCalls: data.toolCalls,
        data: data.data,
      }]);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Sorry, I\'m having trouble right now. Please try again.';
      setMessages(prev => [...prev, { role: 'ai', text: `❌ ${errorMsg}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Render inline parts: bold + clickable URLs
  const renderInline = (str) => {
    // Split on bold markers and URLs
    const parts = str.split(/(\*\*.*?\*\*|https?:\/\/[^\s)]+)/g);
    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (/^https?:\/\//.test(part)) {
        return (
          <a key={j} href={part} target="_blank" rel="noopener noreferrer"
            className="text-emerald-400 underline break-all hover:text-emerald-300">
            {part.length > 45 ? part.slice(0, 45) + '…' : part}
          </a>
        );
      }
      return part;
    });
  };

  // Simple markdown-like rendering for bold text + links
  const renderText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {renderInline(line)}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-full shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 z-50 flex items-center justify-center group"
      >
        <Bot size={24} />
        <Sparkles size={12} className="absolute -top-1 -right-1 text-amber-300 animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[380px] h-[560px] glass bg-slate-900 shadow-2xl rounded-2xl border border-slate-700/50 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Krishi Mitra AI Agent</h3>
                  <p className="text-[10px] text-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></span>
                    Powered by Gemini + Razorpay
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:text-emerald-200 transition-colors p-1">
                <X size={18} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] ${msg.role === 'user' ? '' : ''}`}>
                    {/* Tool call badges for AI messages */}
                    {msg.role === 'ai' && msg.toolCalls && (
                      <ToolCallBadge toolCalls={msg.toolCalls} />
                    )}
                    {/* Message bubble */}
                    <div className={`rounded-2xl p-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-emerald-500 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                    }`}>
                      {renderText(msg.text)}
                    </div>
                    {/* Rich data below the message */}
                    {msg.role === 'ai' && msg.data && (
                      <RichData data={msg.data} />
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-700">
                    <div className="flex items-center gap-2">
                      <Loader size={14} className="text-emerald-400 animate-spin" />
                      <span className="text-xs text-slate-400">Agent is thinking...</span>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {['Find tractors near me', 'Show my bookings', 'Crop advice'].map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); }}
                    className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-t border-slate-700 bg-slate-800/50 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything about services..."
                disabled={isTyping}
                className="flex-1 bg-slate-700/50 text-slate-100 rounded-xl px-4 py-2.5 border border-slate-600 focus:outline-none focus:border-emerald-500 text-sm disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
