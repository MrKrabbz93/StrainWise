import React, { useEffect, useRef, useState } from 'react';
import { useConsultantStore } from '../../lib/stores/consultant.store';
import { useUserStore } from '../../lib/stores/user.store';
import { motion, AnimatePresence } from 'framer-motion';

const ConsultantChat = () => {
    const {
        messages,
        isTyping,
        sendMessage,
        startSession,
        activePersona,
        currentSessionId
    } = useConsultantStore();

    // Fallback user if not logged in (simulated anonymous)
    const userId = useUserStore(state => state.user?.id) || 'anon-user';

    const [input, setInput] = useState('');
    const bottomRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Start session on mount if none exists
    useEffect(() => {
        if (!currentSessionId) {
            startSession(userId, activePersona);
        }
    }, [currentSessionId, userId, activePersona, startSession]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        sendMessage(input, userId);
        setInput('');
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${currentSessionId ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                    <span className="font-semibold text-white">AI Consultant ({activePersona})</span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`
                                    max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed
                                    ${msg.role === 'user'
                                        ? 'bg-green-600 text-white rounded-br-none'
                                        : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5'
                                    }
                                `}
                            >
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-white/10 rounded-2xl px-4 py-3 rounded-bl-none flex items-center gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </motion.div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/10">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about a strain..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 top-2 p-2 rounded-lg bg-green-500 hover:bg-green-400 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ➤
                    </button>
                </div>
            </form>
        </div>
    );
};

export default React.memo(ConsultantChat);
