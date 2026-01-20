import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Twitter, Instagram, Mail, FileText, Send, Copy, Check, Loader2, Music, Video, Zap } from 'lucide-react';
import { generateMarketingContent } from '../../lib/services/marketing.service';

const MarketingStudio = () => {
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [result, setResult] = useState('');
    const [params, setParams] = useState({
        channel: 'twitter',
        focus: 'launch',
        featureName: '',
        targetAudience: 'Modern Enthusiasts'
    });

    const channels = [
        { id: 'twitter', icon: Twitter, label: 'X (Twitter)', color: 'text-sky-400' },
        { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'text-pink-400' },
        { id: 'tiktok', icon: Video, label: 'TikTok', color: 'text-white' },
        { id: 'email', icon: Mail, label: 'Email Blast', color: 'text-emerald-400' },
        { id: 'press_release', icon: FileText, label: 'Press Release', color: 'text-slate-400' },
    ];

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const content = await generateMarketingContent(params);
            setResult(content);
        } catch (e) {
            setResult("Generation failed. Check your API key.");
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8">
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl">
                        <Sparkles className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">AI Marketing <span className="text-emerald-500">Studio</span></h3>
                        <p className="text-slate-500 text-xs">Generate premium launch orbit content in seconds.</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Controls */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Channel</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {channels.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setParams({ ...params, channel: c.id })}
                                        className={`flex items-center gap-2 p-3 rounded-2xl border transition-all text-left ${params.channel === c.id
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                                            : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800'
                                            }`}
                                    >
                                        <c.icon className={`w-4 h-4 ${params.channel === c.id ? c.color : 'opacity-40'}`} />
                                        <span className="text-xs font-bold">{c.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Focus Area</label>
                                <select
                                    value={params.focus}
                                    onChange={(e) => setParams({ ...params, focus: e.target.value })}
                                    className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none"
                                >
                                    <option value="launch">App Launch</option>
                                    <option value="feature">Feature Spotlight</option>
                                    <option value="community">Community Growth</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Audience</label>
                                <input
                                    type="text"
                                    value={params.targetAudience}
                                    onChange={(e) => setParams({ ...params, targetAudience: e.target.value })}
                                    placeholder="e.g. Connoisseurs"
                                    className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none"
                                />
                            </div>
                        </div>

                        {params.focus === 'feature' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Feature to Highlight</label>
                                <input
                                    type="text"
                                    value={params.featureName}
                                    onChange={(e) => setParams({ ...params, featureName: e.target.value })}
                                    placeholder="e.g. Mycelium Network"
                                    className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none"
                                />
                            </motion.div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            {generating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                            GENERATE CAMPAIGN ASSET
                        </button>
                    </div>

                    {/* Result */}
                    <div className="relative group min-h-[400px]">
                        <div className="absolute inset-0 bg-slate-800/30 rounded-3xl border border-white/5 overflow-hidden">
                            <AnimatePresence mode="wait">
                                {result ? (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="h-full flex flex-col p-6"
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Asset Preview</span>
                                            <button
                                                onClick={copyToClipboard}
                                                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all flex items-center gap-2"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                <span className="text-[10px] font-bold">{copied ? 'COPIED' : 'COPY'}</span>
                                            </button>
                                        </div>
                                        <div className="flex-1 text-slate-300 text-sm font-medium leading-relaxed whitespace-pre-wrap overflow-y-auto custom-scrollbar pr-4">
                                            {result}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 opacity-50">
                                            <Sparkles className="w-8 h-8 text-slate-600" />
                                        </div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Select params & hit generate</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategy Card */}
            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { title: 'Launch Orbit', desc: 'Create awareness for the initial App Store drop.', icon: Zap },
                    { title: 'Vibe Velocity', desc: 'Maximize interaction through catchy captions.', icon: Music },
                    { title: 'Conversion', desc: 'Drive high-quality downloads using data stories.', icon: Send }
                ].map((s, i) => (
                    <div key={i} className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl group hover:border-emerald-500/20 transition-all">
                        <s.icon className="w-5 h-5 text-emerald-500 mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">{s.title}</h4>
                        <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketingStudio;
