import { create } from 'zustand';
import { aiConsultantService } from '../services/ai-consultant.service';

export const useConsultantStore = create((set, get) => ({
    messages: [], // Chat history
    isTyping: false,
    currentSessionId: null,
    activePersona: 'guide', // default
    error: null,

    startSession: async (userId, personaId) => {
        set({ isTyping: true, error: null, messages: [] });
        try {
            const session = await aiConsultantService.createSession(userId, personaId);
            set({
                currentSessionId: session.id,
                activePersona: personaId,
                isTyping: false
            });
        } catch (error) {
            set({ error: error.message, isTyping: false });
        }
    },

    sendMessage: async (text, userId, contextStrainId) => {
        const { currentSessionId, messages } = get();
        if (!currentSessionId) return;

        // Optimistic Update
        const tempId = Date.now();
        const optimisticMessage = { id: tempId, role: 'user', content: text, timestamp: new Date().toISOString() };
        set({ messages: [...messages, optimisticMessage], isTyping: true });

        try {
            const result = await aiConsultantService.sendMessage({
                sessionId: currentSessionId,
                userId,
                message: text,
                contextStrainId
            });

            // Replace optimistic logic if needed, or just append AI response
            // Here we append AI response
            const aiMessage = {
                id: Date.now() + 1,
                role: 'consultant',
                content: result.response,
                timestamp: new Date().toISOString()
            };

            set((state) => ({
                messages: [...state.messages, aiMessage],
                isTyping: false
            }));

        } catch (error) {
            set((state) => ({
                error: error.message,
                isTyping: false,
                // Rollback optimistic message would go here in a robust app
                messages: state.messages.filter(m => m.id !== tempId)
            }));
        }
    },

    setPersona: (personaId) => {
        set({ activePersona: personaId });
    },

    receiveMessage: (message) => {
        set((state) => {
            // Avoid duplicates
            if (state.messages.some(m => m.id === message.id)) return {};
            return {
                messages: [...state.messages, message],
                isTyping: false
            };
        });
    }
}));
