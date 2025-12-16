import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, MapPin, Brain, Droplet, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStrainImageUrl } from '../lib/images';
import Layout from '../components/Layout'; // Assuming Layout handles navigation

const StrainPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [strain, setStrain] = useState(null);
    const [loading, setLoading] = useState(true);

    // Convert slug back to name (simple replacement for now)
    // In a real app, you'd store the 'slug' column in DB. 
    // For now, we try to match case-insensitive.
    const strainName = slug.replace(/-/g, ' ');

    useEffect(() => {
        async function fetchStrain() {
            const { data, error } = await supabase
                .from('strains')
                .select('*')
                .ilike('name', strainName)
                .maybeSingle();

            if (data) {
                setStrain(data);
            }
            setLoading(false);
        }
        fetchStrain();
    }, [strainName]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
                Loading Connoisseur Data...
            </div>
        );
    }

    if (!strain) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
                <h1 className="text-3xl font-bold text-white mb-4">Strain Not Found</h1>
                <p className="mb-8">This strain hasn't been archived yet.</p>
                <Link to="/consult" className="px-6 py-2 bg-emerald-500 text-slate-950 rounded-full font-bold">
                    Go Back
                </Link>
            </div>
        );
    }

    const imageSrc = getStrainImageUrl(strain);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            {/* Dynamic SEO Meta Strings (Simulated) */}
            {/* <title>{strain.name} Review | Effects, Terpenes & Price - StrainWise</title> */}

            <div className="relative w-full h-[50vh] md:h-[60vh]">
                <img
                    src={imageSrc}
                    alt={strain.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-7xl mx-auto">
                    <Link to="/consult" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="w-5 h-5" /> Back to Consultant
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-end gap-6"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${strain.type.toLowerCase().includes('sativa') ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' :
                                    strain.type.toLowerCase().includes('indica') ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' :
                                        'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                    }`}>
                                    {strain.type}
                                </span>
                                {strain.thc && <span className="text-emerald-400 font-mono font-bold">{strain.thc} THC</span>}
                            </div>
                            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-4">{strain.name}</h1>
                            <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">{strain.description}</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* Left Column: Data */}
                <div className="lg:col-span-2 space-y-12">

                    {/* Effects Section */}
                    <section>
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Brain className="w-6 h-6 text-emerald-500" /> Effects & Feelings
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {strain.effects?.map(effect => (
                                <div key={effect} className="p-4 bg-slate-900/50 border border-white/5 rounded-xl hover:border-emerald-500/30 transition-colors">
                                    <span className="text-slate-200 font-medium">{effect}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Terpenes Section */}
                    {strain.terpenes && (
                        <section>
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Droplet className="w-6 h-6 text-blue-500" /> Terpene Profile
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {strain.terpenes.map(terp => (
                                    <span key={terp} className="px-4 py-2 bg-blue-900/10 text-blue-300 border border-blue-500/20 rounded-lg">
                                        {terp}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Lineage Section */}
                    {strain.lineage && (
                        <section className="p-8 bg-slate-900 rounded-2xl border border-white/5">
                            <h3 className="text-xl font-bold text-white mb-2">Genetic Lineage</h3>
                            <p className="text-2xl text-emerald-400 font-serif italic">{strain.lineage}</p>
                        </section>
                    )}
                </div>

                {/* Right Column: CTA / Monetization Hook */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">

                        {/* Interactive Card */}
                        <div className="p-6 bg-slate-900 rounded-3xl border border-white/10 shadow-xl">
                            <h3 className="text-xl font-bold text-white mb-4">Find {strain.name} Nearby</h3>
                            <p className="text-sm text-slate-400 mb-6">
                                Join our network to view live inventory at verified dispensaries near you.
                            </p>
                            <button
                                onClick={() => navigate(`/dispensaries?strain=${encodeURIComponent(strain.name)}`)}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <MapPin className="w-5 h-5" /> Locate Stock
                            </button>
                            <p className="text-xs text-center text-slate-600 mt-4">Verified Members Only</p>
                        </div>

                        {/* AI Consultant Teaser */}
                        <div className="p-6 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-3xl border border-white/10">
                            <h3 className="text-xl font-bold text-white mb-2">Is this right for you?</h3>
                            <p className="text-sm text-slate-300 mb-6">
                                Ask our AI Sommelier if {strain.name} matches your tolerance and medical needs.
                            </p>
                            <button
                                onClick={() => navigate(`/consult?strain=${encodeURIComponent(strain.name)}`)}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                            >
                                Ask AI Consultant
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default StrainPage;
