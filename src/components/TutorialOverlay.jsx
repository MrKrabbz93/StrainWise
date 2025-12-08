import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, BookOpen, Users, CheckCircle, ArrowRight, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to the Inner Circle',
        desc: 'You have unlocked access to StrainWise. Let us guide you through your new tools.',
        icon: CheckCircle,
        color: 'text-emerald-400'
    },
    {
        id: 'personas',
        title: 'Your AI Consultants',
        desc: 'Choose your guide: The Scientist for deep data, The Connoisseur for luxury, or The Guide for friendly advice.',
        icon: MessageSquare,
        color: 'text-cyan-400'
    },
    {
        id: 'encyclopedia',
        title: 'The Strain Encyclopedia',
        desc: 'Explore our vast library of strains with rich visual profiles and detailed medical effects.',
        icon: BookOpen,
        color: 'text-purple-400'
    },
    {
        id: 'community',
        title: 'Community First',
        desc: 'Connect with other enthusiasts. Our "Robin Hood" model ensures fair access for all.',
        icon: Users,
        color: 'text-amber-400'
    }
];

const TutorialOverlay = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Finish
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('profiles').update({ tutorial_completed: true }).eq('id', user.id);
                }
            } catch (e) {
                console.log("Guest tutorial completed");
            }
            onComplete();
        }
    };

    const step = STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
                key={step.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20 ${step.color.replace('text-', 'bg-')}`} />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${step.color} border border-white/10 shadow-lg`}>
                            <step.icon className="w-7 h-7" />
                        </div>
                        <button onClick={onComplete} className="text-slate-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>
                    <p className="text-slate-400 leading-relaxed mb-8 text-lg">
                        {step.desc}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            {STEPS.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentStep ? 'bg-white w-6' : 'bg-slate-700'}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25"
                        >
                            {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TutorialOverlay;
