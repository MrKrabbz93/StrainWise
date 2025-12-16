import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, ArrowRight, Loader2, Sparkles, Bot, User, Camera, Brain, FlaskConical } from 'lucide-react';
import { generateResponse, isAIEnabled, identifyStrain } from '../lib/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { getPersonalizedScores } from '../lib/services/recommendation.service';
import { useUserStore } from '../lib/stores/user.store';
import { useSearchParams } from 'react-router-dom';

const PERSONAS = [
  { id: 'helpful', name: 'Helpful Guide', icon: MessageSquare, desc: 'Friendly & Balanced' },
  { id: 'connoisseur', name: 'The Connoisseur', icon: Sparkles, desc: 'Sophisticated & Detailed' },
  { id: 'scientist', name: 'The Scientist', icon: FlaskConical, desc: 'Technical & Precise' },
];

const ConsultantInterface = ({ onRecommend, userLocation, externalInput, onInputHandled, onResponse }) => {
  const [searchParams] = useSearchParams();
  const contextStrain = searchParams.get('strain');

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: contextStrain
        ? `I see you're interested in **${contextStrain}**. How can I help you with this strain? I can explain its effects, medical benefits, or finding similar strains.`
        : "Hello! I'm your personal cannabis consultant. How can I help you today? Are you looking for relief from a specific condition, or just looking to relax?"
    }
  ]);
  const [input, setInput] = useState(contextStrain ? `Tell me about ${contextStrain}` : '');
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState('helpful');
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const user = useUserStore((state) => state.user);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const ACTIVITIES = ['Gaming', 'Socializing', 'Hiking', 'Movie/TV', 'Music', 'Reading', 'Writing', 'Exercising', 'Cooking', 'Meditation'];

  // Handle external input (e.g. from Voice)
  useEffect(() => {
    if (externalInput) {
      setInput(externalInput);
      if (onInputHandled) onInputHandled();
    }
  }, [externalInput, onInputHandled]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: `[Uploaded Image: ${file.name}]` }]);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setMessages(prev => [...prev, { role: 'assistant', content: "👀 Analyzing image..." }]);

      try {
        const analysis = await identifyStrain(base64);
        setMessages(prev => {
          const newHistory = [...prev];
          newHistory.pop(); // Remove "Analyzing..."
          return [...newHistory, { role: 'assistant', content: analysis }];
        });
        if (onResponse) onResponse(analysis);
      } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, { role: 'assistant', content: "Failed to analyze image." }]);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]); // Scroll on new messages or loading state change

  // Action Handler for Research
  const handleResearchAction = async (strainName) => {
    const loadingMsg = { role: 'assistant', content: `🔍 Searching the deep web for "${strainName}"...` };
    setMessages(prev => [...prev, loadingMsg]);
    setIsLoading(true);

    try {
      // 1. Research
      const { researchStrain, generateImage } = await import('../lib/gemini');
      const { supabase } = await import('../lib/supabase');

      const aiData = await researchStrain(strainName);
      if (!aiData) throw new Error("Research yielded no results.");

      // 2. Image Gen
      const imagePrompt = `High quality, photorealistic close-up of cannabis strain ${aiData.name}. Visual traits: ${aiData.visual_profile || 'green'}.`;
      const imageUrl = await generateImage(imagePrompt);

      // 3. Save to DB
      const { data: { user } } = await supabase.auth.getUser();
      const { error: dbError } = await supabase.from('strains').insert([{
        ...aiData,
        image_url: imageUrl,
        contributed_by: user ? user.id : null
      }]);

      if (dbError) throw dbError;

      const successMsg = `✅ Success! I found accurate data for **${aiData.name}** and added it to the Encyclopedia.\n\n*Type: ${aiData.type} | THC: ${aiData.thc}*\n\nWould you like to see the full profile?`;
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: successMsg }
      ]);
      if (onResponse) onResponse(successMsg);

      if (onRecommend) onRecommend([aiData.name]); // Trigger card view

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "❌ Research failed. The strain might be too obscure or the database connection failed." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass the CURRENT persona state
      const responseText = await generateResponse(messages, input, persona, userLocation);
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      if (onResponse) onResponse(responseText);

      // Check for Research Trigger Phrase
      const researchMatch = responseText.match(/I don't have (.*?) in my live database yet/);
      if (researchMatch && researchMatch[1]) {
        const foundName = researchMatch[1].replace(/\[|\]/g, '').trim(); // Clean brackets if any
        // Add a special "system" message with an action button
        setMessages(prev => [...prev, {
          role: 'system_action',
          content: foundName
        }]);
      }

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I apologize, but I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }


    /* Recommendation Logic (Existing + Personalized) */
    let recommendations = [];
    const lowerInput = input.toLowerCase();

    // ... (existing categorization logic)
    if (lowerInput.includes('sleep') || lowerInput.includes('insomnia')) {
      recommendations = ['Granddaddy Purple', 'OG Kush'];
    } else if (lowerInput.includes('focus') || lowerInput.includes('creative')) {
      recommendations = ['Blue Dream', 'Jack Herer'];
    } else if (lowerInput.includes('pain')) {
      recommendations = ['Blue Dream', 'Granddaddy Purple'];
    } else {
      recommendations = ['Blue Dream', 'OG Kush'];
    }

    if (user && recommendations.length > 0) {
      try {
        // Re-rank based on user feedback and activity context
        const scores = await getPersonalizedScores(user.id, recommendations, selectedActivity);
        recommendations.sort((_a, _b) => {
          // Higher score comes first
          const scoreA = scores.get(_a) || 0;
          const scoreB = scores.get(_b) || 0;
          return scoreB - scoreA;
        });
      } catch (e) {
        console.warn("Personalization failed, using default order.", e);
      }
    }

    if (onRecommend) onRecommend(recommendations);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl shadow-emerald-900/10 flex flex-col h-[700px] relative overflow-hidden">
      {/* Persona Selector Header */}
      <div className="mb-4 pb-4 border-b border-white/5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-white font-bold leading-none">AI Consultant</h3>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">{PERSONAS.find(p => p.id === persona)?.desc}</span>
            </div>
          </div>

          <div className="flex bg-slate-950 rounded-full p-1 border border-white/5">
            {PERSONAS.map(p => {
              const Icon = p.icon;
              const isActive = persona === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  title={p.desc}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden md:inline">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity Context Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar mask-linear-fade">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider shrink-0 mr-2">Context:</span>
          {ACTIVITIES.map(activity => (
            <button
              key={activity}
              onClick={() => setSelectedActivity(prev => prev === activity ? null : activity)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border shrink-0 transition-all ${selectedActivity === activity
                ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20'
                : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
                }`}
            >
              {activity}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Container */}
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
              {msg.role === 'system_action' ? (
                <div className="w-full flex justify-center my-2">
                  <button
                    onClick={() => handleResearchAction(msg.content)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2 px-6 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                  >
                    <Sparkles className="w-4 h-4" />
                    Research & Add "{msg.content}"
                  </button>
                </div>
              ) : (
                <>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-emerald-400'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20 rounded-tr-none' : 'bg-slate-800 text-slate-300 border border-slate-700 rounded-tl-none'}`}>
                    {typeof msg.content === 'string' ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      JSON.stringify(msg.content)
                    )}
                  </div>
                </>
              )}
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
              <span className="text-xs text-slate-400">
                {persona === 'scientist' ? "Analyzing chemical compounds..." :
                  persona === 'connoisseur' ? "Consulting the sommelier..." :
                    "Thinking..."}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      <div className="relative mt-auto z-10 flex gap-2">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="p-4 bg-slate-800 border border-white/10 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 rounded-xl transition-all"
          title="Identify Strain from Photo"
        >
          <Camera className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isAIEnabled() ? `Ask ${PERSONAS.find(p => p.id === persona)?.name}...` : "Describe your needs (Demo Mode)..."}
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
