import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles, ShieldCheck, Zap, Globe } from 'lucide-react';
import Background from './Background';
import LanguageSwitcher from './LanguageSwitcher';

import Logo from './Logo';

const LandingPage = ({ onEnter }) => {
    const { t } = useTranslation();

    return (
        <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-[#020617] selection:bg-emerald-500/30">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 z-0">
                <Background />
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse-slow" />
            </div>

            {/* Top Bar Navigation (Minimal) */}
            <header className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-50">
                <Logo withText={true} className="w-10 h-10" />
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        <span className="flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Secure</span>
                        <span className="flex items-center gap-2"><Zap className="w-3 h-3" /> AI Powered</span>
                    </div>
                    <LanguageSwitcher />
                </div>
            </header>

            <div className="relative z-10 px-6 max-w-5xl">
                {/* Hero Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 mb-8 backdrop-blur-md"
                    >
                        <Globe className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">
                            {t('landing.tagline')}
                        </span>
                    </motion.div>

                    <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white mb-8 leading-[0.8] drop-shadow-2xl">
                        Design. <br />
                        <span className="premium-gradient-text">Experience.</span> <br />
                        Wisdom.
                    </h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-lg md:text-2xl text-slate-400/80 mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
                    >
                        {t('landing.description')}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                    >
                        <button
                            onClick={onEnter}
                            className="premium-button !px-12 !py-6 text-xl shadow-[0_20px_50px_rgba(16,185,129,0.4)] group"
                        >
                            <span className="relative flex items-center gap-3">
                                {t('landing.button')}
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                            </span>
                        </button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Bottom Info Bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1.5 }}
                className="absolute bottom-12 w-full px-12 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5 pt-8"
            >
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    {t('landing.footer')}
                </div>
                <div className="flex gap-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span className="hover:text-emerald-400 transition-colors cursor-pointer">Security</span>
                    <span className="hover:text-emerald-400 transition-colors cursor-pointer">Terms</span>
                    <span className="hover:text-emerald-400 transition-colors cursor-pointer">Privacy</span>
                </div>
            </motion.div>
        </div>
    );
};

export default LandingPage;

