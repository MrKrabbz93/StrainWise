import React from 'react';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12">
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                        <Shield className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
                </div>

                <div className="space-y-8 text-slate-400 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold mb-3 text-white">Information We Collect</h2>
                        <p>StrainWise collects information you provide directly to us, such as when you create an account, update your profile, or use our services. This may include your username, email address, and preferences regarding cannabis strains.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-white">How We Use Your Information</h2>
                        <p>We use the information we collect to provide, maintain, and improve our services, process transactions, personalized AI recommendations, and communicate with you about updates or security alerts.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-white">Information Sharing</h2>
                        <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as required by law or to protect our rights.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-white">Data Security</h2>
                        <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-white">Contact Us</h2>
                        <p>If you have any questions about this Privacy Policy, please contact us at <span className="text-emerald-400">privacy@strainwise.app</span></p>
                    </section>

                    <div className="pt-8 border-t border-slate-800 text-sm text-slate-500">
                        Last Updated: December 2025
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
