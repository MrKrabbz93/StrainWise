import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, Book, Heart, Zap, Shield, AlertTriangle, CheckCircle, Search, Sparkles, LayoutDashboard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import MarketingStudio from './MarketingStudio';
import LogisticsDashboard from './LogisticsDashboard';
import AdminConsole from './AdminConsole';
import { useUserStore } from '../../lib/stores/user.store';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('analytics');
    const { user } = useUserStore();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalJournals: 0,
        totalLikes: 0,
        pendingReports: 0,
        activeStrains: 0,
        totalReferrals: 0
    });
    const [reportLogs, setReportLogs] = useState([]);
    const [dailyActivity, setDailyActivity] = useState([]);
    const [topStrains, setTopStrains] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.account_type !== 'admin') {
            window.location.href = '/';
            return;
        }
        fetchStats();
    }, [user]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: journalCount } = await supabase.from('strain_journals').select('*', { count: 'exact', head: true });
            const { count: reportedCount } = await supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            const { count: likeCount } = await supabase.from('journal_likes').select('*', { count: 'exact', head: true });
            const { count: strainCount } = await supabase.from('strains').select('*', { count: 'exact', head: true });
            const { count: refCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).not('referred_by', 'is', null);

            setStats({
                totalUsers: userCount || 0,
                totalJournals: journalCount || 0,
                totalLikes: likeCount || 0,
                pendingReports: reportedCount || 0,
                activeStrains: strainCount || 0,
                totalReferrals: refCount || 0
            });

            // Fetch Top Strains by Mentions
            const { data: popular } = await supabase.from('strain_journals').select('strain_name').limit(100);

            if (popular) {
                const counts = popular.reduce((acc, curr) => {
                    acc[curr.strain_name] = (acc[curr.strain_name] || 0) + 1;
                    return acc;
                }, {});
                const sorted = Object.entries(counts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);
                setTopStrains(sorted);
            }

            // Fetch Reports
            const { data: reports } = await supabase
                .from('content_reports')
                .select('*, strain_journals(strain_name, review)')
                .order('created_at', { ascending: false })
                .limit(5);
            setReportLogs(reports || []);

            // Daily Activity Chart Info (Mock for now)
            setDailyActivity([
                { name: 'Mon', entries: 12, likes: 45 },
                { name: 'Tue', entries: 19, likes: 52 },
                { name: 'Wed', entries: 15, likes: 61 },
                { name: 'Thu', entries: 22, likes: 58 },
                { name: 'Fri', entries: 30, likes: 89 },
                { name: 'Sat', entries: 42, likes: 120 },
                { name: 'Sun', entries: 35, likes: 110 },
            ]);

        } catch (err) {
            console.error("Stats Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const resolveReport = async (reportId, status, journalId = null) => {
        try {
            await supabase.from('content_reports').update({ status }).eq('id', reportId);
            if (status === 'removed' && journalId) {
                await supabase.from('strain_journals').update({ status: 'flagged' }).eq('id', journalId);
            }
            fetchStats();
        } catch (err) {
            alert("Action failed.");
        }
    };

    if (loading) return <div className="p-20 text-center text-slate-500 animate-pulse">Loading Mycelium Dashboard...</div>;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 flex items-center justify-center">
                            <img src="/logo-icon-transparent.png" alt="StrainWise" className="w-full h-full object-contain scale-110" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight">MYCELIUM <span className="text-emerald-500">HQ</span></h2>
                            <p className="text-slate-500 text-sm">Centralized Network Management.</p>
                        </div>
                    </div>
                </div>

                <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4" /> Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('marketing')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'marketing' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        <Sparkles className="w-4 h-4" /> Marketing
                    </button>
                    <button
                        onClick={() => setActiveTab('logistics')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'logistics' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        <Zap className="w-4 h-4" /> Logistics
                    </button>
                    <button
                        onClick={() => setActiveTab('core')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'core' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        <Shield className="w-4 h-4" /> Core
                    </button>
                </div>
            </div>

            {activeTab === 'analytics' ? (
                <div className="space-y-8">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                        {[
                            { label: 'Pioneers', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
                            { label: 'Growth', value: stats.totalJournals, icon: Book, color: 'text-emerald-400' },
                            { label: 'Vibez', value: stats.totalLikes, icon: Heart, color: 'text-pink-400' },
                            { label: 'Encyclopedia', value: stats.activeStrains, icon: Search, color: 'text-purple-400' },
                            { label: 'Referrals', value: stats.totalReferrals, icon: Zap, color: 'text-indigo-400' }
                        ].map((s, i) => (
                            <div key={i} className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
                                <div className={`p-3 bg-slate-800 w-fit rounded-2xl mb-4 ${s.color}`}>
                                    <s.icon className="w-5 h-5" />
                                </div>
                                <div className="text-2xl font-black text-white">{s.value.toLocaleString()}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* Engagement Chart */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
                                <h3 className="text-lg font-black text-white mb-8 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-emerald-400" /> VIBE VELOCITY (7D)
                                </h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dailyActivity}>
                                            <defs>
                                                <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                            />
                                            <Area type="monotone" dataKey="entries" stroke="#10b981" fillOpacity={1} fill="url(#colorEntries)" strokeWidth={3} />
                                            <Area type="monotone" dataKey="likes" stroke="#ec4899" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Top Strains Chart */}
                                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
                                    <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest">Top Trending Strains</h3>
                                    <div className="h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={topStrains} layout="vertical">
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
                                                <Tooltip cursor={{ fill: '#ffffff05' }} />
                                                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Network Health */}
                                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 flex flex-col justify-center text-center">
                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                                        <Zap className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <h4 className="text-white font-black text-2xl tracking-tighter italic">GROWTH MODE</h4>
                                    <p className="text-slate-500 text-xs mb-4">Referral conversion rate is currently</p>
                                    <div className="text-4xl font-black text-indigo-400">18.4%</div>
                                    <div className="mt-4 flex justify-center gap-1">
                                        {[...Array(5)].map((_, i) => <div key={i} className={`h-1 w-8 rounded-full ${i < 4 ? 'bg-emerald-500' : 'bg-slate-800'}`} />)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Moderation Queue */}
                        <div className="lg:col-span-4 bg-slate-900/50 border border-white/5 rounded-3xl p-8 h-fit">
                            <h3 className="text-lg font-black text-white mb-8 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-red-400" /> MODERATION QUEUE
                            </h3>

                            {reportLogs.length > 0 ? (
                                <div className="space-y-4">
                                    {reportLogs.map(r => (
                                        <div key={r.id} className="p-4 bg-slate-800/50 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-2 text-xs font-bold text-red-400 mb-2">
                                                <AlertTriangle className="w-3 h-3" /> Flagged: {r.strain_journals?.strain_name}
                                            </div>
                                            <p className="text-slate-400 text-xs mb-4 line-clamp-2">"{r.strain_journals?.review}"</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => resolveReport(r.id, 'dismissed')}
                                                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold rounded-lg transition-colors"
                                                >
                                                    DISMISS
                                                </button>
                                                <button
                                                    onClick={() => resolveReport(r.id, 'removed', r.journal_id)}
                                                    className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors border border-red-400/20"
                                                >
                                                    REMOVE
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                    <CheckCircle className="w-12 h-12 text-emerald-500 mb-2" />
                                    <p className="text-xs font-bold text-white uppercase tracking-widest">Network Clear</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : activeTab === 'marketing' ? (
                <MarketingStudio />
            ) : activeTab === 'logistics' ? (
                <LogisticsDashboard />
            ) : (
                <AdminConsole />
            )}
        </div>
    );
};

export default AdminDashboard;
