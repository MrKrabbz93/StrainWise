import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { User, Heart, LogOut, Loader2, Mail, Users, Globe, Lock, Edit2, Save, Briefcase, Sparkles, RefreshCw, Activity, Bell, Upload, ChevronRight, Trash2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getPersonalizedRecommendation } from '../lib/gemini';
import Leaderboard from './Leaderboard';
import { scheduleDailyTip } from '../lib/notifications';
import strainsData from '../data/strains.json';
import { getStrainImageUrl } from '../lib/images';

import { useUserStore } from '../lib/stores/user.store';
import { updateProfile } from '../lib/services/user.service';
import { generateImage } from '../lib/gemini';
import EditProfilePanel from './EditProfilePanel';
import EmptyState from './EmptyState';

const UserProfile = ({ user: propUser, onLogout }) => {
    const { user: storeUser, setUser } = useUserStore();
    const user = propUser || storeUser;
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('favorites');
    const [favorites, setFavorites] = useState([]);
    const [messages, setMessages] = useState([]);
    const [community, setCommunity] = useState([]);
    const [activityFeed, setActivityFeed] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

    const [editForm, setEditForm] = useState({
        username: '',
        bio: '',
        avatar_url: '',
        interests: '',
        avatar_prompt: ''
    });

    useEffect(() => {
        if (user) {
            setProfile(user);
        }
    }, [user]);

    useEffect(() => {
        const fetchData = async () => {
            const userId = user?.id;
            if (!userId) return;

            setLoading(true);

            // Fetch Favorites
            const { data: favs } = await supabase.from('favorites').select('*').eq('user_id', userId);
            if (favs) setFavorites(favs);

            // Fetch Messages
            const { data: msgs } = await supabase.from('messages').select('*').eq('user_id', userId);
            if (msgs) setMessages(msgs);

            // Fetch My Profile
            const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (myProfile) {
                setProfile(myProfile);
                setEditForm({
                    username: myProfile.username || '',
                    bio: myProfile.bio || '',
                    avatar_url: myProfile.avatar_url || '',
                    interests: myProfile.interests || '',
                    avatar_prompt: ''
                });
                setUser({ ...user, ...myProfile });
            }

            // Fetch Community
            const { data: publicUsers } = await supabase.from('profiles').select('*').eq('is_public', true).limit(10);
            if (publicUsers) setCommunity(publicUsers.filter(p => p.id !== userId));

            // Fetch Activity Feed
            const { data: activities } = await supabase.from('community_activity').select('*').order('created_at', { ascending: false }).limit(20);
            if (activities) setActivityFeed(activities);

            setLoading(false);
        };

        fetchData();
    }, [user?.id]);

    const handleSaveProfile = async () => {
        try {
            // 1. Verify Auth Session directly
            let { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

            // Attempt auto-refresh if valid session missing
            if (authError || !authUser) {
                console.warn("Session invalid, attempting refresh...");
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                if (refreshError || !refreshData.user) {
                    alert("Your session has expired. Please log in again.");
                    await handleLogout();
                    return;
                }
                authUser = refreshData.user;
            }

            // 2. Prepare Update Data
            const updateData = {
                id: authUser.id,
                username: editForm.username,
                bio: editForm.bio,
                avatar_url: editForm.avatar_url,
                interests: editForm.interests
            };

            // 3. Call Service
            const updatedProfile = await updateProfile(updateData);

            setProfile(updatedProfile);
            setUser({ ...user, ...updatedProfile });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            const msg = error.message || "Unknown error";
            if (msg.includes("duplicate key")) {
                alert("Username is already taken. Please choose another.");
            } else {
                alert(`Failed to save profile: ${msg}`);
            }
        }
    };

    const handleGenerateAvatar = async () => {
        setIsGeneratingAvatar(true);
        try {
            const url = await generateImage(editForm.username);
            setEditForm(prev => ({
                ...prev,
                avatar_url: url,
                avatar_prompt: "AI Generated"
            }));
        } catch (error) {
            console.error('Error generating avatar:', error);
        } finally {
            setIsGeneratingAvatar(false);
        }
    };

    const handleSponsorship = async (tier) => {
        alert(`Initiating ${tier} sponsorship flow... (Demo)`);
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("File size too large. Please upload an image under 2MB.");
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert("Invalid file type. Please upload a JPG, PNG, or WebP image.");
            return;
        }

        try {
            setIsGeneratingAvatar(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setEditForm(prev => ({ ...prev, avatar_url: publicUrl }));

        } catch (error) {
            console.error("Avatar Upload Error:", error);
            alert("Failed to upload image. (Ensure 'avatars' bucket exists in Supabase)");
        } finally {
            setIsGeneratingAvatar(false);
        }
    };

    const togglePublicProfile = async () => {
        if (!profile) return;
        const newValue = !profile.is_public;
        setProfile({ ...profile, is_public: newValue });
        await supabase.from('profiles').update({ is_public: newValue }).eq('id', user.id);
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
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="flex items-center gap-6 relative z-10">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] relative z-10 bg-slate-800">
                            {isEditing ? (
                                editForm.avatar_url ? (
                                    <img src={editForm.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                                        <User className="w-8 h-8" />
                                    </div>
                                )
                            ) : (
                                profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                                        <User className="w-8 h-8" />
                                    </div>
                                )
                            )}

                            {isGeneratingAvatar && (
                                <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-20">
                                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                                </div>
                            )}
                        </div>

                        {isEditing && (
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col gap-2 w-max z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 p-2 rounded-lg border border-white/10 shadow-xl backdrop-blur-md">
                                <label className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer px-2 py-1 hover:bg-white/5 rounded">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                                    <Upload className="w-3 h-3" /> Upload Photo
                                </label>
                            </div>
                        )}
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            {isEditing ? (editForm.username || 'New Username') : (profile?.username || 'Loading...')}
                            {profile?.is_public ? (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Globe className="w-3 h-3" /> Public
                                </span>
                            ) : (
                                <span className="text-[10px] bg-slate-700/50 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Private
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-400 max-w-lg">
                            {isEditing ? (editForm.bio || 'New Bio...') : (profile?.bio || 'No bio yet.')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 z-10">
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleSaveProfile} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/20">
                                    <Save className="w-4 h-4" /> Save Changes
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-all border border-slate-700">
                                <Edit2 className="w-4 h-4" /> Edit Profile
                            </button>
                        )}
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Log Out">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {isEditing && (
                <EditProfilePanel
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onSave={handleSaveProfile}
                    onCancel={() => setIsEditing(false)}
                    onGenerateAvatar={handleGenerateAvatar}
                    onUpload={handleAvatarUpload}
                    isGenerating={isGeneratingAvatar}
                />
            )}

            <div className="flex gap-4 mb-8 border-b border-white/5 pb-4 overflow-x-auto">
                <button onClick={() => setActiveTab('favorites')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'favorites' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
                    <Heart className="w-4 h-4" /> Favorites
                </button>
                <button onClick={() => setActiveTab('inbox')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'inbox' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
                    <Mail className="w-4 h-4" /> Inbox
                    {messages.length > 0 && <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-1.5 rounded-full">{messages.length}</span>}
                </button>
                <button onClick={() => setActiveTab('community')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'community' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
                    <Users className="w-4 h-4" /> Community
                </button>
                <button onClick={() => setActiveTab('sponsorship')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'sponsorship' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-amber-400'}`}>
                    <Briefcase className="w-4 h-4" /> Sponsorship
                </button>
                <button onClick={() => setActiveTab('sommelier')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'sommelier' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-purple-400'}`}>
                    <Sparkles className="w-4 h-4" /> AI Sommelier
                </button>
                <button onClick={() => setActiveTab('system')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'system' ? 'bg-slate-700 text-white border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Activity className="w-4 h-4" /> System Health
                </button>
            </div>

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
                                    <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all group">
                                        <div className={`h-32 w-full relative overflow-hidden bg-gradient-to-br ${fav.visual_profile === 'purple' ? 'from-purple-900 to-slate-950' : fav.visual_profile === 'orange' ? 'from-orange-900 to-slate-950' : 'from-emerald-900 to-slate-950'}`}>
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
                            <EmptyState type="favorites" />
                        )
                    )}

                    {activeTab === 'inbox' && (
                        messages.length > 0 ? (
                            <div className="space-y-4">
                                {messages.map((msg, index) => (
                                    <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/30 transition-all">
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
                            <div className="mb-8">
                                <Leaderboard />
                            </div>
                            <div className="mb-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-3">
                                <Users className="w-5 h-5 text-emerald-400 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-400 mb-1">Community Hub</h4>
                                    <p className="text-xs text-slate-400">
                                        Recent activity from the inner circle. Contribute data to earn XP and Ranks.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sommelier' && (
                        <SommelierView user={user} favorites={favorites} />
                    )}

                    {activeTab === 'sponsorship' && (
                        <div className="text-center py-12">
                            <h3 className="text-white text-lg">Sponsorship Tier Selection</h3>
                            <p className="text-slate-400">Available plans coming soon.</p>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4">App Settings</h3>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('strainwise_tutorial_seen');
                                        window.location.reload();
                                    }}
                                    className="w-full text-left px-4 py-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
                                >
                                    <div className="font-medium text-white flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4 text-blue-400" /> Replay Tutorial
                                    </div>
                                    <div className="text-sm text-slate-400 pl-6">View the welcome tutorial again</div>
                                </button>

                                <button
                                    onClick={() => {
                                        localStorage.clear();
                                        window.location.reload();
                                    }}
                                    className="w-full text-left px-4 py-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
                                >
                                    <div className="font-medium text-white flex items-center gap-2">
                                        <Trash2 className="w-4 h-4 text-red-400" /> Clear App Cache
                                    </div>
                                    <div className="text-sm text-slate-400 pl-6">Fix storage or loading issues</div>
                                </button>

                                <button
                                    onClick={() => window.open('/terms', '_blank')}
                                    className="w-full text-left px-4 py-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
                                >
                                    <div className="font-medium text-white flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-400" /> Terms & Conditions
                                    </div>
                                    <div className="text-sm text-slate-400 pl-6">Read usage policies</div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl mt-6">
                                <div>
                                    <h4 className="text-white font-bold flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-emerald-400" /> {t('system.push_notifications')}
                                    </h4>
                                    <p className="text-xs text-slate-400">{t('system.desc')}</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        const success = await scheduleDailyTip();
                                        if (success) alert(t('system.tips_enabled'));
                                        else alert("Notification permission denied or not supported.");
                                    }}
                                    className="px-4 py-2 bg-emerald-500/10 text-emerald-400 font-bold text-xs rounded-lg hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                                >
                                    {t('system.enable_tips')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SommelierView = ({ user, favorites }) => {
    const { t } = useTranslation();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        const { data: reviews } = await supabase.from('reviews').select('*').eq('user_id', user.id).limit(5);
        const history = {
            favorites: favorites.map(f => f.strain_name),
            reviews: reviews ? reviews.map(r => ({ strain: r.strain_name, rating: r.rating, notes: r.content })) : []
        };

        const recs = await getPersonalizedRecommendation(history);
        if (recs) setRecommendations(recs);
        setLoading(false);
    };

    return (
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-6 text-center">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-400" /> {t('sommelier.title')}
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                {t('sommelier.desc')}
            </p>

            {recommendations.length === 0 ? (
                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-purple-500/20 transition-all hover:scale-105 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('sommelier.curate')}
                </button>
            ) : (
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                    {recommendations.map((rec, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.2 }}
                            className="bg-slate-950 border border-purple-500/30 rounded-xl p-6 hover:shadow-2xl hover:shadow-purple-900/20 transition-all text-left"
                        >
                            <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">Recommendation #{i + 1}</div>
                            <h4 className="text-xl font-bold text-white mb-2">{rec.name}</h4>
                            <span className="inline-block px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 mb-4">{rec.type}</span>
                            <div className="text-sm text-slate-400 italic mb-4">"{rec.reason}"</div>
                        </motion.div>
                    ))}
                    <div className="col-span-full mt-6">
                        <button onClick={handleAnalyze} className="text-sm text-purple-400 hover:text-purple-300 underline">
                            Refresh Selection
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
