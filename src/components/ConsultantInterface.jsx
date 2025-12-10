import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, ArrowRight, Loader2, Sparkles, Bot, User } from 'lucide-react';
import { generateResponse, isAIEnabled } from '../lib/gemini';
import { motion, AnimatePresence } from 'framer-motion';

const PERSONAS = [
  { id: 'helpful', name: 'Helpful Guide', icon: MessageSquare, desc: 'Friendly & Balanced' },
  { id: 'connoisseur', name: 'The Connoisseur', icon: Sparkles, desc: 'Sophisticated & Detailed' },
  { id: 'scientist', name: 'The Scientist', icon: Bot, desc: 'Technical & Precise' },
];

const ConsultantInterface = ({ onRecommend, userLocation }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your personal cannabis consultant. How can I help you today? Are you looking for relief from a specific condition, or just looking to relax?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState('helpful');
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]); // Scroll on new messages or loading state change

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await generateResponse(messages, input, persona, userLocation);

      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);

      let recommendations = [];
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('sleep') || lowerInput.includes('insomnia')) {
        recommendations = ['Granddaddy Purple', 'OG Kush'];
      } else if (lowerInput.includes('focus') || lowerInput.includes('creative')) {
        recommendations = ['Blue Dream', 'Jack Herer'];
      } else if (lowerInput.includes('pain')) {
        recommendations = ['Blue Dream', 'Granddaddy Purple'];
      } else {
        recommendations = ['Blue Dream', 'OG Kush'];
      }

      if (onRecommend && recommendations.length > 0) {
        onRecommend(recommendations);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I apologize, but I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl shadow-emerald-900/10 flex flex-col h-[700px] relative overflow-hidden">
      {/* ... (header) ... */}

      {/* Messages Container - Added Ref */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar relative z-10 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-emerald-400'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20 rounded-tr-none' : 'bg-slate-800 text-slate-300 border border-slate-700 rounded-tl-none'}`}>
                {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <span className="text-xs text-slate-400">Consulting strain database...</span>
            </div>
          </motion.div>
        )}
      </div>

      <div className="relative mt-auto z-10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isAIEnabled() ? "Ask anything..." : "Describe your needs (Demo Mode)..."}
          id="consultant-chat-input"
          name="chatQuery"
          className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-4 px-6 pr-12 text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600 backdrop-blur-sm"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="absolute right-2 top-2 p-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 rounded-lg transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ConsultantInterface;
