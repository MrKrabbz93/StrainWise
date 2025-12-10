import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Heart, LogOut, Loader2, Mail, Users, Globe, Lock, Edit2, Save, Briefcase, ShieldCheck, Sparkles, RefreshCw, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateImage } from '../lib/gemini';
import { RANKS } from '../lib/gamification';

const UserProfile = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('favorites');
    const [favorites, setFavorites] = useState([]);
    const [messages, setMessages] = useState([]);
    const [community, setCommunity] = useState([]);
    const [activityFeed, setActivityFeed] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        username: '',
        bio: '',
        avatar_url: '',
        interests: '',
        avatar_prompt: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);

            // Fetch Favorites
            const { data: favs } = await supabase.from('favorites').select('*').eq('user_id', user.id);
            if (favs) setFavorites(favs);

            // Fetch Messages
            const { data: msgs } = await supabase.from('messages').select('*').eq('user_id', user.id);
            if (msgs) setMessages(msgs);

            // Fetch My Profile
            const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', user.id);
            if (myProfile && myProfile[0]) {
                setProfile(myProfile[0]);
                setEditForm({
                    username: myProfile[0].username || '',
                    bio: myProfile[0].bio || '',
                    avatar_url: myProfile[0].avatar_url || '',
                    interests: myProfile[0].interests || '',
                    avatar_prompt: ''
                });
            }

            // Fetch Community (Public Profiles)
            const { data: publicUsers } = await supabase.from('profiles').select('*').eq('is_public', true).limit(10);
            if (publicUsers) setCommunity(publicUsers.filter(p => p.id !== user.id));

            // Fetch Activity Feed
            const { data: activities } = await supabase.from('community_activity').select('*').order('created_at', { ascending: false }).limit(20);
            if (activities) setActivityFeed(activities);

            setLoading(false);
        };

        fetchData();
    }, [user, activeTab]);

    const togglePublicProfile = async () => {
        if (!profile) return;
        const newValue = !profile.is_public;
        setProfile({ ...profile, is_public: newValue });
        await supabase.from('profiles').update({ is_public: newValue }).eq('id', user.id);
    };

    const handleSaveProfile = async () => {
        // Prepare the payload
        const updates = {
            id: user.id, // RLS requires ID match
            username: editForm.username,
            bio: editForm.bio,
            avatar_url: editForm.avatar_url,
            interests: editForm.interests,
            updated_at: new Date()
        };

        // UPSERT: Create if new, Update if exists
        const { error } = await supabase.from('profiles').upsert(updates);

        if (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile. Please try again.");
        } else {
            setProfile({ ...profile, ...updates });
            setIsEditing(false);
            // alert("Profile saved successfully!"); // Optional: Toast notification
        }
    };

    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

    const generateAvatar = async () => {
        setIsGeneratingAvatar(true);
        const seed = editForm.avatar_prompt || editForm.username || "Cannabis Connoisseur";
        // Call Gemini Imagen (Nano Banana Style)
        const imageUrl = await generateImage(seed);
        setEditForm({ ...editForm, avatar_url: imageUrl });
        setIsGeneratingAvatar(false);
    };

    const handleSponsorship = async (tier) => {
        alert(`Initiating ${tier} sponsorship flow... (Demo)`);
        // In real app, trigger Stripe/Payment here
        const updates = {
            account_type: tier,
            subscription_status: 'active'
        };
        setProfile({ ...profile, ...updates });
        await supabase.from('profiles').update(updates).eq('id', user.id);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        onLogout();
    };

    if (!user) return null;

    return (
        <div className="max-w-5xl mx-auto p-6">
            {/* Header */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between backdrop-blur-sm gap-6 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="flex items-center gap-6 relative z-10">
                    <div className="relative">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/20" />
                        ) : (
                            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 text-4xl font-bold shadow-lg shadow-emerald-500/20">
                                {user.email[0].toUpperCase()}
                            </div>
                        )}
                        {profile?.account_type && profile.account_type !== 'user' && (
                            <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-900 shadow-sm flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                {profile.account_type === 'small_business' ? 'PARTNER' : 'SPONSOR'}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-3xl font-bold text-white">
                                {isEditing ? 'Editing Profile' : 'My Profile'}
                            </h2>
                            {!isEditing && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors bg-white/5 rounded-lg">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    {/* Rank Badge */}
                                    {profile?.rank && (
                                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2" title={`Current XP: ${profile.xp || 0}`}>
                                            <span className="text-xl">{RANKS.find(r => r.name === profile.rank)?.icon || '🌱'}</span>
                                            <span className="text-sm font-bold text-emerald-400 uppercase tracking-wide">{profile.rank}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-slate-400 text-lg">{user.email}</p>

                        {!isEditing && profile && (
                            <div className="mt-4 w-full max-w-xs">
                                <div className="flex justify-between text-xs text-slate-500 mb-1 font-bold uppercase tracking-wider">
                                    <span>XP Progress</span>
                                    <span>{profile.xp || 0} / {RANKS.find(r => (profile.xp || 0) < r.minXP)?.minXP || 'MAX'}</span>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500"
                                        style={{ width: `${Math.min(100, ((profile.xp || 0) / (RANKS.find(r => (profile.xp || 0) < r.minXP)?.minXP || 5000)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {!isEditing && profile?.bio && (
                            <p className="text-slate-300 mt-2 text-sm max-w-md italic">"{profile.bio}"</p>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                            <span className={`w-2 h-2 rounded-full ${profile?.is_public ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            <span className="text-xs text-slate-500 uppercase tracking-wider">
                                {profile?.is_public ? 'Public Profile' : 'Private Profile'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 relative z-10">
                    <div className="flex gap-3">
                        <button
                            onClick={togglePublicProfile}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${profile?.is_public
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                                }`}
                        >
                            {profile?.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            {profile?.is_public ? 'Public' : 'Private'}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Mode */}
            {isEditing && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-6 mb-8 backdrop-blur-sm"
                >
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Edit2 className="w-5 h-5 text-emerald-400" />
                        Customize Your Identity
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Username</label>
                            <input
                                type="text"
                                value={editForm.username}
                                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                placeholder="@username"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">AI Avatar Generator</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={editForm.avatar_prompt}
                                    onChange={(e) => setEditForm({ ...editForm, avatar_prompt: e.target.value })}
                                    placeholder="Prompt: e.g. 'Cyberpunk Wizard'"
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none"
                                />
                                <button
                                    onClick={generateAvatar}
                                    className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                                    title="Generate New Avatar"
                                    disabled={isGeneratingAvatar}
                                >
                                    {isGeneratingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-500">Enter a prompt and click sparkles to generate a unique avatar.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Medicinal Interests</label>
                            <input
                                type="text"
                                value={editForm.interests}
                                onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                                placeholder="e.g. Insomnia, Anxiety, CBD-only"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none"
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Bio</label>
                            <textarea
                                value={editForm.bio}
                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                placeholder="Tell the community about your journey..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none h-24 resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                        <button onClick={handleSaveProfile} className="px-6 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 flex items-center gap-2">
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-white/5 pb-4 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('favorites')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'favorites' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <Heart className="w-4 h-4" /> Favorites
                </button>
                <button
                    onClick={() => setActiveTab('inbox')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'inbox' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <Mail className="w-4 h-4" /> Inbox
                    {messages.length > 0 && <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-1.5 rounded-full">{messages.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('community')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'community' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <Users className="w-4 h-4" /> Community
                </button>
                <button
                    onClick={() => setActiveTab('sponsorship')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'sponsorship' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-amber-400'
                        }`}
                >
                    <Briefcase className="w-4 h-4" /> Sponsorship
                </button>
                <button
                    onClick={() => setActiveTab('system')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'system' ? 'bg-slate-700 text-white border border-slate-600' : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <Activity className="w-4 h-4" /> System Health
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : (
                <div className="min-h-[300px]">
                    {activeTab === 'favorites' && (
                        favorites.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {favorites.map((fav, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all group"
                                    >
                                        <div className={`h-32 w-full relative overflow-hidden bg-gradient-to-br ${fav.visual_profile === 'purple' ? 'from-purple-900 to-slate-950' :
                                            fav.visual_profile === 'orange' ? 'from-orange-900 to-slate-950' :
                                                'from-emerald-900 to-slate-950'
                                            }`}>
                                            <div className="absolute inset-0 bg-black/20" />
                                            <div className="absolute bottom-4 left-4">
                                                <h4 className="text-lg font-bold text-white">{fav.strain_name}</h4>
                                                <span className="text-xs text-slate-300 uppercase tracking-wider">{fav.type}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                                <Heart className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500">No favorite strains yet.</p>
                            </div>
                        )
                    )}

                    {activeTab === 'inbox' && (
                        messages.length > 0 ? (
                            <div className="space-y-4">
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/30 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-lg font-bold text-white">{msg.subject}</h4>
                                            <span className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-bold uppercase tracking-wider">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            From: {msg.sender}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                                <Mail className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500">Your inbox is empty.</p>
                            </div>
                        )
                    )}

                    {activeTab === 'community' && (
                        <div>
                            <div className="mb-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-3">
                                <Users className="w-5 h-5 text-emerald-400 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-400 mb-1">Community Hub</h4>
                                    <p className="text-xs text-slate-400">
                                        Recent activity from the inner circle. Contribute data to earn XP and Ranks.
                                    </p>
                                </div>
                            </div>

                            {/* Activity Feed */}
                            {activityFeed.length > 0 && (
                                <div className="mb-8 space-y-3">
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Live Activity</h4>
                                    {activityFeed.map((activity) => (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-slate-900/50 border border-white/5 p-3 rounded-lg flex items-center gap-3 text-sm text-slate-300"
                                        >
                                            <div className="p-2 bg-slate-800 rounded-full">
                                                {activity.type === 'rank_up' ? '🏆' : activity.type === 'new_strain' ? '🧬' : '💬'}
                                            </div>
                                            <div>
                                                {activity.content}
                                                <div className="text-[10px] text-slate-500 mt-0.5">{new Date(activity.created_at).toLocaleTimeString()}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {community.length > 0 ? (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {community.map((member, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-white/10 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                {member.avatar_url ? (
                                                    <img src={member.avatar_url} alt="User" className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-bold">
                                                        {member.email[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="text-sm font-bold text-white">{member.email.split('@')[0]}</h4>
                                                    {member.bio && <p className="text-xs text-slate-500 truncate max-w-[150px]">{member.bio}</p>}
                                                </div>
                                            </div>
                                            <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-white rounded-lg transition-colors">
                                                Connect
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                                    <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                    <p className="text-slate-500">No public members found yet.</p>
                                    <p className="text-slate-600 text-sm mt-2">Be the first to go public!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'sponsorship' && (
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Small Business */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col hover:border-emerald-500/30 transition-all">
                                <div className="mb-4">
                                    <h4 className="text-xl font-bold text-white">Small Business</h4>
                                    <p className="text-slate-400 text-sm">Pharmacies & Dispensaries</p>
                                </div>
                                <div className="text-3xl font-bold text-emerald-400 mb-6">$49<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Verified Partner Badge</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Priority Listing</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Community Support</li>
                                </ul>
                                <button
                                    onClick={() => handleSponsorship('small_business')}
                                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
                                >
                                    Partner with Us
                                </button>
                            </div>

                            {/* Corporate */}
                            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-xl p-6 flex flex-col relative overflow-hidden transform hover:scale-105 transition-all shadow-2xl">
                                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                                <div className="mb-4">
                                    <h4 className="text-xl font-bold text-white">Corporate</h4>
                                    <p className="text-slate-400 text-sm">Large Scale Operations</p>
                                </div>
                                <div className="text-3xl font-bold text-amber-400 mb-6">$9,999<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="w-4 h-4 text-amber-500" /> Exclusive Rights</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="w-4 h-4 text-amber-500" /> Global Reach</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="w-4 h-4 text-amber-500" /> Executive Support</li>
                                </ul>
                                <button
                                    onClick={() => handleSponsorship('corporate')}
                                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors"
                                >
                                    Sponsor Now
                                </button>
                            </div>

                            {/* Government */}
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col opacity-80 hover:opacity-100 transition-all">
                                <div className="mb-4">
                                    <h4 className="text-xl font-bold text-white">Government</h4>
                                    <p className="text-slate-400 text-sm">State & Federal Contracts</p>
                                </div>
                                <div className="text-3xl font-bold text-white mb-6">MAX<span className="text-sm text-slate-500 font-normal"> payable</span></div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="w-4 h-4 text-slate-500" /> Full Compliance Suite</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="w-4 h-4 text-slate-500" /> Data Sovereignty</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="w-4 h-4 text-slate-500" /> Public Sector Badge</li>
                                </ul>
                                <button
                                    onClick={() => handleSponsorship('government')}
                                    className="w-full py-3 border border-white/20 hover:bg-white/5 text-white font-bold rounded-lg transition-colors"
                                >
                                    Contact Sales
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Activity className="w-6 h-6 text-emerald-400" /> System Diagnostics</h4>

                            <div className="space-y-4">
                                {/* Supabase Status */}
                                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${!supabase.auth.signInWithPassword.toString().includes('mock') ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                                        <div>
                                            <div className="font-bold text-slate-200">Supabase Connection</div>
                                            <div className="text-xs text-slate-500">{!supabase.auth.signInWithPassword.toString().includes('mock') ? 'Live (Connected to Project)' : 'Mock Mode (Keys Missing?)'}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-slate-400">auth.users</span>
                                </div>

                                {/* Gemini Status */}
                                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${import.meta.env.VITE_GEMINI_API_KEY ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                                        <div>
                                            <div className="font-bold text-slate-200">Gemini AI Client</div>
                                            <div className="text-xs text-slate-500">{import.meta.env.VITE_GEMINI_API_KEY ? 'API Key Present' : 'Missing VITE_GEMINI_API_KEY'}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-slate-400">gemini-1.5-flash</span>
                                </div>

                                <div className="p-4 bg-emerald-500/5 text-emerald-400 text-xs rounded-lg border border-emerald-500/10 mb-4">
                                    ℹ️ <strong>Environment Check:</strong> If status is yellow/red, check Vercel Project Settings &gt; Environment Variables. Redeploy after changes.
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await fetch('/api/gemini', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ type: 'health' })
                                            });
                                            const data = await res.json();
                                            const modelsStr = Array.isArray(data.availableModels) ? data.availableModels.join('\n- ') : 'N/A';
                                            alert(`Server Diagnostics:\nTime: ${new Date().toLocaleTimeString()}\nStatus: ${data.status}\nKey Configured: ${data.keyConfigured}\nRegion: ${data.serverLocation}\n\nAvailable Models (${data.availableModels?.length || 0}):\n- ${modelsStr}`);
                                        } catch (e) {
                                            alert("Connection Failed: " + e.message);
                                        }
                                    }}
                                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                                >
                                    🔍 Test Server Connection
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserProfile;
