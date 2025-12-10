import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, PlayCircle, Trash2, Moon, Sun, Shield } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, onResetTutorial, onClearCache, onOpenTerms }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative"
                    >
                        <div className="flex justify-between items-center p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-400" />
                                App Settings
                            </h2>
                            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Tutorial Section */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Onboarding</h3>
                                <button
                                    onClick={() => { onResetTutorial(); onClose(); }}
                                    className="w-full flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                            <PlayCircle className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-white font-medium">Replay Tutorial</div>
                                            <div className="text-xs text-slate-500">View the welcome tour again</div>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* Storage Section */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Storage & Data</h3>
                                <button
                                    onClick={onClearCache}
                                    className="w-full flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-red-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                            <Trash2 className="w-5 h-5 text-red-400" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-white font-medium">Clear App Cache</div>
                                            <div className="text-xs text-slate-500">Fixes storage/loading issues</div>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* Legal Section */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Legal</h3>
                                <button
                                    onClick={onOpenTerms}
                                    className="w-full flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                                            <Shield className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-white font-medium">Terms & Conditions</div>
                                            <div className="text-xs text-slate-500">Read our usage policies</div>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <div className="pt-4 border-t border-white/5 text-center">
                                <p className="text-xs text-slate-600">StrainWise v1.0.0</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SettingsModal;
