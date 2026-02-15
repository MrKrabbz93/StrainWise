import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, ArrowRight, Loader2, Sparkles, Bot, User, Camera, Brain, FlaskConical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateResponse, isAIEnabled, identifyStrain } from '../lib/gemini';
import { getNearbyInventoryContext } from '../lib/services/dispensary.service';
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
      // Phase IV: Fetch Live Inventory Context if location is available
      let inventoryContext = null;
      if (userLocation) {
        inventoryContext = await getNearbyInventoryContext(userLocation.lat, userLocation.lng);
      }

      // Pass the CURRENT persona state and inventory context
      const responseText = await generateResponse(messages, input, persona, userLocation, inventoryContext);
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
      const errorMsg = error.message || "Unknown connection issue";
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ **Consultant Connection Error**\n\nI apologize, but I'm having trouble connecting to my knowledge base right now.\n\n*Technical Details: ${errorMsg}*\n\nPlease try again in a few moments or alert the administrator.`
      }]);
    } finally {
      setIsLoading(false);
    }


    /* Recommendation Logic (Existing + Personalized) */
    let recommendations = [];
    const lowerInput = input.toLowerCase();

    // ... (existing categorization logic)
    // Dynamic DB Search for Recommendations

    // 1. Identify intent/keywords
    const keywords = [];
    if (lowerInput.match(/sleep|insomnia|night|rest/)) keywords.push('Sleep', 'Relaxed', 'Sleepy');
    if (lowerInput.match(/pain|relief|ache|hurt|sore/)) keywords.push('Pain', 'Relief');
    if (lowerInput.match(/energy|day|wake|focus|work/)) keywords.push('Energy', 'Uplifted', 'Focus');
    if (lowerInput.match(/happy|mood|depress|sad/)) keywords.push('Happy', 'Euphoric');
    if (lowerInput.match(/creative|art/)) keywords.push('Creative');

    // 2. Fetch from DB if we have keywords
    if (keywords.length > 0) {
      try {
        // We want strains that have ANY of these effects
        // Since Supabase .contains() is AND for array, strictly. 
        // .overlaps() is standard for "any common elements" in Postgres (&& operator).
        // Supabase JS supports .overlaps() for array columns.
        const { data: dbStrains } = await supabase
          .from('strains')
          .select('name')
          .overlaps('effects', keywords)
          .limit(5);

        if (dbStrains && dbStrains.length > 0) {
          recommendations = dbStrains.map(s => s.name);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic recommendations:", err);
        // Fallback only on error
        recommendations = ['Blue Dream', 'OG Kush'];
      }
    } else {
      // Fallback or Random if no keywords detected?
      // Maybe check for "Indica" / "Sativa"
      let type = null;
      if (lowerInput.includes('indica')) type = 'Indica';
      if (lowerInput.includes('sativa')) type = 'Sativa';

      if (type) {
        const { data: dbStrains } = await supabase
          .from('strains')
          .select('name')
          .ilike('type', `%${type}%`)
          .limit(5);
        if (dbStrains) recommendations = dbStrains.map(s => s.name);
      }
    }

    // If still empty, maybe don't recommend anything, or random?
    // User hates generic specific ones. Let's leave empty if no context found.
    // Or fetch *popular* strains via a different query if needed.
    if (recommendations.length === 0 && input.length > 10) {
      // Try a broad text search on name/description
      const { data: searchResults } = await supabase
        .from('strains')
        .select('name')
        .textSearch('description_search', `'${input.split(' ').slice(0, 2).join(' ')}'`) // Simple heuristic
        .limit(3);

      if (searchResults) recommendations = searchResults.map(s => s.name);
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
    <div className="glass-card rounded-[2.5rem] p-4 md:p-8 shadow-2xl flex flex-col h-[750px] relative overflow-hidden">
      {/* Premium Header Container */}
      <div className="mb-6 relative z-20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 flex items-center justify-center">
              <img src="/logo-icon-card.png" alt="StrainWise" className="w-full h-full object-contain scale-110" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white leading-none tracking-tight">AI Consultant</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{PERSONAS.find(p => p.id === persona)?.desc}</span>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-950/50 backdrop-blur-md rounded-full p-1.5 border border-white/5 shadow-inner">
            {PERSONAS.map(p => {
              const Icon = p.icon;
              const isActive = persona === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${isActive ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20 shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                  title={p.desc}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity Context Selector - Premium Scroll */}
        <div className="relative group">
          <div className="flex items-center gap-3 overflow-x-auto pb-4 custom-scrollbar no-scrollbar mask-linear-fade">
            {ACTIVITIES.map(activity => (
              <button
                key={activity}
                onClick={() => setSelectedActivity(prev => prev === activity ? null : activity)}
                className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shrink-0 transition-all duration-300 ${selectedActivity === activity
                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_5px_15px_rgba(16,185,129,0.3)] scale-105'
                  : 'bg-slate-900/40 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300 hover:bg-slate-900/60'
                  }`}
              >
                {activity}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Area - Immersive Background Overlay */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')]" />

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-6 mb-8 pr-4 custom-scrollbar relative z-10 no-scrollbar"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.role === 'system_action' ? (
                <div className="w-full flex justify-center my-6">
                  <button
                    onClick={() => handleResearchAction(msg.content)}
                    className="premium-button flex items-center gap-3 group shadow-emerald-500/20"
                  >
                    <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    Research & Add "{msg.content}"
                  </button>
                </div>
              ) : (
                <>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-slate-950' : 'bg-slate-800 text-emerald-400 border border-white/5'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`relative max-w-[80%] p-5 rounded-3xl text-sm leading-relaxed shadow-xl border ${msg.role === 'user'
                    ? 'bg-emerald-500/5 text-emerald-50 border-emerald-500/20 rounded-tr-none'
                    : 'bg-slate-900/60 backdrop-blur-md text-slate-200 border-white/5 rounded-tl-none'
                    }`}>
                    {typeof msg.content === 'string' ? (
                      <div className="prose prose-invert prose-emerald prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <pre className="text-[10px] text-emerald-400 font-mono p-2 bg-black/20 rounded-lg">{JSON.stringify(msg.content, null, 2)}</pre>
                    )}

                    <div className={`absolute bottom-2 right-4 text-[8px] font-black uppercase tracking-widest opacity-20 ${msg.role === 'user' ? 'text-emerald-300' : 'text-slate-500'}`}>
                      {msg.role === 'user' ? 'Verified' : 'Consultant'}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 text-emerald-400 border border-white/5 shadow-lg">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-3xl rounded-tl-none px-6 py-4 flex items-center gap-4">
              <div className="flex gap-1">
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                {persona === 'scientist' ? "Analyzing..." :
                  persona === 'connoisseur' ? "Reviewing..." :
                    "Processing..."}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Polish Input Area */}
      <div className="relative z-20 mt-auto flex gap-3">
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
          className="w-16 h-16 bg-slate-800/50 backdrop-blur-md border border-white/10 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 rounded-2xl transition-all flex items-center justify-center shadow-lg active:scale-95 group"
          title="Identify Strain from Photo"
        >
          <Camera className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>

        <div className="relative flex-1 group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAIEnabled() ? `Message ${PERSONAS.find(p => p.id === persona)?.name}...` : "Demo Mode Active..."}
            className="w-full h-16 bg-slate-950/80 border border-white/10 rounded-2xl py-4 px-8 pr-16 text-white font-medium focus:outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-700 shadow-xl group-hover:border-white/20"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-3 w-10 h-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:grayscale text-slate-950 rounded-[14px] transition-all flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-90"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

  );
};

export default ConsultantInterface;
