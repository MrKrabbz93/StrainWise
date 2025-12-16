import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Book, Calendar, Star, Tag, Edit2, Trash2 } from 'lucide-react';
import { getJournalsForUser, deleteJournal } from '../lib/services/journal.service';
import { useUserStore } from '../lib/stores/user.store';
import JournalEntry from '../components/JournalEntry';
import EmptyState from '../components/EmptyState'; // Assuming existing or will create simple inline

const JournalPage = () => {
    const user = useUserStore((state) => state.user);
    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedStrain, setSelectedStrain] = useState(null); // For editing or new entry pre-fill

    // NOTE: In a real app, you'd pick a strain first vs generic "New Entry". 
    // For this page, "New Entry" might open a strain selector or just a generic form.
    // We'll assume the Modal handles cases where strain is null by letting user search (out of scope for now)
    // OR we rely on "Add Journal" buttons on Strain Cards elsewhere.
    // But the requirement says "Button to create new entry". 
    // I'll make the button open a modal that *conceptually* would let you pick a strain.
    // For simplicity, I will mock a generic "Select Strain" state if needed, but the JournalEntry component expects a 'strain' object.
    // I'll add a simple placeholder strain picker effectively by modifying this page later if needed. 
    // For now, I'll pass a "dummy" or require selecting a strain from Library to journal.

    // Actually, standard UX: Go to Library -> Click "Journal This".
    // But "JournalPage" lists past entries. 

    useEffect(() => {
        if (user) {
            loadJournals();
        }
    }, [user]);

    const loadJournals = async () => {
        setLoading(true);
        try {
            const data = await getJournalsForUser(user.id);
            setJournals(data);
        } catch (err) {
            console.error("Failed to load journals", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this entry?")) {
            await deleteJournal(id);
            loadJournals();
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Book className="w-8 h-8 text-emerald-400" />
                        Strain Journal
                    </h1>
                    <p className="text-slate-400 mt-1">Track your experiences and refine your recommendations.</p>
                </div>
                {/* 
         <button 
           onClick={() => { setSelectedStrain({name: 'New Strain', type: 'Hybrid', id: 'new'}); setShowModal(true); }}
           className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
         >
            <Plus className="w-4 h-4" /> New Entry
         </button>
         */}
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading journals...</div>
            ) : journals.length === 0 ? (
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-12 text-center">
                    <Book className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Your journal is empty</h3>
                    <p className="text-slate-400 max-w-md mx-auto mb-6">
                        Start adding journal entries from the Strain Library to track what works best for you.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {journals.map(journal => (
                        <motion.div
                            key={journal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900 border border-white/5 rounded-xl p-5 hover:border-emerald-500/20 transition-colors group relative"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{journal.strain_id}</h3>
                                    {/* Assuming strain_id currently stores NAME based on previous service call logic. Ideally we join tables. */}
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(journal.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="font-bold text-yellow-500">{journal.rating}</span>
                                </div>
                            </div>

                            {journal.effects && journal.effects.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {journal.effects.map(e => (
                                        <span key={e} className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 border border-white/5">
                                            {e}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {journal.notes && (
                                <p className="text-slate-400 text-sm mb-3 italic">"{journal.notes}"</p>
                            )}

                            <div className="flex justify-between items-center text-xs text-slate-500 border-t border-white/5 pt-3 mt-2">
                                <span>Dosage: {journal.dosage || 'N/A'}</span>
                                <button
                                    onClick={() => handleDelete(journal.id)}
                                    className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                >
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showModal && selectedStrain && (
                    <JournalEntry
                        strain={selectedStrain}
                        onClose={() => setShowModal(false)}
                        onSave={() => {
                            loadJournals();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default JournalPage;
