import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Activity, Users, Sparkles, Brain, Zap, Moon, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CommunityPulse = () => {
    const [trends, setTrends] = useState({
        effects: [],
        velocity: [],
        totalReports: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrends = async () => {
            setLoading(true);
            try {
                // Fetch last 100 public entries for trend analysis
                const { data, error } = await supabase
                    .from('strain_journals')
                    .select('effects, strain_name, rating, created_at')
                    .eq('is_public', true)
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) throw error;

                if (data) {
                    // 1. Calculate Trending Effects
                    const allEffects = data.flatMap(d => d.effects || []);
                    const effectCounts = allEffects.reduce((acc, effect) => {
                        acc[effect] = (acc[effect] || 0) + 1;
                        return acc;
                    }, {});

                    const sortedEffects = Object.entries(effectCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4)
                        .map(([name, count]) => ({ name, count }));

                    // 2. Calculate Strain Velocity (Activity spikes)
                    const strainCounts = data.reduce((acc, d) => {
                        acc[d.strain_name] = (acc[d.strain_name] || 0) + 1;
                        return acc;
                    }, {});

                    const sortedVelocity = Object.entries(strainCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([name, entries]) => ({ name, entries }));

                    setTrends({
                        effects: sortedEffects,
                        velocity: sortedVelocity,
                        totalReports: data.length
                    });
                }
            } catch (err) {
                console.error("Trend Analysis Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTrends();
    }, []);

    const iconMap = {
        'Relaxed': <Moon className="w-3 h-3" />,
        'Euphoric': <Sparkles className="w-3 h-3" />,
        'Creative': <Brain className="w-3 h-3" />,
        'Energetic': <Zap className="w-3 h-3" />,
        'Happy': <Heart className="w-3 h-3" />,
        'Uplifted': <Activity className="w-3 h-3" />,
        'Focused': <Brain className="w-3 h-3" />
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Syncing Pulse...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col pt-2">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Community Pulse
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Live Trend Analysis</p>
                </div>
                <div className="bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">
                        {trends.totalReports}+ Active Reports
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                {trends.effects.map((effect, idx) => (
                    <motion.div
                        key={effect.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-slate-950/50 border border-white/5 p-3 rounded-2xl group hover:border-emerald-500/30 transition-all cursor-default"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center border border-white/5 group-hover:border-emerald-500/20 group-hover:bg-emerald-500/5 transition-all">
                                {iconMap[effect.name] || <Sparkles className="w-3 h-3 text-slate-500" />}
                            </div>
                            <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">{effect.name}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(effect.count / trends.totalReports) * 300}%` }}
                                className="h-full bg-emerald-500"
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-auto">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-3 block">Ascending Strains</span>
                <div className="space-y-2">
                    {trends.velocity.map((strain, idx) => (
                        <motion.div
                            key={strain.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + (idx * 0.1) }}
                            className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-transparent hover:border-emerald-500/20 hover:bg-white/10 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-[10px] font-black text-slate-700 italic">0{idx + 1}</div>
                                <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{strain.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all opacity-50 group-hover:opacity-100">
                                <Zap className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" />
                                <span className="text-[10px] font-black text-cyan-400">SPIKE</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CommunityPulse;
