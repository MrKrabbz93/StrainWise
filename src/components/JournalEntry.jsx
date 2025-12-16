import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X, Save, Tag } from 'lucide-react';
import { createJournal } from '../lib/services/journal.service';
import { useUserStore } from '../lib/stores/user.store';

const EFFECTS_OPTIONS = ['Relaxed', 'Happy', 'Euphoric', 'Uplifted', 'Creative', 'Sleepy', 'Focused', 'Energetic', 'Talkative', 'Hungry', 'Tingly', 'Giggly'];
const ACTIVITY_OPTIONS = ['Gaming', 'Movie/TV', 'Music', 'Socializing', 'Hiking', 'Exercising', 'Reading', 'Writing', 'Coding', 'Sleeping', 'Meditation', 'Cooking'];

const JournalEntry = ({ strain, onClose, onSave }) => {
    const user = useUserStore((state) => state.user);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [dosage, setDosage] = useState('');
    const [selectedEffects, setSelectedEffects] = useState([]);
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleEffect = (effect) => {
        setSelectedEffects(prev =>
            prev.includes(effect) ? prev.filter(e => e !== effect) : [...prev, effect]
        );
    };

    const toggleActivity = (activity) => {
        setSelectedActivities(prev =>
            prev.includes(activity) ? prev.filter(a => a !== activity) : [...prev, activity]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return alert("Please log in to save a journal.");
        if (rating === 0) return alert("Please select a rating.");

        setIsSubmitting(true);
        try {
            await createJournal({
                user_id: user.id,
                strain_id: strain.id || strain.name, // Fallback if ID is missing (for mock data)
                rating,
                dosage,
                effects: selectedEffects,
                activity_tags: selectedActivities,
                notes
            });
            if (onSave) onSave();
            onClose();
        } catch (err) {
            console.error("Failed to save journal:", err);
            alert("Failed to save journal entry.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-white">Journal Entry</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    <div>
                        <h3 className="text-emerald-400 font-bold text-lg mb-1">{strain.name}</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">{strain.type}</p>
                    </div>

                    {/* Rating */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dosage */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Dosage</label>
                        <input
                            type="text"
                            value={dosage}
                            onChange={(e) => setDosage(e.target.value)}
                            placeholder="e.g. 2 puffs, 10mg edible"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500/50 outline-none"
                        />
                    </div>

                    {/* Effects Tags */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4" /> Effects Felt
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {EFFECTS_OPTIONS.map(effect => (
                                <button
                                    key={effect}
                                    type="button"
                                    onClick={() => toggleEffect(effect)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedEffects.includes(effect)
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                                        }`}
                                >
                                    {effect}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activity Tags */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Tag className="w-4 h-4" /> Activity Pairings
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {ACTIVITY_OPTIONS.map(activity => (
                                <button
                                    key={activity}
                                    type="button"
                                    onClick={() => toggleActivity(activity)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedActivities.includes(activity)
                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                                        }`}
                                >
                                    {activity}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Detailed Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="How was the experience? Flavor notes? Duration?"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500/50 outline-none min-h-[100px] resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-slate-900/50 sticky bottom-0">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : (
                            <>
                                <Save className="w-4 h-4" /> Save Entry
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// Helper Icon for Effect label
const SparklesIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

export default JournalEntry;
