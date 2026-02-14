import React, { useState, useEffect } from 'react';
import { Activity, Droplet, Brain, MapPin, Sparkles, Share2, X, Star, User, Book } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
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
        : (dispensaries || []).filter(d => Array.isArray(d.inventory) && d.inventory.includes(strain.id));

    const [hasFired, setHasFired] = useState(false);

    // Lazy Data Fetching: Only trigger when user hovers or interacts
    const triggerDataFetch = async () => {
        if (hasFired) return;
        setHasFired(true);

        // 1. Fetch AI Reviews
        try {
            const reviewsData = await generateCustomerReviews(strain.name);
            setReviews(reviewsData);
            setIsGenerating(false);
        } catch (err) {
            console.warn("AI Review generation skipped", err);
        }

        // 2. Fetch Nearby Availability
        if (userLocation?.lat && userLocation?.lng) {
            try {
                const nearby = await getDispensariesWithStrain(strain.id, userLocation.lat, userLocation.lng);
                if (nearby.length > 0) {
                    setLocalDispensaries(nearby);
                }
            } catch (err) {
                console.error("Failed to load local dispensaries", err);
            }
        }
    };

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
                whileHover={{ y: -8, scale: 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onMouseEnter={triggerDataFetch}
                onClick={() => {
                    triggerDataFetch();
                    const slug = strain.name.toLowerCase().replace(/\s+/g, '-');
                    navigate(`/strain/${slug}`);
                }}
                className="group relative glass-card rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-emerald-500/10 cursor-pointer"
            >
                {/* 1. Hero Image Area (Aspect 3:2) */}
                <div className="aspect-[4/3] relative overflow-hidden bg-slate-950">
                    <AnimatePresence>
                        {imageState === 'loading' && (
                            <motion.div
                                initial={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950"
                            >
                                <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {imageState === 'error' || imageSrc === '/placeholder.png' ? (
                        <div className={`absolute inset-0 w-full h-full bg-gradient-to-br ${visualProfileMap[strain.visual_profile] || "from-slate-800 to-slate-950"} animate-gradient`}>
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                <Sparkles className="w-20 h-20 text-white animate-pulse" />
                            </div>
                        </div>
                    ) : (
                        <img
                            src={imageSrc}
                            alt={strain.name}
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 filter brightness-90 group-hover:brightness-105 ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setImageState('loaded')}
                            onError={handleImageError}
                        />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    {strain.is_verified && (
                        <div className="absolute top-4 left-4 z-20">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-full shadow-lg">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                                <span className="text-[10px] font-black text-emerald-50 text-shadow-sm uppercase tracking-widest">Verified Cultivar</span>
                            </div>
                        </div>
                    )}

                    <div className="absolute top-4 right-4 z-20">
                        <div className="bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-center shadow-xl">
                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">THC</span>
                            <span className="text-sm font-black text-emerald-400 leading-tight">{strain.thc}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Content Body */}
                <div className="relative px-6 pb-6 pt-4">
                    <div className="mb-6">
                        <h3 className="text-3xl font-black text-white leading-none tracking-tighter mb-2 group-hover:premium-gradient-text transition-all duration-300">
                            {strain.name}
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm ${(strain.type || '').includes('Sativa') ? 'border-orange-500/40 text-orange-400 bg-orange-500/5' :
                                (strain.type || '').includes('Indica') ? 'border-purple-500/40 text-purple-400 bg-purple-500/5' :
                                    'border-emerald-500/40 text-emerald-400 bg-emerald-500/5'
                                }`}>
                                {strain.type || 'Hybrid'}
                            </span>
                            {strain.lineage && (
                                <span className="text-xs font-medium text-slate-500 truncate max-w-[120px]">
                                    {strain.lineage}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-6">
                        {strain.effects?.slice(0, 2).map(effect => (
                            <div key={effect} className="bg-white/5 border border-white/5 rounded-2xl px-3 py-2 flex items-center gap-2 group/chip hover:bg-white/10 hover:border-emerald-500/20 transition-all">
                                <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center border border-white/5">
                                    <Brain className="w-3 h-3 text-slate-400 group-hover/chip:text-emerald-400" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-300">{effect}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // Diversify partners: ILGM for US/CA, Seedsman for Global
                            const partnerId = strain.name.length % 2 === 0 ? 'ilgm' : 'seedsman';
                            analytics.track('affiliate_click', { type: 'seeds', strain: strain.name, partner: partnerId });
                            window.open(`/api/redirect?partnerId=${partnerId}&strainName=${encodeURIComponent(strain.name)}`, '_blank');
                        }}
                        className="premium-button w-full mb-6 flex items-center justify-between group/btn shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xl group-hover:rotate-12 transition-transform">🧬</span>
                            <span>Get Genetics</span>
                        </div>
                        <div className="bg-slate-950/20 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 group-hover:border-white/20 transition-all">
                            Partner Deal
                        </div>
                    </button>

                    <div className="pt-5 border-t border-white/5 flex justify-between items-center">
                        <div className="flex gap-1.5">
                            {availableDispensaries.length > 0 ? (
                                <button
                                    onClick={() => setShowMap(true)}
                                    className="flex items-center gap-2 group/loc"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center group-hover/loc:border-emerald-500 group-hover/loc:bg-emerald-500 transition-all duration-300 shadow-lg">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover/loc:text-slate-950" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 group-hover/loc:text-emerald-300 transition-colors flex items-center gap-1">
                                        Locate <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                    </span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 opacity-30">
                                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                                        <MapPin className="w-3.5 h-3.5 text-slate-600" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic">OOS</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsJournalModalOpen(true); }}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-900 border border-white/5 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all shadow-md group/journal"
                                title="Log to Journal"
                            >
                                <Book className="w-4 h-4 group-hover/journal:scale-110 transition-transform" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    analytics.track('share_strain_click', { strain: strain.name });
                                    const shareData = {
                                        title: `StrainWise: ${strain.name}`,
                                        text: `Check out ${strain.name} on StrainWise - The AI Cannabis Consultant.`,
                                        url: window.location.origin + `/strain/${strain.name.replace(/\s+/g, '-')}`
                                    };
                                    if (navigator.share) {
                                        navigator.share(shareData).catch(err => console.log('Share canceled', err));
                                    } else {
                                        navigator.clipboard.writeText(shareData.url);
                                        alert("Link copied to clipboard!");
                                    }
                                }}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-900 border border-white/5 text-slate-500 hover:text-white hover:border-white/20 transition-all shadow-md group/share"
                            >
                                <Share2 className="w-4 h-4 group-share:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

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

                {
                    isJournalModalOpen && (
                        <JournalEntry
                            strain={strain}
                            onClose={() => setIsJournalModalOpen(false)}
                            onSave={() => {
                                // Optional: Show success toast
                            }}
                        />
                    )
                }
            </AnimatePresence >
        </>
    );
};

export default StrainCard;

