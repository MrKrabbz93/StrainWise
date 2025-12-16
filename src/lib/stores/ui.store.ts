import { create } from 'zustand';

type Theme = 'light' | 'dark';
type NotificationType = 'info' | 'success' | 'error';

interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

interface UIState {
    theme: Theme;
    isSidebarOpen: boolean;
    notifications: Notification[];
    toggleTheme: () => void;
    toggleSidebar: () => void;
    closeSidebar: () => void;
    addNotification: (message: string, type?: NotificationType, duration?: number) => void;
    removeNotification: (id: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
    theme: 'dark',
    isSidebarOpen: false,
    notifications: [],

    toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    closeSidebar: () => set({ isSidebarOpen: false }),

    addNotification: (message, type = 'info', duration = 3000) => {
        const id = Date.now();
        set((state) => ({
            notifications: [...state.notifications, { id, message, type }]
        }));

        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    notifications: state.notifications.filter(n => n.id !== id)
                }));
            }, duration);
        }
    },

    removeNotification: (id) => {
        set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
        }));
    }
}));
