import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Star, MessageSquareQuote, ThumbsUp, Tag } from 'lucide-react';
import posthog from '../lib/analytics';

const CommunityFeed = () => {
    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeed();
        posthog.capture('community_feed_view');
    }, []);

    const fetchFeed = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('strain_journals')
            .select(`
                id,
                rating,
                review,
                effects,
                created_at,
                is_public,
                strain_name,
                user_id
            `)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setJournals(data);
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto pt-8">
            <div className="text-center mb-10">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                    Community Voices
                </h1>
                <p className="text-slate-400 text-lg">
                    Real experiences from the Inner Circle.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                </div>
            ) : journals.length > 0 ? (
                <div className="grid gap-6">
                    {journals.map((post, i) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm hover:border-purple-500/20 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                                        {post.user_id ? post.user_id.substring(0, 2).toUpperCase() : 'AN'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-200 text-lg">{post.strain_name || 'Unknown Strain'}</h3>
                                        <p className="text-xs text-slate-500">{new Date(post.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
                                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                                    <span className="text-amber-400 font-bold">{post.rating}</span>
                                </div>
                            </div>

                            <div className="pl-14">
                                <p className="text-slate-300 italic mb-4 leading-relaxed relative">
                                    <MessageSquareQuote className="absolute -left-8 top-0 w-6 h-6 text-slate-700" />
                                    "{post.review}"
                                </p>

                                {post.effects && post.effects.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {Array.isArray(post.effects) && post.effects.map(effect => (
                                            <span key={effect} className="text-xs font-semibold bg-purple-500/10 text-purple-300 px-2 py-1 rounded-md flex items-center gap-1">
                                                <Tag className="w-3 h-3" />
                                                {effect}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                    <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-400 mb-2">No Public Journals Yet</h3>
                    <p className="text-slate-500">Be the first to share your experience by setting your journal entry to "Public".</p>
                </div>
            )}
        </div>
    );
};

export default CommunityFeed;
