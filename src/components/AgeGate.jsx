import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import Logo from './Logo';

const AgeGate = ({ onVerify }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const verified = localStorage.getItem('strainwise_age_verified');
        if (!verified) {
            setIsVisible(true);
        }
    }, []);

    const handleVerify = () => {
        localStorage.setItem('strainwise_age_verified', 'true');
        setIsVisible(false);
        if (onVerify) onVerify();
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950 p-6 overflow-hidden"
                >
                    {/* Background Abstract Effects */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow" />
                    </div>

                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] max-w-lg w-full text-center relative z-10 shadow-2xl"
                    >
                        <div className="flex justify-center mb-10">
                            <Logo withText={false} className="w-20 h-20" />
                        </div>

                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-emerald-500/10 rounded-full">
                                <ShieldAlert className="w-8 h-8 text-emerald-400" />
                            </div>
                        </div>

                        <h2 className="text-4xl font-black text-white tracking-tighter mb-4 leading-none uppercase">
                            Age Verification Required
                        </h2>

                        <p className="text-slate-400 text-lg mb-10 font-medium">
                            You must be <span className="text-white font-bold">21 years or older</span> to enter the StrainWise Mycelium Network. By entering, you confirm that you meet this requirement.
                        </p>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleVerify}
                                className="premium-button !py-6 w-full text-xl flex items-center justify-center gap-3 group"
                            >
                                <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                I AM 21+ YEARS OLD
                            </button>

                            <button
                                onClick={() => window.location.href = "https://www.google.com"}
                                className="px-6 py-4 rounded-2xl text-slate-500 hover:text-white font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                UNDER 21 (Exit)
                            </button>
                        </div>

                        <div className="mt-12 text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
                            StrainWise implements strict compliance policies. <br />
                            Please enjoy responsibly and legally.
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AgeGate;
