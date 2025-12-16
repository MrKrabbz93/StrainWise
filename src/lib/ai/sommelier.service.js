export class StrainSommelier {
    constructor(userProfile, strainDatabase) {
        this.user = userProfile; // { favorites: [], reviews: [], history: [] }
        this.strains = strainDatabase || [];
        this.preferences = this.analyzePreferences();
    }

    /**
     * Analyzes user data to determine taste preferences.
     */
    analyzePreferences() {
        const prefs = {
            terpenes: {},
            effects: {},
            types: { Indica: 0, Sativa: 0, Hybrid: 0 }
        };

        // Analyze Favorites
        this.user.favorites?.forEach(favId => {
            const strain = this.strains.find(s => s.id === favId);
            if (strain) {
                // Count basic stats
                if (prefs.types[strain.type]) prefs.types[strain.type]++;

                strain.terpenes?.forEach(t => {
                    prefs.terpenes[t] = (prefs.terpenes[t] || 0) + 1;
                });
                strain.effects?.forEach(e => {
                    prefs.effects[e] = (prefs.effects[e] || 0) + 1;
                });
            }
        });

        // Sort and optimize
        return {
            topTerpenes: Object.entries(prefs.terpenes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]),
            topEffects: Object.entries(prefs.effects).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]),
            preferredType: Object.entries(prefs.types).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Hybrid'
        };
    }

    /**
     * Generates recommendations based on analysis.
     * @param {object} context - e.g. { location: '...', timeOfDay: 'night' }
     * @returns {Array} Recommendations
     */
    recommend(context = {}) {
        const { topTerpenes, topEffects, preferredType } = this.preferences;

        // Simple scoring algorithm
        const scored = this.strains.map(strain => {
            if (this.user.favorites?.includes(strain.id)) return { strain, score: -1 }; // Skip already favorited

            let score = 0;
            if (strain.type === preferredType) score += 2;
            strain.terpenes?.forEach(t => { if (topTerpenes.includes(t)) score += 3; });
            strain.effects?.forEach(e => { if (topEffects.includes(e)) score += 3; });

            // Contextual Boosts
            if (context.timeOfDay === 'night' && strain.type === 'Indica') score += 2;
            if (context.timeOfDay === 'morning' && strain.type === 'Sativa') score += 2;

            return { strain, score };
        });

        return scored
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(item => ({
                ...item.strain,
                matchScore: item.score,
                reason: `Matches your love for ${topTerpenes[0] || 'terpenes'} and ${preferredType} strains.`
            }));
    }
}
