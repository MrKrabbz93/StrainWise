import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutGrid,
    Zap,
    BookOpen,
    MapPin,
    Plus,
    Settings,
    ArrowUpRight,
    Trophy,
    Target
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ConsultantInterface from '../components/ConsultantInterface';
import CommunityPulse from '../components/CommunityPulse';
import { useUserStore } from '../lib/stores/user.store';
import { getRank, RANKS } from '../lib/gamification';

const Dashboard = ({ userLocation, onRecommend, recommendations = [] }) => {
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const [stats, setStats] = useState({
        rank: null,
        nextRank: null,
        progress: 0,
        xpRemaining: 0
    });

    useEffect(() => {
        if (user) {
            const currentRank = getRank(user.xp || 0);
            const nextRankIndex = RANKS.findIndex(r => r.name === currentRank.name) + 1;
            const nextRank = RANKS[nextRankIndex] || null;

            if (nextRank) {
                const range = nextRank.minXP - currentRank.minXP;
                const earned = (user.xp || 0) - currentRank.minXP;
                const progress = Math.min((earned / range) * 100, 100);
                setStats({
                    rank: currentRank,
                    nextRank: nextRank,
                    progress: progress,
                    xpRemaining: nextRank.minXP - (user.xp || 0)
                });
            } else {
                setStats({
                    rank: currentRank,
                    nextRank: null,
                    progress: 100,
                    xpRemaining: 0
                });
            }
        }
    }, [user]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-[1600px] mx-auto px-4 pt-10 pb-20">
            {/* Minimal Header (Existing logic) ... */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">
                        WORKSPACE <span className="text-emerald-500">ALPHA</span>
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Systems Operational // Live Intelligence Active</span>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Global Connectivity</div>
                        <div className="flex items-center gap-1.5 justify-end">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className={`w-1 h-3 rounded-full ${i < 3 ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />
                            ))}
                        </div>
                    </div>
                    <button onClick={() => navigate('/settings')} className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:border-white/10 transition-all">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Bento Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
                {/* AI Consultant - Large Span */}
                <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col h-[750px] relative">
                    <ConsultantInterface
                        onRecommend={onRecommend}
                        userLocation={userLocation}
                    />
                </motion.div>

                {/* Right Column Stack */}
                <div className="lg:col-span-4 space-y-6 flex flex-col h-[750px]">
                    {/* Community Pulse Card */}
                    <motion.div variants={itemVariants} className="flex-1 glass-card p-6 md:p-8 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
                            <Zap className="w-32 h-32 text-emerald-500" />
                        </div>
                        <CommunityPulse />
                    </motion.div>

                    {/* Bottom Row - User Progress & Shortcuts */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* User Rank Card */}
                        <motion.div variants={itemVariants} className="glass-card p-6 rounded-[2rem] border-emerald-500/20 bg-emerald-500/[0.02]">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <Trophy className="w-5 h-5 text-emerald-400" />
                                </div>
                                <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-tighter">
                                    {stats.rank?.icon} {stats.rank?.name}
                                </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Pioneer Status</h4>
                            <div className="text-xl font-bold text-white mb-4">
                                {stats.progress.toFixed(0)}% <span className="text-[10px] text-slate-600 font-medium">to {stats.nextRank?.name}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.progress}%` }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                                />
                            </div>
                        </motion.div>

                        {/* Quick Action Hub */}
                        <motion.div variants={itemVariants} className="glass-card p-6 rounded-[2rem] flex flex-col justify-between group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center">
                                    <LayoutGrid className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-700 group-hover:text-emerald-500 transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <Link to="/library" className="block text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors mb-2">Encyclopedia</Link>
                                <Link to="/map" className="block text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Locator</Link>
                            </div>
                            <button
                                onClick={() => navigate('/strains')}
                                className="mt-4 w-full py-2 bg-emerald-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95"
                            >
                                <Plus className="w-3 h-3 inline mr-1" /> New Entry
                            </button>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Recommendations Display */}
            {recommendations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-20"
                >
                    <div className="flex items-center gap-6 mb-12">
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Targeted Results</h2>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/40 to-transparent" />
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {recommendations.map((strain) => (
                            <StrainCard
                                key={strain.id}
                                strain={strain}
                                userLocation={userLocation}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default Dashboard;
