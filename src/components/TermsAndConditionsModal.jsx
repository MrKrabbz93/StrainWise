import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, FileText } from 'lucide-react';

const TermsAndConditionsModal = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-slate-900 sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-400" />
                                Terms & Conditions
                            </h2>
                            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-slate-300 leading-relaxed text-sm">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-emerald-500" />
                                    1. Acceptance of Terms
                                </h3>
                                <p>By accessing and using StrainWise, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. This service is intended for users 21+ or legal medical patients.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-white">2. Medical Disclaimer</h3>
                                <p>StrainWise provides information for educational and entertainment purposes only. The AI Consultant is NOT a doctor. Information provided is not medical advice. Always consult a healthcare professional before using cannabis.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-white">3. User Conduct</h3>
                                <p>You agree not to use the platform for illegal activities. While cannabis laws vary by jurisdiction, you are responsible for complying with your local laws.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-white">4. Privacy</h3>
                                <p>Your data is processed according to our Privacy Policy. We do not sell your personal usage data to third parties.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-white">5. Limitation of Liability</h3>
                                <p>StrainWise is provided "as is". We are not liable for any actions taken based on the information provided by the AI or database.</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5 bg-slate-900 text-center">
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors"
                            >
                                I Understand
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TermsAndConditionsModal;
