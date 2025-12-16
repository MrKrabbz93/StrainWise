import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, User, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { addXP } from '../lib/gamification';

const StrainReviews = ({ strainName }) => {
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 5, content: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
        checkUser();
    }, [strainName]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    };

    const fetchReviews = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('strain_name', strainName)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setReviews(data);
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return alert("Please sign in to review strains.");
        if (!newReview.content.trim()) return;

        setIsSubmitting(true);

        try {
            const { error } = await supabase.from('reviews').insert([{
                strain_name: strainName,
                user_id: currentUser.id,
                rating: newReview.rating,
                content: newReview.content
            }]);

            if (error) throw error;

            // Gamification: Award XP
            await addXP(currentUser.id, 50, 'Wrote a review');

            // Reset form and refresh
            setNewReview({ rating: 5, content: '' });
            fetchReviews();

        } catch (err) {
            console.error("Review Error:", err);
            alert("Failed to post review. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (reviewId) => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
        if (!error) {
            setReviews(prev => prev.filter(r => r.id !== reviewId));
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 'New';

    return (
        <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                Community Reviews ({reviews.length})
                <span className="ml-auto text-sm bg-slate-800 px-3 py-1 rounded-full text-emerald-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-emerald-400" /> {averageRating}
                </span>
            </h3>

            {/* Review List */}
            <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {isLoading ? (
                    <div className="text-center text-slate-500 py-4">Loading thoughts...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center text-slate-500 py-8 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
                        No reviews yet. Be the first to rate {strainName}!
                    </div>
                ) : (
                    reviews.map((review) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900/80 p-4 rounded-xl border border-white/5"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                                        {review.profiles?.avatar_url ? (
                                            <img src={review.profiles.avatar_url} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-4 h-4 text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400">
                                            {review.profiles?.email?.split('@')[0] || "Anonymous"}
                                        </div>
                                        <div className="flex text-emerald-500">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-700 fill-none'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-600">
                                    {new Date(review.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed pl-10">
                                {review.content}
                            </p>
                            {currentUser && currentUser.id === review.user_id && (
                                <button
                                    onClick={() => handleDelete(review.id)}
                                    className="ml-auto block mt-2 text-xs text-red-400/50 hover:text-red-400"
                                >
                                    Delete
                                </button>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            {/* Add Review Form */}
            {currentUser ? (
                <form onSubmit={handleSubmit} className="bg-slate-800/50 p-4 rounded-xl border border-white/10">
                    <h4 className="text-sm font-bold text-slate-300 mb-3">Add Your Experience</h4>
                    <div className="flex gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`w-6 h-6 ${star <= newReview.rating ? 'text-emerald-400 fill-emerald-400' : 'text-slate-600'}`}
                                />
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <textarea
                            value={newReview.content}
                            onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                            placeholder={`How did ${strainName} make you feel?`}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pr-12 text-slate-200 focus:border-emerald-500 focus:outline-none min-h-[80px]"
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting || !newReview.content.trim()}
                            className="absolute bottom-3 right-3 p-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        <span>Earn <strong>50 XP</strong> for your review!</span>
                    </div>
                </form>
            ) : (
                <div className="text-center p-4 bg-slate-900/50 rounded-xl border border-white/5">
                    <p className="text-sm text-slate-400">Please sign in to leave a review.</p>
                </div>
            )}
        </div>
    );
};

export default StrainReviews;
