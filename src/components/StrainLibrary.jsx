import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, FlaskConical, ArrowRight, Activity, Dna, Droplet, MapPin, Sparkles, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OptimizedImage from './optimized/OptimizedImage';
import StrainReviews from './StrainReviews';
import DispensaryMap from './DispensaryMap';
import { getStrainImageUrl } from '../lib/images';
import { getDispensariesWithStrain } from '../lib/services/dispensary.service';
import { addXP } from '../lib/gamification';
import dispensariesData from '../data/dispensaries.json';
const StrainLibrary = ({ userLocation, user }) => {
    const scrollRef = useRef(null); // Ref for carousel container
    const navigate = useNavigate();

    // --- State ---
    const [viewMode, setViewMode] = useState('hallway'); // 'hallway' | 'focus' | 'lab'
    const [selectedStrain, setSelectedStrain] = useState(null);
    const [query, setQuery] = useState('');
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const [isUserInteracting, setIsUserInteracting] = useState(false);

    // --- Auto-scroll Logic ---
    useEffect(() => {
        let animationFrameId;
        const scrollContainer = scrollRef.current;

        const scroll = () => {
            if (scrollContainer && !isUserInteracting && isAutoScrolling) {
                // Gentle auto-scroll (30fps equivalent speed)
                scrollContainer.scrollLeft += 1;

                // Reset if reached end (circular illusion handled by large padding or infinite list logic could be added)
                // For now, simpler: bounce back or just stop? Let's just scroll.
                if (scrollContainer.scrollLeft >= (scrollContainer.scrollWidth - scrollContainer.clientWidth)) {
                    scrollContainer.scrollLeft = 0; // Loop back to start
                }
            }
            animationFrameId = requestAnimationFrame(scroll);
        };

        if (isAutoScrolling) {
            animationFrameId = requestAnimationFrame(scroll);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [isAutoScrolling, isUserInteracting]);

    // Handle user interaction to pause auto-scroll
    const handleInteractionStart = () => {
        setIsUserInteracting(true);
        setIsAutoScrolling(false);
    };

    const handleInteractionEnd = () => {
        setIsUserInteracting(false);
        // Resume auto-scroll after a delay if desired, or keep it manual? 
        // User requested: "Auto-scroll should pause on user interaction". 
        // Let's resume after 3 seconds of inactivity
        setTimeout(() => setIsAutoScrolling(true), 3000);
    };

    // Manual Navigation
    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 350; // Approx card width + gap
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
            handleInteractionStart(); // Pause auto-scroll on manual nav
            handleInteractionEnd(); // Set resume timer
        }
    };

    // Filters

    const [activeEffect, setActiveEffect] = useState(null); // Sleep, Pain, Creative, etc.

    const [filteredStrains, setFilteredStrains] = useState([]); // Initialize empty
    const [allStrains, setAllStrains] = useState([]); // Cache for client-side search if list isn't huge
    const [isLoading, setIsLoading] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [nearbyDispensaries, setNearbyDispensaries] = useState([]);

    const [isResearching, setIsResearching] = useState(false);
    const [newStrainForm, setNewStrainForm] = useState({ name: '', company: '' });

    // Fetch Strains from DB (with Filters)
    // Fetch Strains from DB (with Filters)
    useEffect(() => {
        const fetchStrains = async () => {
            setIsLoading(true);
            try {
                let queryBuilder = supabase
                    .from('strains')
                    .select('*');

                // Let's simplified fetching: Fetch mostly everything (limit is high enough or pagination)

                // Apply Effect Filter (Server-Side) if user selected a specific effect
                if (activeEffect) {
                    if (['Indica', 'Sativa', 'Hybrid'].includes(activeEffect)) {
                        queryBuilder = queryBuilder.ilike('type', `%${activeEffect}%`);
                    } else {
                        queryBuilder = queryBuilder.contains('effects', [activeEffect]);
                    }
                }

                // Limit results
                queryBuilder = queryBuilder.limit(500);

                const { data, error } = await queryBuilder;

                if (error) throw error;

                if (data) {
                    // Filter out duplicates by name
                    const uniqueNames = new Set();
                    let processedData = data.filter(s => {
                        if (!s.name) return false;
                        const name = s.name.toLowerCase().trim();
                        if (uniqueNames.has(name)) return false;
                        uniqueNames.add(name);
                        return true;
                    });

                    // Sort: Always put excellent images first if possible, then alphabetical
                    processedData.sort((a, b) => {
                        const hasImageA = a.image_url && a.image_url.length > 10;
                        const hasImageB = b.image_url && b.image_url.length > 10;

                        // Prioritize images
                        if (hasImageA && !hasImageB) return -1;
                        if (!hasImageA && hasImageB) return 1;

                        return a.name.localeCompare(b.name);
                    });

                    setAllStrains(processedData);
                    setFilteredStrains(processedData);
                }
            } catch (err) {
                console.error("Error fetching strains:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStrains();
    }, [activeEffect]); // Refetch when filters change

    // Search Logic (Debounced)
    useEffect(() => {
        const performSearch = async () => {
            if (query.trim().length === 0) {
                // Restore filters
                if (allStrains.length > 0) {
                    setFilteredStrains(allStrains);
                }
                return;
            }

            // Local Search first (fast)
            let local = allStrains.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));



            if (local.length > 0) {
                setFilteredStrains(local);
                if (query.length < 4) return;
            }

            // Deep Server Search
            let queryBuilder = supabase
                .from('strains')
                .select('*')
                .ilike('name', `%${query}%`);

            const { data } = await queryBuilder.limit(20);

            if (data) {
                const uniqueNames = new Set();
                const uniqueData = data.filter(s => {
                    if (!s.name) return false;
                    const name = s.name.toLowerCase().trim();
                    if (uniqueNames.has(name)) return false;
                    uniqueNames.add(name);
                    return true;
                });
                setFilteredStrains(uniqueData);
            }
        };

        const timeout = setTimeout(performSearch, 300);
        return () => clearTimeout(timeout);
    }, [query, allStrains]);


    // --- Actions ---
    const handleRandom = () => {
        if (filteredStrains.length > 0) {
            const random = filteredStrains[Math.floor(Math.random() * filteredStrains.length)];
            const slug = random.name.toLowerCase().replace(/\s+/g, '-');
            navigate(`/strain/${slug}`);
        }
    };

    const handleSelectStrain = (strain) => {
        const slug = strain.name.toLowerCase().replace(/\s+/g, '-');
        navigate(`/strain/${slug}`);
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

                {/* Filter Tabs */}
                <div className="flex flex-col gap-4">


                    {/* Secondary Filters (Effects) */}
                    <div className="flex justify-center flex-wrap gap-2">
                        {['Indica', 'Sativa', 'Hybrid', 'Sleep', 'Pain', 'Creative', 'Energy'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => {
                                    // Complex filter logic could go here, for now just simple toggle support
                                    setActiveEffect(activeEffect === filter ? null : filter);
                                }}
                                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${activeEffect === filter
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                    : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-600'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <AnimatePresence mode="wait">

                {/* 1. HALLWAY VIEW (Scrollable Carousel) */}
                {viewMode === 'hallway' && (
                    <div
                        className="relative z-10 w-full h-full flex items-center group"
                        onMouseEnter={handleInteractionStart}
                        onMouseLeave={handleInteractionEnd}
                        onTouchStart={handleInteractionStart}
                        onTouchEnd={handleInteractionEnd}
                    >
                        {/* Gradient Masks */}
                        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-20 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-20 pointer-events-none" />

                        {/* Navigation Buttons (Visible on Hover/Interaction) */}
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-8 z-30 p-3 rounded-full bg-slate-900/50 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-500 hover:text-slate-900"
                        >
                            <ArrowRight className="w-6 h-6 rotate-180" />
                        </button>

                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-8 z-30 p-3 rounded-full bg-slate-900/50 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-500 hover:text-slate-900"
                        >
                            <ArrowRight className="w-6 h-6" />
                        </button>

                        {/* Scroll Container */}
                        <div
                            ref={scrollRef} // Attached ref
                            className="w-full h-full overflow-x-auto flex items-center gap-8 px-[50vw] pb-12 snap-x snap-mandatory custom-scrollbar"
                            style={{ scrollBehavior: isUserInteracting ? 'smooth' : 'auto' }} // Switch behavior for smooth drag vs linear auto-scroll
                        >
                            {filteredStrains.slice(0, 40).map((strain, index) => (
                                <div key={`${strain.id}-${index}`} className="snap-center shrink-0 perspective-1000">
                                    <StrainCard3D
                                        strain={strain}
                                        onClick={() => handleSelectStrain(strain)}
                                        containerRef={scrollRef}
                                    />
                                </div>
                            ))}

                            {filteredStrains.length === 0 && !isLoading && (
                                <div className="text-slate-500 text-lg w-96 text-center shrink-0 snap-center">
                                    No strains found. Check spelling or visit the Lab.
                                </div>
                            )}
                        </div>
                    </div>
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

const StrainCard3D = ({ strain, onClick, containerRef }) => {
    return (
        <motion.div
            onClick={onClick}
            initial={{ scale: 0.85, opacity: 0.5, rotateY: 15 }}
            whileInView={{ scale: 1.1, opacity: 1, rotateY: 0, y: -10 }}
            viewport={{ root: containerRef, margin: "0px -200px 0px -200px" }} // Triggers when element is in center zone
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            whileHover={{ scale: 1.15, y: -30, zIndex: 100 }}
            className="flex-shrink-0 w-72 h-96 relative group cursor-pointer perspective-1000 transition-all"
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
