import React from 'react';
import { motion } from 'framer-motion';
import OptimizedImage from '../optimized/OptimizedImage';
import { useStrainStore } from '../../lib/stores/strain.store';

const StrainCard = ({ strain, variant = 'default', onClick }) => {
    const toggleFavorite = useStrainStore(state => state.toggleFavorite);
    const isFavorite = useStrainStore(state => state.favorites?.includes(strain.id));

    const handleFavorite = (e) => {
        e.stopPropagation();
        toggleFavorite(strain.id);
    };

    // --- VARIANTS --- //

    if (variant === 'compact') {
        return (
            <div
                className="flex items-center p-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
                onClick={onClick}
            >
                <OptimizedImage
                    src={strain.imageUrl}
                    alt={strain.name}
                    className="w-10 h-10 rounded-full mr-3"
                />
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">{strain.name}</h4>
                    <span className="text-xs text-green-400 uppercase tracking-wider">{strain.type}</span>
                </div>
            </div>
        );
    }

    if (variant === 'detailed') {
        return (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                <div className="relative h-64">
                    <OptimizedImage src={strain.imageUrl} alt={strain.name} className="w-full h-full" />
                    <button
                        onClick={handleFavorite}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-colors"
                    >
                        {isFavorite ? '★' : '☆'}
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                        <h3 className="text-3xl font-bold text-white mb-1">{strain.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/30">
                                {strain.type}
                            </span>
                            <span className="text-yellow-400">★ {strain.rating.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
                <div className="p-6 text-gray-300 space-y-4">
                    <p className="leading-relaxed">{strain.description}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs text-gray-500 uppercase">Effects</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {strain.effects.slice(0, 3).map(e => (
                                    <span key={e} className="text-xs bg-white/10 px-2 py-1 rounded">{e}</span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 uppercase">Flavors</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {strain.flavors.slice(0, 3).map(f => (
                                    <span key={f} className="text-xs bg-white/10 px-2 py-1 rounded">{f}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default Card
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group relative bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-green-500/50 transition-all"
            onClick={onClick}
        >
            <div className="aspect-square relative">
                <OptimizedImage src={strain.imageUrl} alt={strain.name} className="w-full h-full" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium border border-white px-4 py-2 rounded-full backdrop-blur-sm">View Details</span>
                </div>
            </div>
            <div className="p-4">
                <div className="flexjustify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-white group-hover:text-green-400 transition-colors">{strain.name}</h4>
                    <button onClick={handleFavorite} className="text-xl text-gray-500 hover:text-yellow-400 transition-colors">
                        {isFavorite ? '★' : '☆'}
                    </button>
                </div>
                <div className="flex items-center text-sm text-gray-400 mb-3">
                    <span className={`w-2 h-2 rounded-full mr-2 ${strain.type === 'Sativa' ? 'bg-orange-400' : strain.type === 'Indica' ? 'bg-purple-400' : 'bg-green-400'}`}></span>
                    {strain.type}
                </div>
                <div className="flex gap-2">
                    {strain.effects.slice(0, 2).map(e => (
                        <span key={e} className="text-xs bg-white/5 px-2 py-1 rounded text-gray-300">{e}</span>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// Re-add the second component definition (StrainCard with dispensaries prop) properly or merge them?
// Wait, the file has TWO definitions of StrainCard?
// Ah, looking at the previous file content (Step 326), it seems there was ONLY ONE `StrainCard`.
// But wait, the file content I viewed in Step 326 (lines 1-219) has a DIFFERENT structure than what I see in Step 320 (lines 1-117).
// It seems I viewed `src/components/strains/StrainCard.jsx` in Step 320, AND `src/components/StrainCard.jsx` in Step 326.
// The user error is likely coming from `src/components/StrainCard.jsx` (the one with dispensaries prop).
// This tool call targets `d:\cannabis-consultant\src\components\strains\StrainCard.jsx`...
// I should be targeting `d:\cannabis-consultant\src\components\StrainCard.jsx`!

// Let me CORRECT the target file and the replacement content.


export default React.memo(StrainCard);
