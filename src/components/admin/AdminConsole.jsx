import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    ShieldCheck,
    Zap,
    Database,
    AlertCircle,
    RefreshCw,
    Play,
    CheckCircle2,
    Server,
    Cpu,
    Network
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AdminConsole = () => {
    const [mcpStatus, setMcpStatus] = useState('online'); // online, offline, syncing
    const [lastAudit, setLastAudit] = useState(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [jobs, setJobs] = useState([
        { id: 'JOB-001', task: 'Encyclopedia Enrichment', status: 'completed', time: '2m ago', impact: 'High' },
        { id: 'JOB-002', task: 'Inventory Sync', status: 'completed', time: '15m ago', impact: 'Medium' },
        { id: 'JOB-003', task: 'Sentiment Analysis', status: 'idle', time: '--', impact: 'Low' },
    ]);

    const runAudit = async () => {
        setIsAuditing(true);
        // Simulate audit logic
        setTimeout(() => {
            setLastAudit(new Date().toISOString());
            setIsAuditing(false);
            // In a real app, this would call an API that interacts with the MCP server
        }, 3000);
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Connectivity HUD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-3xl border-emerald-500/20 bg-emerald-500/[0.02] flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <Server className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MCP Bridge</div>
                            <div className="text-xl font-bold text-white uppercase tracking-tighter">PROTOCOL-2.0</div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className={`w-2 h-2 rounded-full mb-1 ${mcpStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[9px] font-black text-emerald-500 uppercase">{mcpStatus}</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 rounded-3xl border-cyan-500/20 bg-cyan-500/[0.02] flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                            <Cpu className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Engine</div>
                            <div className="text-xl font-bold text-white uppercase tracking-tighter">CLAUDE 4.6</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-cyan-400">{infraStatus.latency} <span className="text-slate-600">LATENCY</span></div>
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Engine: {infraStatus.ai_engine}</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 rounded-3xl border-white/5 flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500">
                            <Network className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Endpoints</div>
                            <div className="text-xl font-bold text-white uppercase tracking-tighter">6 ACTIVE</div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Job Queue & Controller */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="glass-card rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3 italic">
                                    <Activity className="w-6 h-6 text-emerald-400" /> SYSTEM OVERWATCH
                                </h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Infrastructure Management Interface</p>
                            </div>
                            <button
                                onClick={runAudit}
                                disabled={isAuditing}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isAuditing ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-950 hover:bg-emerald-400'
                                    }`}
                            >
                                {isAuditing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                {isAuditing ? 'Auditing Network...' : 'Trigger Global Audit'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {jobs.map((job, idx) => (
                                <motion.div
                                    key={job.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + (idx * 0.1) }}
                                    className="p-5 rounded-2xl bg-slate-950/50 border border-white/5 flex items-center justify-between group hover:border-emerald-500/20 transition-all"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="text-[10px] font-black text-slate-700 italic">{job.id}</div>
                                        <div>
                                            <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{job.task}</div>
                                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Impact Score: <span className="text-slate-400">{job.impact}</span></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{job.time}</div>
                                            <div className="text-[8px] font-bold text-slate-600 uppercase">Latency: 0.4s</div>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-900 text-slate-700'
                                            }`}>
                                            {job.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Audit Insights */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="glass-card p-8 rounded-[2rem] border-white/5">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                            <Database className="w-4 h-4 text-purple-400" /> Database Health
                        </h3>
                        <div className="space-y-6">
                            {[
                                { label: 'Enriched Strains', value: 84, total: 100, color: 'from-purple-500 to-indigo-500' },
                                { label: 'Inventory Sync', value: 92, total: 100, color: 'from-emerald-500 to-cyan-500' },
                                { label: 'DB Connectivity', value: infraStatus.database === 'connected' ? 100 : 0, total: 100, color: 'from-blue-500 to-indigo-500' }
                            ].map((stat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                                        <span className="text-[10px] font-black text-white">{stat.value}%</span>
                                    </div>
                                    <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stat.value}%` }}
                                            className={`h-full bg-gradient-to-r ${stat.color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card p-8 rounded-[2rem] border-red-500/20 bg-red-500/[0.02]">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400" /> Incident Log
                        </h3>
                        <div className="space-y-3">
                            <div className="text-[11px] font-bold text-slate-400">
                                <span className="text-red-400 uppercase mr-2">[FAIL]</span> API Timeout on `enrich_strain` (3m ago)
                            </div>
                            <div className="text-[11px] font-bold text-slate-400">
                                <span className="text-yellow-400 uppercase mr-2">[WARN]</span> Inventory Sync delayed (12m ago)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminConsole;
