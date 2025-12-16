import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { supabase } from '../supabase';

const loginApi = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data.user;
};

interface UserState {
    user: any;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: any) => void;
    setUser: (user: any) => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const user = await loginApi(email, password);
                    set({ user, isAuthenticated: true, isLoading: false });
                } catch (error: any) {
                    set({ error: error.message || 'Login failed', isLoading: false });
                }
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
            },

            updateProfile: (data: any) => {
                set((state: any) => ({
                    user: { ...state.user, ...data }
                }));
            },

            setUser: (user: any) => {
                set({ user });
            }
        }),
        {
            name: 'strainwise-user-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
