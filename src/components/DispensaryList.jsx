import React, { useState, useEffect } from 'react';
import { MapPin, Star, Search, Globe, ChevronDown, ExternalLink, Phone, Building2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import posthog, { analytics } from '../lib/analytics';
import ClaimBusinessModal from './ClaimBusinessModal';
import { useUserStore } from '../lib/stores/user.store';

const DispensaryList = () => {
    const [dispensaries, setDispensaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);

    // Filters
    const [selectedCountry, setSelectedCountry] = useState('All');
    const [selectedCity, setSelectedCity] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [claimingDispensary, setClaimingDispensary] = useState(null);
    const user = useUserStore((state) => state.user);

    useEffect(() => {
        fetchDispensaries();
    }, []);

    // Analytics: Track Filter Changes
    useEffect(() => {
        if (selectedCountry !== 'All') {
            posthog.capture('dispensary_filter_country', { country: selectedCountry });
        }
    }, [selectedCountry]);

    useEffect(() => {
        if (selectedCity !== 'All') {
            posthog.capture('dispensary_filter_city', { city: selectedCity, country: selectedCountry });
        }
    }, [selectedCity]);

    // Analytics: Track Search (Debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.length > 2) {
                posthog.capture('dispensary_search', { query: searchQuery });
            }
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const fetchDispensaries = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('dispensaries')
            .select('*')
            .order('is_featured', { ascending: false })
            .order('name');

        if (data) {
            setDispensaries(data);

            // Extract unique options
            const uniqueCountries = [...new Set(data.map(d => d.country).filter(Boolean))].sort();
            setCountries(['All', ...uniqueCountries]);

            const uniqueCities = [...new Set(data.map(d => d.city || d.region).filter(Boolean))].sort();
            setCities(['All', ...uniqueCities]);
        }
        setLoading(false);
    };

    // Derived state for filtering
    const filteredDispensaries = dispensaries.filter(d => {
        const matchesCountry = selectedCountry === 'All' || d.country === selectedCountry;
        const matchesCity = selectedCity === 'All' || (d.city === selectedCity) || (d.region === selectedCity);
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.address.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCountry && matchesCity && matchesSearch;
    });

    // Dynamic city options based on selected country
    const availableCities = selectedCountry === 'All'
        ? cities
        : ['All', ...new Set(dispensaries.filter(d => d.country === selectedCountry).map(d => d.city || d.region).filter(Boolean))].sort();

    return (
        <div className="max-w-7xl mx-auto p-6 min-h-[calc(100vh-100px)]">
            {/* Header & Filters */}
            <div className="mb-8 space-y-6">
                <div>
                    <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <Globe className="w-8 h-8 text-emerald-400" />
                        Global Dispensary Directory
                    </h2>
                    <p className="text-slate-400 max-w-2xl">
                        Discover verified medical cannabis clinics, pharmacies, and dispensaries across regulated markets.
                    </p>
                </div>

                <div className="bg-slate-900/50 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center shadow-xl">
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by name or address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                        />
                    </div>

                    {/* Country Filter */}
                    <div className="relative w-full md:w-48">
                        <div className="relative">
                            <select
                                value={selectedCountry}
                                onChange={(e) => { setSelectedCountry(e.target.value); setSelectedCity('All'); }}
                                className="w-full appearance-none bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 font-medium cursor-pointer"
                            >
                                {countries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                    </div>

                    {/* City Filter */}
                    <div className="relative w-full md:w-48">
                        <div className="relative">
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="w-full appearance-none bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 font-medium cursor-pointer"
                                disabled={availableCities.length <= 1}
                            >
                                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                </div>
            ) : filteredDispensaries.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <AnimatePresence>
                        {filteredDispensaries.map((d, i) => (
                            <motion.div
                                key={d.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2, delay: i * 0.05 }}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all group flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                            {d.country === 'Australia' && '🇦🇺'}
                                            {d.country === 'Canada' && '🇨🇦'}
                                            {d.country === 'United Kingdom' && '🇬🇧'}
                                            {d.country === 'Germany' && '🇩🇪'}
                                            {d.country === 'Thailand' && '🇹🇭'}
                                            {d.country} • {d.city || d.region}
                                        </div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                                            {d.name}
                                        </h3>
                                    </div>
                                    {d.is_featured ? (
                                        <div className="bg-emerald-500 text-slate-950 px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter">
                                            <Sparkles className="w-3 h-3 fill-current" /> Promoted
                                        </div>
                                    ) : d.rating && (
                                        <div className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold">
                                            <Star className="w-3 h-3 fill-current" /> {d.rating}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 mb-6 flex-grow">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-300 text-sm leading-relaxed">{d.address}</span>
                                    </div>
                                    {d.phone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-5 h-5 text-slate-500 shrink-0" />
                                            <span className="text-slate-300 text-sm">{d.phone}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-white/5 flex gap-3">
                                    <button
                                        onClick={() => {
                                            if (selectedCountry !== 'All') { // Optional: track region context
                                                posthog.capture('dispensary_directions_click', { dispensary: d.name, country: d.country });
                                            } else {
                                                posthog.capture('dispensary_directions_click', { dispensary: d.name });
                                            }
                                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.name + ' ' + d.address)}`, '_blank')
                                        }}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <MapPin className="w-4 h-4" /> Directions
                                    </button>
                                    {d.website && (
                                        <button
                                            onClick={() => {
                                                posthog.capture('dispensary_website_click', { dispensary: d.name, url: d.website });
                                                window.open(d.website, '_blank');
                                            }}
                                            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-all"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Claim Business Badge */}
                                <div className="mt-4 pt-3 border-t border-white/5 mx-[-1.5rem] px-6 text-center">
                                    <button
                                        onClick={() => {
                                            analytics.track('claim_business_click', { dispensary: d.name });
                                            setClaimingDispensary(d);
                                        }}
                                        className="text-[10px] uppercase font-bold text-slate-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5 w-full py-1"
                                    >
                                        <Building2 className="w-3 h-3" />
                                        Is this your business? <span className="underline">{d.is_featured ? 'Manage Listing' : 'Claim & Boost Now'}</span>
                                    </button>
                                    {!d.is_featured && (
                                        <button
                                            onClick={() => {
                                                analytics.track('boost_listing_click', { dispensary: d.name });
                                                window.open(`https://buy.stripe.com/4gM00l3VqexX5pwe0l3Ru00?client_reference_id=${d.id}&prefilled_email=${user?.email || ''}`, '_blank');
                                            }}
                                            className="mt-2 text-[9px] font-black text-emerald-400/60 hover:text-emerald-400 transition-all uppercase tracking-widest flex items-center justify-center gap-1"
                                        >
                                            <Sparkles className="w-2.5 h-2.5" /> Boost visibility for $49/mo
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                    <Globe className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-400 mb-2">No Locations Found</h3>
                    <p className="text-slate-500">Try adjusting your filters or search query.</p>
                </div>
            )}

            {claimingDispensary && (
                <ClaimBusinessModal
                    dispensary={claimingDispensary}
                    onClose={() => setClaimingDispensary(null)}
                />
            )}
        </div>
    );
};

export default DispensaryList;
