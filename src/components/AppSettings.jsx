import React from 'react';
import { X, RefreshCw, Trash2, FileText, ChevronRight } from 'lucide-react';

const AppSettings = ({ onClose }) => {
    const handleReplayTutorial = () => {
        localStorage.removeItem('strainwise_tutorial_seen');
        window.location.reload();
    };

    const handleClearCache = () => {
        localStorage.clear();
        alert('App cache cleared. Please refresh the page.');
        window.location.reload();
    };

    const handleViewTerms = () => {
        window.open('/terms', '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">App Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                            Onboarding & Display
                        </h3>
                        <div className="space-y-3">
                            <button
                                onClick={handleReplayTutorial}
                                className="w-full flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <RefreshCw className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-slate-200 group-hover:text-white">Replay Tutorial</div>
                                        <div className="text-xs text-slate-400">View the welcome guide again</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                            Storage & Data
                        </h3>
                        <div className="space-y-3">
                            <button
                                onClick={handleClearCache}
                                className="w-full flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-red-500/50 hover:bg-slate-800/80 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                                        <Trash2 className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-slate-200 group-hover:text-white">Clear App Cache</div>
                                        <div className="text-xs text-slate-400">Fix sync or loading issues</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-red-400" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                            Legal & Info
                        </h3>
                        <div className="space-y-3">
                            <button
                                onClick={handleViewTerms}
                                className="w-full flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-slate-200 group-hover:text-white">Terms & Conditions</div>
                                        <div className="text-xs text-slate-400">Read our usage policies</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-950/50 text-center text-xs text-slate-600 border-t border-slate-800">
                    StrainWise v1.1.2 &bull; Secure Environment
                </div>
            </div>
        </div>
    );
};

export default AppSettings;
