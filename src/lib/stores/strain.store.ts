import { create } from 'zustand';
import { strainService } from '../services/strain.service';

export const useStrainStore = create((set, get) => ({
    strains: [],
    loading: false,
    error: null,
    filters: {
        page: 1,
        limit: 10,
        search: '',
        type: '', // Sativa, Indica, Hybrid
        effect: ''
    },
    pagination: {
        total: 0,
        totalPages: 0
    },
    favorites: [], // IDs of favorite strains

    setFilter: (key, value) => {
        set((state) => ({
            filters: { ...state.filters, [key]: value, page: 1 } // Reset to page 1 on filter change
        }));
        get().fetchStrains(); // Auto-fetch on filter change
    },

    setPage: (page) => {
        set((state) => ({
            filters: { ...state.filters, page }
        }));
        get().fetchStrains();
    },

    fetchStrains: async () => {
        set({ loading: true, error: null });
        const { filters } = get();
        try {
            // Using the strainService we created in Phase 2
            const result = await strainService.getStrains(filters);
            set({
                strains: result.data,
                pagination: result.meta,
                loading: false
            });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    toggleFavorite: (strainId) => {
        set((state) => {
            const isFav = state.favorites.includes(strainId);
            const newFavs = isFav
                ? state.favorites.filter(id => id !== strainId)
                : [...state.favorites, strainId];
            return { favorites: newFavs };
        });
        // Ideally sync with backend here
    }
}));
