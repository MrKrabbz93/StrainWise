import React, { useState, useEffect } from 'react';
import { Activity, Droplet, Brain, MapPin, Sparkles, Share2, X, Star, User } from 'lucide-react';
import { generateCustomerReviews } from '../lib/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import DispensaryMap from './DispensaryMap';
import { getStrainImageUrl } from '../lib/images';

const StrainCard = ({ strain, dispensaries, userLocation }) => {
    const [reviews, setReviews] = useState([]);
    const [isGenerating, setIsGenerating] = useState(true);
    const [showMap, setShowMap] = useState(false);

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

    return (
        <>
            <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden transition-all group hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] duration-500 relative"
            >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="h-32 w-full relative overflow-hidden">
                    <img
                        src={getStrainImageUrl(strain)}
                        alt={strain.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                </div>

                <div className="p-6 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">{strain.name}</h3>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full border border-white/5 ${strain.type.includes('Sativa') ? 'bg-orange-500/10 text-orange-400' :
                                strain.type.includes('Indica') ? 'bg-purple-500/10 text-purple-400' :
                                    'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                {strain.type}
                            </span>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-400">THC</div>
                            <div className="font-bold text-emerald-400">{strain.thc}</div>
                        </div>
                    </div>

                    {/* Customer Reviews Section */}
                    <div className="mb-6 bg-slate-800/50 p-4 rounded-lg border border-white/5 relative overflow-hidden group-hover:border-emerald-500/20 transition-colors">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Star className="w-12 h-12 text-yellow-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-xs text-yellow-400 font-bold mb-3 flex items-center gap-1 uppercase tracking-wider">
                                <Star className="w-3 h-3 fill-yellow-400" /> Patient Experiences
                            </div>
                            {isGenerating ? (
                                <div className="space-y-2">
                                    <div className="h-4 animate-pulse bg-slate-700/50 rounded w-3/4"></div>
                                    <div className="h-4 animate-pulse bg-slate-700/50 rounded w-1/2"></div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((review, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="text-sm"
                                        >
                                            <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                                                <span className="font-medium text-slate-400 flex items-center gap-1">
                                                    <User className="w-3 h-3" /> {review.user}
                                                </span>
                                                <div className="flex text-yellow-500">
                                                    {[...Array(review.rating)].map((_, i) => (
                                                        <Star key={i} className="w-2 h-2 fill-current" />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-slate-300 leading-snug italic">"{review.text}"</p>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Effects</div>
                            <div className="flex flex-wrap gap-1">
                                {strain.effects.map(effect => (
                                    <span key={effect} className="text-xs bg-slate-800/50 text-slate-300 px-2 py-1 rounded border border-white/5">
                                        {effect}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Medical</div>
                            <div className="flex flex-wrap gap-1">
                                {strain.medical.map(condition => (
                                    <span key={condition} className="text-xs bg-slate-800/50 text-slate-300 px-2 py-1 rounded border border-white/5">
                                        {condition}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {availableDispensaries.length > 0 && (
                        <div className="border-t border-white/10 pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Available Nearby
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowMap(true)}
                                        className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-2 py-1 rounded transition-colors"
                                    >
                                        View Map
                                    </button>
                                    <button className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1 transition-colors">
                                        <Share2 className="w-3 h-3" /> Share
                                    </button>
                                </div>
                            </div>
                            <ul className="space-y-2">
                                {availableDispensaries.slice(0, 2).map(d => (
                                    <li key={d.id} className="text-sm text-slate-300 flex justify-between items-center group/item hover:bg-white/5 p-2 rounded transition-colors cursor-pointer">
                                        <span>{d.name}</span>
                                        <span className="text-xs text-emerald-500 font-medium">{d.rating} ★</span>
                                    </li>
                                ))}
                            </ul>
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
