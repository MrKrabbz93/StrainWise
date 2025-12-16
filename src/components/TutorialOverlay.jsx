import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Globe, BookOpen, Sparkles, CheckCircle, ArrowRight, X, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

// High-impact visuals for each step
const STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to StrainWise',
        subtitle: 'Your Personal AI Cannabis Concierge',
        desc: 'Experience a new era of cannabis discovery. From medical precision to recreational nuances, we use advanced AI to find your perfect match.',
        icon: Sparkles,
        image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop', // Futuristic Hallway/Portal
        color: 'from-emerald-400 to-cyan-400',
        bg: 'bg-emerald-500/10'
    },
    {
        id: 'consultant',
        title: 'Expert AI Consultation',
        subtitle: 'Science Meets Sensation',
        desc: 'Chat with "The Scientist" to understand terpenes or "The Connoisseur" for flavor pairings. Our AI analyzes thousands of strains to answer your specific needs.',
        icon: MessageSquare,
        image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965&auto=format&fit=crop', // AI/Brain Abstract
        color: 'from-purple-400 to-pink-400',
        bg: 'bg-purple-500/10'
    },
    {
        id: 'global',
        title: 'Global Inventory',
        subtitle: 'Find Stock Anywhere',
        desc: 'Traveling? Locate dispensaries and check stock levels in Australia, Canada, UK, Germany, and Thailand with our real-time global map.',
        icon: Globe,
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop', // Earth/Network
        color: 'from-cyan-400 to-blue-400',
        bg: 'bg-cyan-500/10'
    },
    {
        id: 'community',
        title: 'Join the Inner Circle',
        subtitle: 'Share & Discover',
        desc: 'Read authentic journals from verified users. Share your own experiences to earn XP, unlock badges, and climb the "Master Grower" leaderboard.',
        icon: User,
        image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop', // Community/Gathering (Dark/Moody)
        color: 'from-amber-400 to-orange-400',
        bg: 'bg-amber-500/10'
    }
];

const TutorialOverlay = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const step = STEPS[currentStep];

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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
            {/* Ambient Background Glow */}
            <motion.div
                key={step.id + '-bg'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 bg-gradient-to-br ${step.color}`}
            />

            <div className="relative w-full max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">

                {/* Left Side: Visual / Hero */}
                <div className="w-full md:w-1/2 flex justify-center order-2 md:order-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 50, scale: 0.9 }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                            className="relative w-full aspect-square max-w-sm"
                        >
                            {/* Main Image Card */}
                            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                                <img
                                    src={step.image}
                                    alt={step.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 mb-4 text-white shadow-lg`}>
                                        <step.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white leading-tight">{step.subtitle}</h3>
                                </div>
                            </div>

                            {/* Decorative Elements */}
                            <div className={`absolute -z-10 inset-4 rounded-3xl blur-2xl opacity-40 bg-gradient-to-br ${step.color}`} />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Right Side: Content */}
                <div className="w-full md:w-1/2 max-w-lg order-1 md:order-2">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step.id + '-text'}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <h2 className={`text-sm font-bold tracking-wider uppercase bg-gradient-to-r ${step.color} bg-clip-text text-transparent mb-2`}>
                                Step {currentStep + 1} of {STEPS.length}
                            </h2>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                                {step.title}
                            </h1>
                            <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                {step.desc}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8">
                        {/* Progress Dots */}
                        <div className="flex gap-3">
                            {STEPS.map((_, idx) => (
                                <motion.div
                                    key={idx}
                                    animate={{
                                        width: idx === currentStep ? 32 : 8,
                                        backgroundColor: idx === currentStep ? '#fff' : '#334155'
                                    }}
                                    className="h-2 rounded-full transition-colors"
                                />
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onComplete}
                                className="text-slate-500 hover:text-white font-medium text-sm transition-colors"
                            >
                                Skip
                            </button>
                            <button
                                onClick={handleNext}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 bg-gradient-to-r ${step.color}`}
                            >
                                {currentStep === STEPS.length - 1 ? 'Start Exploring' : 'Next'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialOverlay;
