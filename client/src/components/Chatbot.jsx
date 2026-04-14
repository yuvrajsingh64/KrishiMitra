import { useState, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for 'open-chatbot' event from Dashboard button
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handler);
    return () => window.removeEventListener('open-chatbot', handler);
  }, []);
  const [messages, setMessages] = useState([{
    role: 'ai',
    text: 'Hello! I am Krishi Mitra AI. How can I help you with your farming needs today?'
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    if (!user) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', text: 'You need to be logged in to chat with me!' }]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    try {
      const { data } = await axios.post('http://localhost:5000/api/ai/chat', {
        prompt: userMessage
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Sorry, I am having trouble connecting to the AI service right now.';
      setMessages(prev => [...prev, { role: 'ai', text: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg transition-transform hover:scale-105 z-50 flex items-center justify-center"
      >
        <MessageSquare size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[350px] h-[500px] glass bg-slate-900 shadow-2xl rounded-2xl border border-slate-700/50 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-emerald-500 text-white">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} />
                <h3 className="font-semibold">Krishi Mitra AI</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:text-emerald-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-emerald-500 text-white rounded-br-none' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-700 flex gap-2 items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about crops, weather..."
                className="flex-1 bg-slate-700/50 text-slate-100 rounded-xl px-4 py-2 border border-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
              <button 
                onClick={handleSend}
                disabled={isTyping}
                className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
