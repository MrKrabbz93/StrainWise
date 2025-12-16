import React from 'react';
import { FileText } from 'lucide-react';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12">
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
                </div>

                <div className="space-y-8 text-slate-400 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold mb-3 text-white">Acceptance of Terms</h2>
                        <p>By accessing and using StrainWise, you accept and agree to be bound by the terms and provision of this agreement. Use of our services is strictly limited to individuals of legal age in their respective jurisdiction.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-white">Use License</h2>
                        <p>Permission is granted to temporarily download one copy of StrainWise for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-white">Disclaimer</h2>
                        <p>The information on this app is provided on an as-is basis. StrainWise and its AI Consultant make no warranties, expressed or implied, regarding the accuracy of strain effects, medical benefits, or availability.</p>
                    </section>

                    <section>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
                            <h2 className="text-xl font-bold mb-3 text-emerald-400">Medical Disclaimer</h2>
                            <p>StrainWise is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this app.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-white">Contact Us</h2>
                        <p>If you have any questions about these Terms of Service, please contact us at <span className="text-emerald-400">legal@strainwise.app</span></p>
                    </section>

                    <div className="pt-8 border-t border-slate-800 text-sm text-slate-500">
                        Last Updated: December 2025
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
