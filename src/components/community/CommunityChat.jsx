import React, { useState, useEffect, useRef } from 'react';
import { communityService } from '../../lib/services/community.service';
import { Send, User, Users } from 'lucide-react';

const CommunityChat = ({ userId = 'anon', roomId = 'general', userName = 'Anonymous' }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Join Room
        communityService.joinCommunityRoom(roomId, userId)
            .then((history) => {
                setMessages(history);
                setIsConnected(true);
            });

        // Subscribe to real-time updates
        const unsubscribe = communityService.subscribe(roomId, (newMsg) => {
            setMessages(prev => [...prev, newMsg]);
        });

        return () => {
            communityService.leaveCommunityRoom(roomId, userId);
            unsubscribe();
        };
    }, [roomId, userId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        try {
            await communityService.sendMessage(roomId, userId, input);
            setInput('');
        } catch (error) {
            console.error("Failed to send:", error);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <div>
                        <h3 className="text-white font-bold">Community Chat</h3>
                        <p className="text-xs text-slate-500">#{roomId} • {isConnected ? 'Live' : 'Connecting...'}</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center text-slate-600 mt-10">
                        <p>No messages yet. Be the first to say hi!</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.userId === userId;
                    return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>
                                <User className="w-4 h-4" />
                            </div>
                            <div className={`max-w-[80%] rounded-2xl p-3 ${isMe ? 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20 rounded-tr-none' : 'bg-slate-800 text-slate-300 border border-slate-700 rounded-tl-none'}`}>
                                <div className="text-xs opacity-50 mb-1 flex justify-between gap-4">
                                    <span>{msg.userId}</span>
                                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-sm">{msg.content}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={`Message #${roomId}...`}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 rounded-xl p-3 transition-all"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default CommunityChat;
