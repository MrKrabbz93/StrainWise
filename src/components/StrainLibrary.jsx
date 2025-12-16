import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FlaskConical, ArrowRight, Activity, Dna, Droplet, MapPin, Sparkles, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OptimizedImage from './optimized/OptimizedImage';
import StrainReviews from './StrainReviews';
import DispensaryMap from './DispensaryMap';
import { getStrainImageUrl } from '../lib/images';
import { getDispensariesWithStrain } from '../lib/services/dispensary.service';
import { addXP } from '../lib/gamification';
import dispensariesData from '../data/dispensaries.json';

const StrainLibrary = ({ userLocation }) => {
    // --- State ---
    const [viewMode, setViewMode] = useState('hallway'); // 'hallway' | 'focus' | 'lab'
    const [selectedStrain, setSelectedStrain] = useState(null);
    const [query, setQuery] = useState('');

    // Filters
    const [activeType, setActiveType] = useState('All'); // All, Indica, Sativa, Hybrid
    const [activeEffect, setActiveEffect] = useState(null); // Sleep, Pain, Creative, etc.

    const [filteredStrains, setFilteredStrains] = useState([]); // Initialize empty
    const [allStrains, setAllStrains] = useState([]); // Cache for client-side search if list isn't huge
    const [isLoading, setIsLoading] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [nearbyDispensaries, setNearbyDispensaries] = useState([]);

    const [isResearching, setIsResearching] = useState(false);
    const [newStrainForm, setNewStrainForm] = useState({ name: '', company: '' });

    // Fetch Strains from DB (with Filters)
    useEffect(() => {
        const fetchStrains = async () => {
            setIsLoading(true);
            let queryBuilder = supabase
                .from('strains')
                .select('*')
                .limit(100);

            // Apply Filters
            if (activeType !== 'All') {
                queryBuilder = queryBuilder.ilike('type', `%${activeType}%`);
            }

            // If we have an effect filter, we search description or effects column
            // Assuming 'effects' is an array column: .contains('effects', [activeEffect])
            // Or ilike description. Let's do simple text search for now to be safe.
            // Note: 'cs' is contains for arrays. If column is text array. 
            // If it's JSONB, utilize @> but straightforward text search is .textSearch usually.
            // Falling back to JS filter for effects if DB structure is complex, 
            // but let's try to fetch broadly then filter.
            // For now, we fetch broadly and filter client-side for effects.

            const { data, error } = await queryBuilder;

            if (data) {
                // Sort: Images first
                let sorted = data.sort((a, b) => {
                    const hasImageA = a.image_url && a.image_url.length > 5;
                    const hasImageB = b.image_url && b.image_url.length > 5;

                    if (hasImageA && !hasImageB) return -1;
                    if (!hasImageA && hasImageB) return 1;

                    // Randomize the rest to avoid boring A-Z every time?
                    // User asked to avoid strict A-Z wait.
                    // Let's shuffle slightly or use ID?
                    // Let's just stick to alphabetical fallback but randomize if no image?
                    // "The user has to wait... from a-z" suggests they want Variety.
                    return 0.5 - Math.random();
                });

                // Client-side Effect Filter (safer than guessing DB schema)
                if (activeEffect) {
                    sorted = sorted.filter(s =>
                        (s.effects && s.effects.includes(activeEffect)) ||
                        (s.description && s.description.toLowerCase().includes(activeEffect.toLowerCase()))
                    );
                }

                setAllStrains(sorted);
                setFilteredStrains(sorted);
            }
            setIsLoading(false);
        };
        fetchStrains();
    }, [activeType, activeEffect]); // Refetch when filters change

    // Search Logic (Debounced)
    useEffect(() => {
        const performSearch = async () => {
            if (query.trim().length === 0) {
                // Restore filters
                if (allStrains.length > 0) setFilteredStrains(allStrains);
                return;
            }

            // Local Search first (fast)
            const local = allStrains.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
            if (local.length > 0) {
                setFilteredStrains(local);
                if (query.length < 4) return;
            }

            // Deep Server Search
            const { data } = await supabase
                .from('strains')
                .select('*')
                .ilike('name', `%${query}%`)
                .limit(20);

            if (data) setFilteredStrains(data);
        };

        const timeout = setTimeout(performSearch, 300);
        return () => clearTimeout(timeout);
    }, [query, allStrains]);


    // --- Actions ---
    const handleRandom = () => {
        if (filteredStrains.length > 0) {
            const random = filteredStrains[Math.floor(Math.random() * filteredStrains.length)];
            setSelectedStrain(random);
            setViewMode('focus');
        }
    };

    const handleSelectStrain = (strain) => {
        setSelectedStrain(strain);
        setViewMode('focus');
    };

    const handleBackToHallway = () => {
        setSelectedStrain(null);
        setViewMode('hallway');
    };

    const handleFindNearby = async () => {
        if (!selectedStrain) return;

        setIsLoading(true); // Re-use loading state or add new one
        try {
            if (userLocation?.lat && userLocation?.lng) {
                const found = await getDispensariesWithStrain(selectedStrain.id, userLocation.lat, userLocation.lng);
                setNearbyDispensaries(found);
            } else {
                // Fallback to mock data if no location
                alert("Location not detected. Showing demo data.");
                const found = dispensariesData.slice(0, 3);
                setNearbyDispensaries(found);
            }
            setShowMap(true);
        } catch (err) {
            console.error(err);
            alert("Failed to locate dispensaries.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Lab Handlers (Simplified) ---
    const handleAddStrain = async (e) => {
        e.preventDefault();
        if (!newStrainForm.name) return;
        setIsResearching(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Login required");

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            // Enqueue Job
            const res = await fetch('/api/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'research_strain',
                    payload: {
                        strainName: newStrainForm.name,
                        companyName: newStrainForm.company
                    }
                })
            });

            if (!res.ok) throw new Error("Failed to queue research job.");
            const { msg_id } = await res.json();

            // Poll Loop
            let attempts = 0;
            let aiData = null;
            while (attempts < 30 && !aiData) { // 45s max
                await new Promise(r => setTimeout(r, 1500));
                const statusRes = await fetch(`/api/jobs?id=${msg_id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (statusRes.ok) {
                    const job = await statusRes.json();
                    if (job.status === 'completed') aiData = job.result;
                    else if (job.status === 'failed') throw new Error(job.error_message || "Analysis failed.");
                }
                attempts++;
            }

            if (!aiData) throw new Error("Research timed out.");

            await addXP(user.id, 150, 'Added new strain');
            alert(`Success! Added ${aiData.name}`);
            setNewStrainForm({ name: '', company: '' });
            setViewMode('hallway');
        } catch (err) {
            alert(err.message);
        } finally {
            setIsResearching(false);
        }
    };

    // --- Lab Handlers (Simplified) ---
    const handleSearch = async (e) => {
        e.preventDefault();
        // The useEffect above handles the actual search logic as query changes.
        // This handler just ensures we don't submit default form.
        if (!query.trim()) return;

        // If we have filtered results, select the first one on enter?
        if (filteredStrains.length > 0) {
            setSelectedStrain(filteredStrains[0]);
            setViewMode('focus');
        }
    };



    // --- Render ---
    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-slate-200">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/20 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
            </div>

            {/* Header / Nav */}
            <div className="absolute top-0 left-0 right-0 z-50 p-6 flex flex-col gap-4 bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent pb-12">

                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                        STRAINWISE <span className="text-slate-500 font-thin">ARCHIVES</span>
                    </h2>

                    <div className="flex items-center gap-4">
                        <form onSubmit={handleSearch} className="relative group hidden md:block">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative flex items-center bg-slate-900/80 border border-white/10 rounded-full px-4 py-2 ring-1 ring-white/5 group-focus-within:ring-emerald-500/50">
                                <Search className="w-4 h-4 text-slate-500 mr-2" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="bg-transparent border-none outline-none text-sm w-48 text-white placeholder-slate-600"
                                />
                            </div>
                        </form>

                        <button
                            onClick={handleRandom}
                            className="p-2 rounded-full bg-slate-900/50 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-colors border border-white/5"
                            title="Feeling Lucky?"
                        >
                            <Sparkles className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setViewMode(viewMode === 'lab' ? 'hallway' : 'lab')}
                            className="p-2 rounded-full bg-slate-900/50 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors border border-white/5"
                            title="Enter the Lab"
                        >
                            <FlaskConical className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 md:gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {['All', 'Indica', 'Sativa', 'Hybrid'].map(type => (
                        <button
                            key={type}
                            onClick={() => { setActiveType(type); setActiveEffect(null); }}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeType === type
                                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                    : 'bg-slate-900/50 text-slate-500 border border-white/5 hover:text-emerald-400'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                    <div className="w-px h-6 bg-slate-800 mx-2 hidden md:block" />
                    {['Sleep', 'Pain', 'Creative', 'Focus', 'Energy'].map(effect => (
                        <button
                            key={effect}
                            onClick={() => { setActiveEffect(activeEffect === effect ? null : effect); }} // Toggle
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap flex items-center gap-1 ${activeEffect === effect
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                    : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-600'
                                }`}
                        >
                            {activeEffect === effect && <Activity className="w-3 h-3" />}
                            {effect}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <AnimatePresence mode="wait">

                {/* 1. HALLWAY VIEW (Infinite Carousel) */}
                {viewMode === 'hallway' && (
                    <div className="relative z-10 w-full h-full flex items-center overflow-hidden group">
                        {/* Gradient Masks for smooth fade out at edges */}
                        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-20" />
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-20" />

                        <div
                            className="flex gap-12 items-center animate-marquee group-hover:slow-down will-change-transform"
                            style={{
                                width: "fit-content",
                                paddingLeft: "50vw",
                                animationDuration: `${Math.max(120, filteredStrains.length * 40)}s`
                            }}
                        >
                            {/* Duplicate list for seamless loop if we have enough items, otherwise just center */}
                            {[...filteredStrains, ...filteredStrains, ...filteredStrains].map((strain, index) => (
                                <StrainCard3D
                                    key={`${strain.id}-${index}`}
                                    strain={strain}
                                    onClick={() => handleSelectStrain(strain)}
                                />
                            ))}

                            {filteredStrains.length === 0 && (
                                <div className="text-slate-500 text-lg w-96 text-center">
                                    No strains found. Check spelling or visit the Lab.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. FOCUS VIEW (The Brain) */}
                {viewMode === 'focus' && selectedStrain && (

                    <motion.div
                        key="focus"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12 overflow-y-auto"
                    >
                        <button
                            onClick={handleBackToHallway}
                            className="absolute top-8 left-8 z-50 text-slate-400 hover:text-white flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full border border-white/5 transition-all hover:bg-emerald-500/20"
                        >
                            <ArrowRight className="w-5 h-5 rotate-180" /> Back to Archives
                        </button>

                        <div className="max-w-5xl w-full grid md:grid-cols-[400px_1fr] gap-12 items-center">
                            {/* Left: Visual */}
                            <motion.div
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="relative aspect-square rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group bg-slate-900"
                            >
                                <OptimizedImage
                                    src={getStrainImageUrl(selectedStrain)}
                                    alt={selectedStrain.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-transparent" />

                                <div className="absolute bottom-6 left-6">
                                    <div className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border bg-black/50 backdrop-blur-md ${selectedStrain.type.includes('Sativa') ? 'border-orange-500/50 text-orange-400' : 'border-purple-500/50 text-purple-400'}`}>
                                        {selectedStrain.type}
                                    </div>
                                    <h1 className="text-4xl font-black text-white leading-none mb-1">{selectedStrain.name}</h1>
                                    <div className="flex gap-2">
                                        {selectedStrain.effects?.slice(0, 3).map(e => (
                                            <span key={e} className="text-xs font-medium text-slate-300">#{e}</span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Right: Data */}
                            <motion.div
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h3 className="text-emerald-400 font-mono text-sm mb-2">/// GENETIC DATA</h3>
                                    <p className="text-xl leading-relaxed text-slate-300 font-light">
                                        {selectedStrain.description || "A mysterious strain with potent effects..."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                                            <Activity className="w-4 h-4" /> THC
                                        </div>
                                        <div className="text-3xl font-bold text-white">{selectedStrain.thc}</div>
                                    </div>
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                                            <Dna className="w-4 h-4" /> Lineage
                                        </div>
                                        <div className="text-lg font-bold text-white truncate">{selectedStrain.lineage || "Unknown"}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-slate-400 font-bold uppercase text-xs tracking-wider">
                                        <Droplet className="w-4 h-4" /> Terpene Profile
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStrain.terpenes?.map(t => (
                                            <span key={t} className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-sm">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button
                                        onClick={handleFindNearby}
                                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform hover:scale-[1.02]"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <MapPin className="w-5 h-5" /> Locate Nearby
                                        </div>
                                    </button>
                                    <button className="px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/5 transition-colors">
                                        <Sparkles className="w-5 h-5" /> Gen Art
                                    </button>
                                </div>

                                {/* Integrated Reviews */}
                                <div className="pt-8 border-t border-white/5">
                                    <StrainReviews strainName={selectedStrain.name} />
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {/* 3. LAB VIEW (Simplified) */}
                {viewMode === 'lab' && (
                    <motion.div
                        key="lab"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-40 bg-slate-950 flex items-center justify-center p-4"
                    >
                        <button
                            onClick={handleBackToHallway}
                            className="absolute top-8 right-8 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="max-w-md w-full text-center space-y-8">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FlaskConical className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h2 className="text-4xl font-black text-white">The Discovery Lab</h2>
                            <p className="text-slate-400">Identify and archive unknown strains using our AI Researcher.</p>

                            <form onSubmit={handleAddStrain} className="space-y-4 text-left">
                                <input
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:border-emerald-500 outline-none"
                                    placeholder="Strain Name (e.g. Alien Cookies)"
                                    value={newStrainForm.name}
                                    onChange={e => setNewStrainForm({ ...newStrainForm, name: e.target.value })}
                                />
                                <button
                                    disabled={isResearching}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold py-4 rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                                >
                                    {isResearching ? "Synthesizing Data..." : "Run Analysis & Archive"}
                                </button>
                            </form>
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
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => setShowMap(false)}
                    >
                        <div className="w-full max-w-4xl h-[80vh] bg-slate-900 rounded-3xl overflow-hidden relative border border-slate-800" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setShowMap(false)} className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full"><X /></button>
                            <DispensaryMap dispensaries={nearbyDispensaries} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Sub-Components ---

const StrainCard3D = ({ strain, onClick }) => {
    return (
        <motion.div
            layoutId={`card-${strain.id}`}
            onClick={onClick}
            whileHover={{ scale: 1.1, y: -20, rotateY: 5 }}
            className="flex-shrink-0 w-72 h-96 relative group cursor-pointer perspective-1000"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black rounded-3xl border border-white/10 shadow-2xl overflow-hidden transform transition-transform duration-500 hover:shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                {/* Image Background */}
                <div className="absolute inset-0 opacity-100 transition-transform duration-700 group-hover:scale-110">
                    <OptimizedImage
                        src={getStrainImageUrl(strain)}
                        alt={strain.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Gradient Overlay - Subtle at bottom for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 p-6 w-full">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-2 block">
                        {strain.type}
                    </span>
                    <h3 className="text-3xl font-black text-white leading-none mb-1 group-hover:text-emerald-300 transition-colors">
                        {strain.name}
                    </h3>
                    <div className="h-1 w-12 bg-emerald-500 rounded-full my-3 group-hover:w-full transition-all duration-500" />
                    <p className="text-xs text-slate-400 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100 transform translate-y-4 group-hover:translate-y-0">
                        {strain.description}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default StrainLibrary;
