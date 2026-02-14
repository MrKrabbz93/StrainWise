import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Star, Tag, Heart, Share2, ExternalLink, Plus, Sparkles, Trophy, Crown, AlertTriangle } from 'lucide-react';
import posthog from '../lib/analytics';
import { getStrainImageUrl } from '../lib/images';
import Leaderboard from './Leaderboard';
import { addXP, XP_EVENTS } from '../lib/gamification';
import { useUIStore } from '../lib/stores/ui.store';

const CommunityFeed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [userPostsCount, setUserPostsCount] = useState(0);
    const navigate = useNavigate();
    const addNotification = useUIStore(state => state.addNotification);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
            await fetchFeed();
            if (user) {
                const { count } = await supabase
                    .from('strain_journals')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('is_public', true);
                setUserPostsCount(count || 0);
            }
        };
        init();
        posthog.capture('community_feed_view');
    }, []);

    const fetchFeed = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('strain_journals')
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        avatar_url,
                        xp,
                        rank
                    ),
                    likes:journal_likes (
                        user_id
                    )
                `)
                .eq('is_public', true)
                .neq('status', 'flagged')
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                const formatted = data.map(post => ({
                    ...post,
                    likesCount: post.likes?.length || 0,
                    isLiked: post.likes?.some(l => l.user_id === currentUser?.id)
                }));
                setPosts(formatted);
            }
        } catch (err) {
            console.error("Feed Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReport = async (postId) => {
        if (!currentUser) return alert("Sign in to report content.");
        const reason = prompt("Why are you reporting this post? (Spam, Harassment, Inaccurate info, etc.)");
        if (!reason) return;

        try {
            const { error } = await supabase.from('content_reports').insert([{
                reporter_id: currentUser.id,
                journal_id: postId,
                reason: reason
            }]);
            if (error) throw error;
            addNotification('Report submitted. Our pioneers will review it.', 'info');
        } catch (err) {
            alert("Failed to submit report.");
        }
    };

    const handleLike = async (postId, currentIsLiked) => {
        if (!currentUser) return alert("Sign in to like reviews.");

        const post = posts.find(p => p.id === postId);
        if (!post) return;

        setPosts(prev => prev.map(p =>
            p.id === postId
                ? { ...p, isLiked: !currentIsLiked, likesCount: p.likesCount + (currentIsLiked ? -1 : 1) }
                : p
        ));

        try {
            if (currentIsLiked) {
                await supabase.from('journal_likes')
                    .delete()
                    .eq('user_id', currentUser.id)
                    .eq('journal_id', postId);
            } else {
                await supabase.from('journal_likes')
                    .insert([{ user_id: currentUser.id, journal_id: postId }]);

                // Award XP to Author
                if (post.user_id && post.user_id !== currentUser.id) {
                    await addXP(post.user_id, XP_EVENTS.LIKE_RECEIVED, 'Received a Like');
                }
                addNotification('Vibe Spread! Author earned +5 XP.', 'success');
            }
        } catch (err) {
            console.error("Like Error:", err);
            setPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, isLiked: currentIsLiked, likesCount: p.likesCount + (currentIsLiked ? 1 : -1) }
                    : p
            ));
        }
    };

    const Spotlight = ({ users }) => (
        <div className="mb-16 grid md:grid-cols-3 gap-6">
            {users.slice(0, 3).map((u, i) => (
                <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative group bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 p-6 rounded-[2rem] overflow-hidden"
                >
                    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${i === 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {i === 0 ? <Crown className="w-16 h-16" /> : <Trophy className="w-12 h-12" />}
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl p-0.5 ${i === 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                            <div className="w-full h-full rounded-[0.9rem] overflow-hidden bg-slate-900">
                                <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                                {i === 0 ? '👑 Head Consultant' : 'Expert Pioneer'}
                            </div>
                            <h4 className="font-bold text-white text-lg">{u.username}</h4>
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <div className="text-xs font-bold text-slate-400">
                            {u.xp.toLocaleString()} <span className="text-[10px] text-slate-600">points</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${i === 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                            {u.rank}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
    const spotlightUsers = useMemo(() => {
        return posts.reduce((acc, p) => {
            if (p.profiles && !acc.find(u => u.id === (p.profiles.id || p.user_id))) {
                acc.push({ ...p.profiles, id: p.user_id });
            }
            return acc;
        }, []).sort((a, b) => b.xp - a.xp);
    }, [posts]);

    return (
        <div className="max-w-7xl mx-auto pt-12 pb-24 px-4">
            <div className="text-center mb-16">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6"
                >
                    <Users className="w-3 h-3" /> Live Feed
                </motion.div>
                <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter">
                    THE INNER <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">CIRCLE</span>
                </h1>
                <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto mb-12">
                    Global community reports from verified StrainWise users.
                </p>
            </div>

            {/* Spotlight Section */}
            {!loading && <Spotlight users={spotlightUsers} />}

            <div className="grid lg:grid-cols-12 gap-12">
                {/* Main Feed Column */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Onboarding / Welcome Card */}
                    {currentUser && userPostsCount === 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gradient-to-br from-emerald-600 to-cyan-700 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-emerald-500/20"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Sparkles className="w-32 h-32 text-white" />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black text-white mb-2 italic">Welcome to the Inner Circle!</h2>
                                <p className="text-white/80 font-medium mb-6 max-w-md">
                                    Your voice builds the encyclopedia. Share your first public report to earn **75 XP** and reach the next rank!
                                </p>
                                <button
                                    onClick={() => navigate('/strains')}
                                    className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Share My First Vibe
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                            <p className="text-slate-500 font-medium animate-pulse">Synchronizing Mycelium Network...</p>
                        </div>
                    ) : posts.length > 0 ? (
                        <div className="grid gap-8">
                            {posts.map((post, i) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.1, 0.5) }}
                                    className="group relative bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 shadow-2xl hover:shadow-emerald-500/5"
                                >
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700">
                                                            {post.profiles?.avatar_url ? (
                                                                <img src={post.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-cyan-600 text-white font-bold text-xl">
                                                                    {(post.profiles?.username || 'U').substring(0, 1).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-slate-900 rounded-full" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">
                                                            {post.profiles?.username || 'Anonymous Pioneer'}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono italic">
                                                                {post.profiles?.rank || 'Seedling'}
                                                                {post.profiles?.xp ? ` (${post.profiles.xp} XP)` : ''}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                                                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                                                    <span className="text-amber-400 font-black text-sm">{post.rating}.0</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1 block">Strain Report</span>
                                                    <h4 className="text-2xl font-bold text-white tracking-tight">{post.strain_name || 'Generic Hybrid'}</h4>
                                                </div>

                                                <p className="text-slate-300 text-lg leading-relaxed italic relative pl-4 border-l-2 border-slate-800">
                                                    "{post.review || post.notes || 'No notes shared for this session.'}"
                                                </p>

                                                {post.effects && post.effects.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-2">
                                                        {post.effects.map(effect => (
                                                            <span key={effect} className="text-[10px] font-bold bg-slate-800/80 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1">
                                                                <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                                                                {effect}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-8 flex items-center gap-6 border-t border-slate-800/50 pt-6">
                                                <button
                                                    onClick={() => handleLike(post.id, post.isLiked)}
                                                    className={`flex items-center gap-2 text-sm font-bold transition-all ${post.isLiked ? 'text-pink-500' : 'text-slate-400 hover:text-white'}`}
                                                >
                                                    <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current animate-bounce' : ''}`} />
                                                    {post.likesCount} {post.likesCount === 1 ? 'Vibe' : 'Vibes'}
                                                </button>
                                                <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white font-bold transition-all">
                                                    <Share2 className="w-5 h-5" /> Share
                                                </button>
                                                {currentUser && currentUser.id !== post.user_id && (
                                                    <button
                                                        onClick={() => handleReport(post.id)}
                                                        className="p-2 text-slate-700 hover:text-red-400 transition-colors"
                                                        title="Report Content"
                                                    >
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <div className="flex-1" />
                                                <Link
                                                    to={`/strain/${(post.strain_name || 'Generic Hybrid').toLowerCase().replace(/ /g, '-')}`}
                                                    className="text-xs text-slate-600 hover:text-emerald-400 transition-colors flex items-center gap-1 uppercase tracking-widest font-bold"
                                                >
                                                    View Strain <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="hidden md:block w-32 h-64 rounded-2xl overflow-hidden bg-slate-950/50 relative">
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950 animate-pulse" />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                                                    <Tag className="w-6 h-6 text-emerald-500/40" />
                                                </div>
                                                <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest vertical-text">Archived Entry</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-32 bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-800"
                        >
                            <Users className="w-20 h-20 text-slate-800 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-2">Network Quiet</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                No public activity detected. Be the first to share your experience with the Inner Circle.
                            </p>
                            <button
                                onClick={() => navigate('/strains')}
                                className="mt-8 px-8 py-3 bg-emerald-500 text-slate-950 font-bold rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10"
                            >
                                Share Your First Report
                            </button>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="sticky top-24">
                        <Leaderboard />

                        {/* Additional Growth Card */}
                        <div className="mt-8 bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Trophy className="w-32 h-32 text-emerald-500" />
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400" /> Mycelium Points
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                Every report you share helps the AI refine its guidance for everyone. Collect XP to unlock exclusive digital assets and early access features.
                            </p>
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-slate-500">Current Level progress</span>
                                    <span className="text-emerald-400">85%</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '85%' }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Refer & Earn Card */}
                        <div className="mt-8 bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden group shadow-2xl shadow-indigo-500/10">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all" />
                            <h4 className="text-xl font-black text-white mb-2 flex items-center gap-2 tracking-tighter italic">
                                GROW THE NETWORK
                            </h4>
                            <p className="text-sm text-indigo-100/70 mb-6">
                                Invite a fellow pioneer and earn <strong className="text-white">250 XP</strong> instantly when they join the Inner Circle.
                            </p>
                            <button
                                onClick={() => navigate('/profile')}
                                className="w-full py-3 bg-white text-indigo-950 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-400 hover:text-slate-950 transition-all shadow-lg"
                            >
                                Get Referral Link
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action CTA */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/strains')}
                className="fixed bottom-24 right-8 z-50 bg-emerald-500 text-slate-950 p-4 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.4)] flex items-center gap-2 group border-4 border-slate-950"
            >
                <Plus className="w-6 h-6" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap px-0 group-hover:px-2">
                    Share Experience
                </span>
            </motion.button>

            <style jsx>{`
                .vertical-text {
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                }
            `}</style>
        </div>
    );
};

export default CommunityFeed;
