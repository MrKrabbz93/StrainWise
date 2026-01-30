import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Zap, Target, Box, Activity, RefreshCw, Layers } from 'lucide-react';
import { fetchLeadMetrics, fetchInventoryHealth, fetchRecentEngagements } from '../../lib/services/admin.service';

const LogisticsDashboard = () => {
    const [leads, setLeads] = useState(null);
    const [health, setHealth] = useState(null);
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [l, h, f] = await Promise.all([
                fetchLeadMetrics(),
                fetchInventoryHealth(),
                fetchRecentEngagements()
            ]);
            setLeads(l);
            setHealth(h);
            setFeed(f);
        } catch (e) {
            console.error("Logistics Load Error:", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-slate-500 animate-pulse">Syncing Logistics Mycelium...</div>;

    const funnelData = leads ? [
        { name: 'Cold', value: leads.cold, fill: '#64748b' },
        { name: 'Sent', value: leads.sent, fill: '#3b82f6' },
        { name: 'Engaged', value: leads.engaged, fill: '#10b981' },
        { name: 'Partner', value: leads.partner, fill: '#f59e0b' }
    ] : [];

    return (
        <div className="space-y-8">
            <div className="grid lg:grid-cols-12 gap-8">
                {/* 1. Lead Pipeline (The Funnel) */}
                <div className="lg:col-span-7 bg-slate-900/50 border border-white/5 rounded-3xl p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <Target className="w-4 h-4 text-emerald-400" /> LEAD PIPELINE FUNNEL
                        </h3>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Total Assets: {leads?.total}
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={80} />
                                <Tooltip
                                    cursor={{ fill: '#ffffff05' }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Inventory Health (The Stock) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
                        <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                            <Box className="w-4 h-4 text-emerald-400" /> ASSET HARVEST HEALTH
                        </h3>
                        <div className="space-y-6">
                            {[
                                { label: 'Geocoded Pins', value: health?.geocodedDispensaries, total: leads?.total, icon: RefreshCw, color: 'text-blue-400' },
                                { label: 'Menu Syncs', value: health?.activeMenus, total: health?.geocodedDispensaries, icon: Layers, color: 'text-emerald-400' }
                            ].map((stat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <stat.icon className={`w-3 h-3 ${stat.color}`} />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                        </div>
                                        <span className="text-xs font-black text-white">{stat.value} / {stat.total}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stat.total ? (stat.value / stat.total) * 100 : 0}%` }}
                                            className={`h-full bg-gradient-to-r ${i === 0 ? 'from-blue-500 to-indigo-500' : 'from-emerald-500 to-cyan-500'}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/10 rounded-3xl p-6 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Encyclopedia Items</div>
                            <div className="text-4xl font-black text-white">{health?.totalStrains}</div>
                        </div>
                        <Activity className="w-12 h-12 text-emerald-500/20" />
                    </div>
                </div>
            </div>

            {/* 3. Agent Heartbeat (The HUD) */}
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-400" /> AGENT HEARTBEAT (LIVE FEED)
                    </h3>
                    <button onClick={loadData} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="pb-4 px-4 font-black">Target</th>
                                <th className="pb-4 px-4 font-black">Status</th>
                                <th className="pb-4 px-4 font-black">Latest Engagement</th>
                                <th className="pb-4 px-4 font-black text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {feed.map((entry) => (
                                <tr key={entry.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                                            @{entry.target_handle}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${entry.status === 'partner' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                entry.status === 'engaged' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            }`}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-xs text-slate-400 max-w-xs truncate italic">
                                            "{entry.content}"
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="text-[10px] text-slate-600">
                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LogisticsDashboard;
