import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Building2, Mail, Phone, Briefcase, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { analytics } from '../lib/analytics';
import { useUserStore } from '../lib/stores/user.store';

const ClaimBusinessModal = ({ dispensary, onClose }) => {
    const user = useUserStore((state) => state.user);
    const [step, setStep] = useState(1); // 1=Form, 2=Success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        business_email: user?.email || '',
        phone: '',
        role: '',
        notes: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!user) throw new Error("Please log in to claim a business.");

            const { error: dbError } = await supabase
                .from('business_claims')
                .insert([{
                    user_id: user.id,
                    dispensary_id: dispensary.id,
                    business_email: formData.business_email,
                    phone: formData.phone,
                    role: formData.role,
                    status: 'pending'
                }]);

            if (dbError) {
                if (dbError.code === '23505') throw new Error("You have already submitted a claim for this business.");
                throw dbError;
            }

            analytics.track('claim_submitted', {
                dispensary: dispensary.name,
                role: formData.role
            });
            setStep(2);
        } catch (err) {
            setError(err.message || "Failed to submit claim. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm -ml-[calc(100vw-100%)]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {step === 1 ? (
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Claim this Business</h2>
                                <p className="text-sm text-slate-400 line-clamp-1">{dispensary.name}</p>
                            </div>
                        </div>

                        <div className="bg-emerald-900/10 border border-emerald-500/10 rounded-xl p-4 mb-6">
                            <h3 className="text-emerald-400 font-bold text-sm mb-1">Why claim your business?</h3>
                            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                                <li>Update your menu & inventory integration</li>
                                <li>Respond to patient reviews</li>
                                <li>Access analytics & traffic insights</li>
                                <li>Get a "Verified Partner" badge</li>
                            </ul>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Business Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 text-sm"
                                        placeholder="owner@dispensary.com"
                                        value={formData.business_email}
                                        onChange={e => setFormData({ ...formData, business_email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="tel"
                                        required
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 text-sm"
                                        placeholder="+1 (555) 000-0000"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Your Role</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <select
                                        required
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 text-sm appearance-none cursor-pointer"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="">Select Role</option>
                                        <option value="owner">Owner / Founder</option>
                                        <option value="manager">Manager</option>
                                        <option value="marketing">Marketing Director</option>
                                        <option value="employee">Staff / Budtender</option>
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-400 text-xs bg-red-900/10 p-3 rounded-lg border border-red-500/20">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Claim Request"}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Claim Received!</h2>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Thanks for claiming <strong>{dispensary.name}</strong>. Our team will verify your details and contact you at <strong>{formData.business_email}</strong> within 24 hours.
                        </p>
                        <button
                            onClick={onClose}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-xl font-bold text-sm transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ClaimBusinessModal;
