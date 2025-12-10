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
            /* ... message items ... */
            <motion.div
              key={idx}
            /* ... */
            >
              {/* ... */}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          {/* ... loading indicator ... */ }
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
