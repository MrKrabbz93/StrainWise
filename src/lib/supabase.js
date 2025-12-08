import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Safe Storage Adapter to handle "Disk Full" errors gracefully
class SafeStorage {
    constructor() {
        this.memoryStorage = new Map();
    }

    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('Storage Read Error (using memory fallback):', e);
            return this.memoryStorage.get(key) || null;
        }
    }

    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('Storage Write Error (using memory fallback):', e);
            this.memoryStorage.set(key, value);
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Storage Delete Error:', e);
            this.memoryStorage.delete(key);
        }
    }
}

let supabaseClient;

if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: new SafeStorage(),
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });
} else {
    console.warn("Supabase keys missing. Using Mock Client for Demo Mode.");
    // Mock Client for Demo Mode (preserves functionality without backend)
    supabaseClient = {
        auth: {
            signInWithPassword: async ({ email, password }) => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                if (password === 'error') return { error: { message: 'Invalid login credentials' } };
                const user = {
                    id: 'mock-user-id-123',
                    email: email,
                    created_at: new Date().toISOString()
                };
                try { localStorage.setItem('supabase.auth.token', JSON.stringify(user)); } catch (e) { }
                return { data: { user }, error: null };
            },
            signUp: async ({ email, password }) => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const user = {
                    id: 'mock-user-id-new',
                    email: email
                };
                try { localStorage.setItem('supabase.auth.token', JSON.stringify(user)); } catch (e) { }
                return { data: { user }, error: null };
            },
            signOut: async () => {
                try { localStorage.removeItem('supabase.auth.token'); } catch (e) { }
                return { error: null };
            },
            onAuthStateChange: (callback) => {
                let user = null;
                try { user = JSON.parse(localStorage.getItem('supabase.auth.token')); } catch (e) { }
                if (user) callback('SIGNED_IN', { user });
                return { data: { subscription: { unsubscribe: () => { } } } };
            },
            getUser: async () => {
                let user = null;
                try { user = JSON.parse(localStorage.getItem('supabase.auth.token')); } catch (e) { }
                return { data: { user }, error: null };
            }
        },
        from: (table) => {
            return {
                select: () => ({
                    eq: (column, value) => {
                        if (table === 'favorites') {
                            let favorites = [];
                            try { favorites = JSON.parse(localStorage.getItem('favorites') || '[]'); } catch (e) { }
                            return { data: favorites, error: null };
                        }
                        return { data: [], error: null };
                    }
                }),
                insert: async (data) => {
                    if (table === 'favorites') {
                        let favorites = [];
                        try { favorites = JSON.parse(localStorage.getItem('favorites') || '[]'); } catch (e) { }
                        const exists = favorites.some(f => f.strain_name === data[0].strain_name);
                        if (!exists) {
                            favorites.push(data[0]);
                            try { localStorage.setItem('favorites', JSON.stringify(favorites)); } catch (e) { }
                        }
                        return { data: data, error: null };
                    }
                    if (table === 'messages') {
                        let messages = [];
                        try { messages = JSON.parse(localStorage.getItem('messages') || '[]'); } catch (e) { }
                        messages.push(data[0]);
                        try { localStorage.setItem('messages', JSON.stringify(messages)); } catch (e) { }
                        return { data: data, error: null };
                    }
                    if (table === 'profiles') {
                        let profiles = [];
                        try { profiles = JSON.parse(localStorage.getItem('profiles') || '[]'); } catch (e) { }
                        profiles.push(data[0]);
                        try { localStorage.setItem('profiles', JSON.stringify(profiles)); } catch (e) { }
                        return { data: data, error: null };
                    }
                    return { data: [], error: null };
                },
                update: (data) => ({
                    eq: (column, value) => {
                        if (table === 'profiles' && column === 'id') {
                            let profiles = [];
                            try { profiles = JSON.parse(localStorage.getItem('profiles') || '[]'); } catch (e) { }
                            const index = profiles.findIndex(p => p.id === value);
                            if (index !== -1) {
                                profiles[index] = { ...profiles[index], ...data };
                                try { localStorage.setItem('profiles', JSON.stringify(profiles)); } catch (e) { }
                            }
                            return { data: null, error: null };
                        }
                        return { data: null, error: null };
                    }
                }),
                delete: () => ({
                    eq: (column, value) => {
                        if (table === 'favorites' && column === 'strain_name') {
                            let favorites = [];
                            try { favorites = JSON.parse(localStorage.getItem('favorites') || '[]'); } catch (e) { }
                            const newFavorites = favorites.filter(f => f.strain_name !== value);
                            try { localStorage.setItem('favorites', JSON.stringify(newFavorites)); } catch (e) { }
                            return { data: null, error: null };
                        }
                        return { data: null, error: null };
                    }
                })
            };
        }
    };
}

export const supabase = supabaseClient;
