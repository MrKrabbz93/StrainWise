import React, { useState } from 'react';
import { Search, BookOpen, Dna, Thermometer, Activity, Sprout, MapPin, X, Sparkles, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStrainEncyclopediaEntry } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import strainsData from '../data/strains.json';
import dispensariesData from '../data/dispensaries.json';
import DispensaryMap from './DispensaryMap';

// CSS Visual Profiles (Fallback for Image Generation Failure)
const visualProfiles = {
    purple: "bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950",
    green_sativa: "bg-gradient-to-br from-lime-900 via-emerald-950 to-slate-950",
    frosty: "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950",
    orange: "bg-gradient-to-br from-orange-900 via-amber-950 to-slate-950",
    dark: "bg-gradient-to-br from-green-950 via-slate-950 to-black"
};

const StrainLibrary = () => {
    const [query, setQuery] = useState('');
    const [strainData, setStrainData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [nearbyDispensaries, setNearbyDispensaries] = useState([]);
    const [stockStatus, setStockStatus] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setStrainData(null);
        setStockStatus(null);

        try {
            const data = await generateStrainEncyclopediaEntry(query);
            if (data) {
                setStrainData(data);
            } else {
                setError("Could not find info on this strain. Try another spelling?");
            }
        } catch (err) {
            setError("An error occurred while fetching the data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFindNearby = () => {
        if (!strainData) return;
        const localStrain = strainsData.find(s => s.name.toLowerCase() === strainData.name.toLowerCase());

        if (!localStrain) {
            setStockStatus('not-found');
            return;
        }

        const found = dispensariesData.filter(d => d.inventory.includes(localStrain.id));

        if (found.length > 0) {
            setNearbyDispensaries(found);
            setShowMap(true);
            setStockStatus('found');
        } else {
            setStockStatus('not-found');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 relative">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
                    Strain Encyclopedia
                </h2>
                <p className="text-slate-400">
                    Access our vast database of cannabis knowledge. Search for any strain to view its complete profile.
                </p>
            </div>

            <form onSubmit={handleSearch} className="mb-12 relative max-w-xl mx-auto">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a strain (e.g., 'Granddaddy Purple')..."
                    id="strain-search-input"
                    name="strainSearch"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-full py-4 px-6 pl-12 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-full font-medium text-sm transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </form>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg border border-red-500/20"
                    >
                        {error}
                    </motion.div>
                )}

                {strainData && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative"
                    >
                        {/* Visual Profile Header (CSS Gradient) */}
                        <div className={`h-64 w-full relative overflow-hidden ${visualProfiles[strainData.visual_profile] || visualProfiles.green_sativa}`}>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />

                            {/* Abstract Visual Elements */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" />

                            <div className="absolute top-6 right-6 z-30 flex gap-3">
                                <button
                                    onClick={async () => {
                                        // Check if logged in (simple check for demo)
                                        const { data: { user } } = await supabase.auth.getUser();
                                        if (!user) {
                                            alert("Please sign in to save favorites.");
                                            return;
                                        }

                                        // Save to Supabase (or Mock LocalStorage)
                                        const { error } = await supabase.from('favorites').insert([
                                            {
                                                user_id: user.id,
                                                strain_name: strainData.name,
                                                visual_profile: strainData.visual_profile,
                                                type: strainData.type
                                            }
                                        ]);

                                        if (!error) {
                                            alert(`Saved ${strainData.name} to your favorites!`);
                                        }
                                    }}
                                    className="p-3 bg-slate-950/30 backdrop-blur-md rounded-full text-white/70 hover:text-red-400 hover:bg-slate-950/50 transition-all border border-white/10 group"
                                >
                                    <Heart className="w-6 h-6 group-hover:fill-red-400 group-hover:text-red-400 transition-colors" />
                                </button>
                            </div>

                            <div className="absolute bottom-0 left-0 p-8 z-20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-emerald-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Visual Profile: {strainData.visual_profile.replace('_', ' ')}</span>
                                </div>
                                <h3 className="text-4xl font-bold text-white mb-2">{strainData.name}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${strainData.type.toLowerCase().includes('sativa') ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' :
                                    strainData.type.toLowerCase().includes('indica') ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' :
                                        'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                    }`}>
                                    {strainData.type}
                                </span>
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Find Nearby Button */}
                            <div className="absolute top-8 right-8 z-30">
                                <button
                                    onClick={handleFindNearby}
                                    className="flex items-center gap-2 bg-emerald-500/90 backdrop-blur-md text-slate-950 font-bold px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors shadow-lg"
                                >
                                    <MapPin className="w-4 h-4" />
                                    Find Nearby
                                </button>
                                {stockStatus === 'not-found' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute top-full right-0 mt-2 w-48 text-xs text-orange-400 bg-slate-950/90 border border-orange-500/20 p-2 rounded text-center backdrop-blur-md"
                                    >
                                        Not currently in stock at partner locations.
                                    </motion.div>
                                )}
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 mb-8 border-b border-white/10 pb-8">
                                <div className="flex-1">
                                    <p className="text-slate-300 leading-relaxed text-lg">{strainData.description}</p>
                                </div>
                                <div className="md:w-1/3 space-y-4">
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                            <Dna className="w-3 h-3" /> Lineage
                                        </div>
                                        <div className="font-medium text-slate-200">{strainData.lineage}</div>
                                    </div>
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                            <Activity className="w-3 h-3" /> THC Content
                                        </div>
                                        <div className="font-medium text-emerald-400 text-xl">{strainData.thc}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Thermometer className="w-4 h-4" /> Terpenes
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {strainData.terpenes.map(t => (
                                            <span key={t} className="px-3 py-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg text-sm">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" /> Effects
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {strainData.effects.map(e => (
                                            <span key={e} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-lg text-sm">
                                                {e}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Sprout className="w-4 h-4" /> Growing
                                    </h4>
                                    <p className="text-sm text-slate-300 bg-slate-800/30 p-3 rounded-lg border border-white/5">
                                        {strainData.growing}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                <DispensaryMap dispensaries={nearbyDispensaries} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StrainLibrary;
