import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../lib/stores/ui.store';
import { X, CheckCircle, Info, AlertCircle, Zap, Trophy, Crown } from 'lucide-react';

const Notifications = () => {
    const { notifications, removeNotification } = useUIStore();

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
            case 'vibe': return <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />;
            case 'badge': return <Trophy className="w-6 h-6 text-indigo-400" />;
            case 'rank_up': return <Crown className="w-8 h-8 text-amber-500" />;
            default: return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    return (
        <div className="fixed top-24 right-6 z-[200] space-y-3 pointer-events-none">
            <AnimatePresence>
                {notifications.map((n) => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8, x: 20 }}
                        className={`pointer-events-auto min-w-[320px] max-w-sm rounded-2xl p-4 shadow-2xl border backdrop-blur-xl flex items-center gap-4 group cursor-pointer ${n.type === 'vibe' || n.type === 'rank_up' || n.type === 'badge'
                                ? 'bg-slate-950/90 border-emerald-500/30'
                                : 'bg-slate-900/90 border-white/10'
                            }`}
                        onClick={() => removeNotification(n.id)}
                    >
                        <div className={`p-2 rounded-xl bg-white/5`}>
                            {getIcon(n.type)}
                        </div>

                        <div className="flex-1">
                            {n.type === 'rank_up' && <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-0.5">Level Up!</div>}
                            {n.type === 'badge' && <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Accomplished!</div>}
                            <p className="text-sm font-bold text-white leading-tight">
                                {n.message}
                            </p>
                        </div>

                        <button
                            className="text-slate-500 hover:text-white transition-colors p-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(n.id);
                            }}
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Special VFX for premium notifications */}
                        {(n.type === 'vibe' || n.type === 'rank_up' || n.type === 'badge') && (
                            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                                <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-emerald-500/10 to-transparent animate-shimmer" />
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default Notifications;
