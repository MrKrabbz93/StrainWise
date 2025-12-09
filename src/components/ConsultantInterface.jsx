import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, ArrowRight, Loader2, Sparkles, Bot } from 'lucide-react';
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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      {/* Glass Reflection */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-100">AI Consultant</h2>
            <p className="text-sm text-slate-400">Powered by StrainWise AI</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex bg-slate-950/50 rounded-lg p-1 border border-white/5 backdrop-blur-sm">
            {PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 relative overflow-hidden ${persona === p.id
                  ? 'text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {persona === p.id && (
                  <motion.div
                    layoutId="activePersona"
                    className="absolute inset-0 bg-emerald-500/20 rounded-md"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <p.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{p.name}</span>
                </span>
              </button>
            ))}
          </div>
          <motion.p
            key={persona}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] text-emerald-400/80 font-medium uppercase tracking-wider mr-1"
          >
            {PERSONAS.find(p => p.id === persona)?.desc}
          </motion.p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar relative z-10">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-xl backdrop-blur-sm ${msg.role === 'user'
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-tr-none shadow-lg shadow-emerald-900/20 border border-emerald-500/20'
                : 'bg-slate-800/60 text-slate-200 rounded-tl-none border border-white/10 shadow-lg'
                }`}>
                <p className="leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-slate-800/50 p-4 rounded-xl rounded-tl-none flex items-center gap-2 border border-white/5">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span className="text-slate-400 text-sm animate-pulse">Analyzing request...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
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
