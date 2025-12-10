import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Scale, ScrollText, AlertTriangle } from 'lucide-react';

const TermsAndConditionsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-slate-900 border border-white/10 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden relative flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                <Scale className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Terms & Conditions</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300 text-sm leading-relaxed custom-scrollbar">
                        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
                            <div>
                                <h4 className="font-bold text-orange-400 mb-1">Age Restriction Warning</h4>
                                <p className="text-orange-200/80 text-xs">
                                    You must be at least 21 years of age (or a valid medical patient) to use StrainWise.
                                    By using this application, you affirm that you meet the legal age requirements for your jurisdiction.
                                </p>
                            </div>
                        </div>

                        <section>
                            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                                <ScrollText className="w-4 h-4 text-emerald-400" /> 1. Introduction
                            </h3>
                            <p>
                                Welcome to StrainWise. By accessing or using our application, you agree to be bound by these Terms and Conditions.
                                If you disagree with any part of these terms, you may not access the service.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-emerald-400" /> 2. Medical Disclaimer
                            </h3>
                            <p>
                                StrainWise provides information for educational and entertainment purposes only. We are not medical professionals.
                                The information provided regarding cannabis strains, terpenes, and effects has not been evaluated by the FDA
                                or any other medical authority.
                            </p>
                            <p className="mt-2 text-slate-400">
                                <strong>Always consult with a qualified healthcare provider</strong> before using cannabis for medical purposes.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-base font-bold text-white mb-2">3. User Contributions</h3>
                            <p>
                                By submitting content (strains or dispensaries) to StrainWise, you grant us a worldwide, non-exclusive license to use,
                                reproduce, and display such content. You represent that your contributions are accurate and do not violate any third-party rights.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-base font-bold text-white mb-2">4. Privacy</h3>
                            <p>
                                Your use of StrainWise is also governed by our Privacy Policy. We collect minimal data mainly for authentication and
                                gamification features (XP, Contributions). We do not sell your personal data.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-base font-bold text-white mb-2">5. Compliance with Local Laws</h3>
                            <p>
                                Cannabis laws vary significantly by jurisdiction. You are solely responsible for ensuring that your use of this application
                                and any related activities comply with the laws applicable to you in your location.
                            </p>
                        </section>

                        <div className="pt-8 text-center text-xs text-slate-500">
                            Last Updated: December 2025
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5 bg-slate-900 z-10 text-center">
                        <button
                            onClick={onClose}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 px-8 rounded-full transition-colors w-full sm:w-auto"
                        >
                            I Understand & Agree
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TermsAndConditionsModal;
