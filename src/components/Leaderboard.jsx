import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaders = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, xp, rank, avatar_url')
                .order('xp', { ascending: false })
                .limit(10);

            if (data) setLeaders(data);
            setLoading(false);
        };
        fetchLeaders();
    }, []);

    const getIcon = (index) => {
        switch (index) {
            case 0: return <Crown className="w-6 h-6 text-amber-400" />;
            case 1: return <Medal className="w-6 h-6 text-slate-300" />;
            case 2: return <Medal className="w-6 h-6 text-amber-700" />;
            default: return <span className="font-bold text-slate-500">#{index + 1}</span>;
        }
    };

    if (loading) return <div className="text-center p-8 text-slate-500">Loading Leaderboard...</div>;

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-emerald-400" /> Top Consultants
            </h3>
            <div className="space-y-4">
                {leaders.map((leader, index) => (
                    <motion.div
                        key={leader.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${index === 0 ? 'bg-amber-500/10 border-amber-500/30' :
                            'bg-slate-800/50 border-slate-700 hover:border-emerald-500/20'
                            }`}
                    >
                        <div className="w-8 flex justify-center">{getIcon(index)}</div>

                        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-white/10">
                            {leader.avatar_url ? (
                                <img src={leader.avatar_url} alt={leader.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                    {leader.username?.[0] || '?'}
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="font-bold text-white">{leader.username || 'Anonymous'}</div>
                            <div className="text-xs text-slate-400">{leader.rank}</div>
                        </div>

                        <div className="text-right">
                            <div className="font-bold text-emerald-400">{leader.xp.toLocaleString()} XP</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
