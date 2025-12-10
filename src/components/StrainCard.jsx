import React, { useState, useEffect } from 'react';
import { Activity, Droplet, Brain, MapPin, Sparkles, Share2, X, Star, User } from 'lucide-react';
import { generateCustomerReviews } from '../lib/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import DispensaryMap from './DispensaryMap';
import { getStrainImageUrl } from '../lib/images';
import { generateImage } from '../lib/gemini';

const StrainCard = ({ strain, dispensaries, userLocation }) => {
    const [reviews, setReviews] = useState([]);
    const [isGenerating, setIsGenerating] = useState(true);
    const [showMap, setShowMap] = useState(false);
    const [customImage, setCustomImage] = useState(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    // Find dispensaries that have this strain
    const availableDispensaries = dispensaries.filter(d => d.inventory.includes(strain.id));

    useEffect(() => {
        let mounted = true;
        const fetchReviews = async () => {
            const data = await generateCustomerReviews(strain.name);
            if (mounted) {
                setReviews(data);
                setIsGenerating(false);
            }
        };
        fetchReviews();
        return () => { mounted = false; };
    }, [strain]);

    const handleGenerateImage = async (e) => {
        e.stopPropagation(); // Prevent card click
        setIsGeneratingImage(true);
        const prompt = `A cinematic, photorealistic close-up shot of the cannabis strain "${strain.name}". 
        Visual traits: ${strain.visual_profile || 'lush green'}. 
        Mood: ${strain.type === 'Sativa' ? 'Energetic, bright, sunny' : 'Relaxing, mystical, deep purple tones'}.
        High quality, 8k resolution, macro photography.`;

        const url = await generateImage(prompt);
        if (url) setCustomImage(url);
        setIsGeneratingImage(false);
    };

    const visualProfileMap = {
        purple: "from-purple-900/40 to-slate-900/90",
        green_sativa: "from-emerald-900/40 to-slate-900/90",
        frosty: "from-blue-900/40 to-slate-900/90",
        orange: "from-orange-900/40 to-slate-900/90",
        dark: "from-slate-900/90 to-black/90"
    };

    return (
        <>
            <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                onClick={() => { }} // Placeholder for future modal
                className="group relative bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)] transition-all duration-300"
            >
                {/* 1. Hero Image Area (Aspect 3:2) */}
                <div className="aspect-[3/2] relative overflow-hidden">
                    <img
                        src={customImage || getStrainImageUrl(strain)}
                        alt={strain.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Gradient Overlays for Readability */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${visualProfileMap[strain.visual_profile] || "from-slate-900/90 to-transparent"} opacity-90`} />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80" />

                    {/* Top Right: Magic Generator */}
                    <button
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage}
                        className="absolute top-3 right-3 p-2.5 bg-slate-950/40 backdrop-blur-md rounded-full text-white/70 hover:text-emerald-400 hover:bg-slate-950/80 border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-20"
                        title="Generate Unique AI Art"
                    >
                        {isGeneratingImage ? <Sparkles className="w-4 h-4 animate-spin text-emerald-400" /> : <Sparkles className="w-4 h-4" />}
                    </button>

                    {/* Verified Badge */}
                    {strain.is_verified && (
                        <div className="absolute top-3 left-3 z-20">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/20 rounded-full shadow-lg">
                                <Sparkles className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                                <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Verified</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Content Body */}
                <div className="-mt-12 relative z-10 px-5 pb-5">
                    {/* Floating Title Card */}
                    <div className="mb-4">
                        <div className="flex justify-between items-end mb-1">
                            <h3 className="text-2xl font-extrabold text-white leading-none tracking-tight group-hover:text-emerald-400 transition-colors drop-shadow-md">
                                {strain.name}
                            </h3>
                            <div className="text-right">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">THC</div>
                                <div className="text-lg font-bold text-emerald-400 leading-none">{strain.thc}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${strain.type.includes('Sativa') ? 'border-orange-500/20 text-orange-400 bg-orange-500/5' :
                                strain.type.includes('Indica') ? 'border-purple-500/20 text-purple-400 bg-purple-500/5' :
                                    'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                                }`}>
                                {strain.type}
                            </span>
                            {/* Lineage (truncated) */}
                            {strain.lineage && (
                                <span className="text-xs text-slate-500 truncate max-w-[150px] hidden sm:block">
                                    {strain.lineage}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Chips Sections */}
                    <div className="space-y-3">
                        {/* Effects */}
                        <div className="flex flex-wrap gap-1.5">
                            {strain.effects.slice(0, 3).map(effect => (
                                <span key={effect} className="px-2.5 py-1 bg-slate-800/50 text-slate-300 rounded-md text-xs font-medium border border-white/5 flex items-center gap-1 group/chip hover:border-emerald-500/30 transition-colors">
                                    <Brain className="w-3 h-3 text-slate-500 group-hover/chip:text-emerald-400" />
                                    {effect}
                                </span>
                            ))}
                        </div>

                        {/* Terpenes or Medical (Mix) */}
                        <div className="flex flex-wrap gap-1.5">
                            {strain.terpenes?.slice(0, 2).map(t => (
                                <span key={t} className="px-2.5 py-1 bg-blue-900/10 text-blue-300 rounded-md text-xs font-medium border border-blue-500/10 flex items-center gap-1">
                                    <Droplet className="w-3 h-3 text-blue-400/70" />
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
                        {availableDispensaries.length > 0 ? (
                            <button
                                onClick={() => setShowMap(true)}
                                className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white group/btn transition-colors"
                            >
                                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover/btn:bg-emerald-500 group-hover/btn:text-slate-900 transition-colors">
                                    <MapPin className="w-3 h-3" />
                                </div>
                                {availableDispensaries.length} Location{availableDispensaries.length !== 1 ? 's' : ''} Nearby
                            </button>
                        ) : (
                            <span className="text-xs text-slate-600 italic">Not in stock nearby</span>
                        )}

                        <div className="flex gap-2">
                            <button className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                                <Share2 className="w-4 h-4" />
                            </button>
                            {/* Favorite Button could go here */}
                        </div>
                    </div>

                    {/* Reviews Summary (Mini) */}
                    {reviews.length > 0 && (
                        <div className="mt-3 bg-slate-950/30 rounded-lg p-3 border border-white/5 flex items-start gap-3">
                            <div className="bg-yellow-500/10 p-1.5 rounded-full">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 line-clamp-2 italic">"{reviews[0].text}"</p>
                                <p className="text-[10px] text-slate-600 mt-1">— {reviews[0].user}</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Map Modal */}
            <AnimatePresence>
                {showMap && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                        onClick={() => setShowMap(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 w-full max-w-3xl h-[600px] rounded-2xl overflow-hidden relative shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowMap(false)}
                                className="absolute top-4 right-4 z-10 p-2 bg-slate-950/50 text-slate-400 hover:text-white rounded-full backdrop-blur-md transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="h-full w-full">
                                <DispensaryMap dispensaries={availableDispensaries} userLocation={userLocation} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default StrainCard;
