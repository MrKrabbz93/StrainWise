import React, { useState, useEffect } from 'react';
import { Activity, Droplet, Brain, MapPin, Sparkles, Share2, X, Star, User, Book } from 'lucide-react';
import { generateCustomerReviews } from '../lib/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import DispensaryMap from './DispensaryMap';
import { getStrainImageUrl } from '../lib/images';
import { analytics } from '../lib/analytics';
import { logFeedback } from '../lib/services/feedback.service';
import { useUserStore } from '../lib/stores/user.store';
import JournalEntry from './JournalEntry';

import { getDispensariesWithStrain } from '../lib/services/dispensary.service';

const StrainCard = ({ strain, dispensaries, userLocation }) => {
    const user = useUserStore((state) => state.user);
    const [reviews, setReviews] = useState([]);
    const [isGenerating, setIsGenerating] = useState(true);
    const [showMap, setShowMap] = useState(false);
    const [showDispensaries, setShowDispensaries] = useState(false);
    const [customImage, setCustomImage] = useState(null);
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

    // State for fetching real-time inventory
    const [localDispensaries, setLocalDispensaries] = useState([]);

    // Logic to determine which dispensaries to show (Prop fallback or Real-time)
    const availableDispensaries = localDispensaries.length > 0
        ? localDispensaries
        : (dispensaries || []).filter(d => d.inventory?.includes(strain.id));

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            // 1. Fetch AI Reviews
            const reviewsData = await generateCustomerReviews(strain.name);
            if (!mounted) return;
            setReviews(reviewsData);
            setIsGenerating(false);

            // 2. Fetch Nearby Availability
            if (userLocation?.lat && userLocation?.lng) {
                try {
                    const nearby = await getDispensariesWithStrain(strain.id, userLocation.lat, userLocation.lng);
                    if (mounted && nearby.length > 0) {
                        setLocalDispensaries(nearby);
                    }
                } catch (err) {
                    console.error("Failed to load local dispensaries", err);
                }
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, [strain, userLocation]);

    const [imageState, setImageState] = useState('loading'); // 'loading' | 'loaded' | 'error'
    const [imageSrc, setImageSrc] = useState(getStrainImageUrl(strain));

    // Reset image state when strain changes
    useEffect(() => {
        setImageState('loading');
        setImageSrc(customImage || getStrainImageUrl(strain));
    }, [strain, customImage]);

    const handleImageError = async () => {
        // Prevent infinite loops if fallback also fails
        if (imageSrc === '/placeholder.png') return;

        if (imageSrc.includes('pexels') || imageSrc.includes('api/images')) {
            // If API/Pexels failed, go to local absolute fallback
            setImageSrc("/placeholder.png");
            return;
        }

        try {
            // Attempt to fetch from our proxy
            const res = await fetch(`/api/images?strainName=${encodeURIComponent(strain.name)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.imageUrl) {
                    setImageSrc(data.imageUrl);
                    return;
                }
            }
        } catch (err) {
            console.warn("Fallback fetch failed", err);
        }

        // Final fallback
        setImageSrc("/placeholder.png");
    };

    const visualProfileMap = {
        purple: "from-purple-900 via-indigo-900 to-slate-900",
        green_sativa: "from-emerald-900 via-green-800 to-slate-900",
        frosty: "from-blue-900 via-slate-800 to-slate-900",
        orange: "from-orange-900 via-amber-900 to-slate-900",
        dark: "from-slate-900 via-purple-950 to-black"
    };

    return (
        <>
            <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                onClick={() => {
                    analytics.track('strain_card_clicked', {
                        strain_id: strain.id,
                        strain_name: strain.name,
                        strain_type: strain.type
                    });

                    if (user) {
                        logFeedback(user.id, strain.id, 1, 'click');
                    }
                }}
                className="group relative bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)] transition-all duration-300 transform scale-95 origin-center"
            >
                {/* 1. Hero Image Area (Aspect 3:2) */}
                <div className="aspect-[3/2] relative overflow-hidden bg-slate-900">

                    {/* Loading Skeleton */}
                    <AnimatePresence>
                        {imageState === 'loading' && (
                            <motion.div
                                initial={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900"
                            >
                                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Dynamic Image / Gradient Layer */}
                    {imageState === 'error' || imageSrc === '/placeholder.png' ? (
                        <div className={`absolute inset-0 w-full h-full bg-gradient-to-br ${visualProfileMap[strain.visual_profile] || "from-slate-800 to-slate-950"} animate-gradient-slow`}>
                            {/* Abstract Pattern Overlay */}
                            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                <Sparkles className="w-24 h-24 text-white animate-pulse" />
                            </div>
                        </div>
                    ) : (
                        <img
                            src={imageSrc}
                            alt={strain.name}
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setImageState('loaded')}
                            onError={handleImageError}
                        />
                    )}

                    {/* Gradient Overlays for Readability */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${visualProfileMap[strain.visual_profile] || "from-slate-900/90 to-transparent"} opacity-90`} />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80" />

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
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${(strain.type || '').includes('Sativa') ? 'border-orange-500/20 text-orange-400 bg-orange-500/5' :
                                    (strain.type || '').includes('Indica') ? 'border-purple-500/20 text-purple-400 bg-purple-500/5' :
                                        'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                                }`}>
                                {strain.type || 'Hybrid'}
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
                            {strain.effects?.slice(0, 3).map(effect => (
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
                                onClick={() => setShowDispensaries(!showDispensaries)}
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
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsJournalModalOpen(true); }}
                                className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-emerald-400 transition-colors"
                                title="Log to Journal"
                            >
                                <Book className="w-4 h-4" />
                            </button>
                            <button className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                                <Share2 className="w-4 h-4" />
                            </button>
                            {/* Favorite Button could go here */}
                        </div>
                    </div>

                    {/* Dispensary List Expansion */}
                    <AnimatePresence>
                        {showDispensaries && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 bg-slate-950/40 rounded-xl border border-white/5 overflow-hidden"
                            >
                                <div className="p-3 space-y-2">
                                    {availableDispensaries.slice(0, 5).map(d => (
                                        <div key={d.id} className="flex justify-between items-center text-xs group/disp hover:bg-white/5 p-2 rounded-lg transition-colors cursor-pointer" onClick={() => window.open(`https://maps.google.com/?q=${d.name} ${d.address}`, '_blank')}>
                                            <div className="flex flex-col">
                                                <span className="text-slate-200 font-bold group-hover/disp:text-emerald-400 transition-colors">{d.name}</span>
                                                <span className="text-slate-500">{d.distance?.toFixed(1)} miles away</span>
                                            </div>
                                            <div className="text-right">
                                                {(d.price_eighth || d.price_metric) ? (
                                                    <span className="block font-mono text-emerald-400 font-bold">
                                                        ${d.price_eighth || d.price_metric}
                                                        <span className="text-[10px] text-slate-500 font-sans ml-0.5">/{d.price_eighth ? '3.5g' : 'g'}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600 italic">Call for Price</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setShowMap(true)}
                                        className="w-full mt-2 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <MapPin className="w-3 h-3" /> View All on Map
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

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
                {isJournalModalOpen && (
                    <JournalEntry
                        strain={strain}
                        onClose={() => setIsJournalModalOpen(false)}
                        onSave={() => {
                            // Optional: Show success toast
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default StrainCard;
