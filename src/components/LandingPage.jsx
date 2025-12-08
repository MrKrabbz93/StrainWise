import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Background from './Background';

const LandingPage = ({ onEnter }) => {
    return (
        <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center text-center z-50 bg-slate-950">
            <Background />

            <div className="relative z-10 p-6 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="mb-6"
                >
                    <div className="flex items-center justify-center gap-3 mb-4 text-emerald-400/80 uppercase tracking-[0.3em] text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        <span>Premium Cannabis Intelligence</span>
                        <Sparkles className="w-4 h-4" />
                    </div>

                    <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 mb-6 tracking-tight">
                        Strain<span className="text-emerald-500">Wise</span>
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed"
                >
                    Experience the future of personalized cannabis consultation.
                    Powered by advanced AI to guide your journey from curiosity to connoisseur.
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ delay: 1, duration: 0.3 }}
                    onClick={onEnter}
                    className="group relative px-8 py-4 bg-emerald-500 text-slate-950 font-bold text-lg rounded-full overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] transition-shadow"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <span className="relative flex items-center gap-2">
                        Enter Experience
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                </motion.button>
            </div>

            {/* Footer / Credits */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-8 text-slate-600 text-xs tracking-widest uppercase"
            >
                Est. 2025 • Los Angeles • CA
            </motion.div>
        </div>
    );
};

export default LandingPage;
