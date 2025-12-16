class CommunityService {
    constructor() {
        this.realtimeService = null;
        // Mock data store
        this.messages = [];
        this.listeners = new Map();

        // Simulate "connection"
        setTimeout(() => {
            console.log('[Community] Connected to mock realtime service.');
        }, 500);
    }

    async joinCommunityRoom(roomId, userId) {
        console.log(`[Community] User ${userId} joined room ${roomId}`);
        // Simulate fetching history
        return this.getMessages(roomId);
    }

    async leaveCommunityRoom(roomId, userId) {
        console.log(`[Community] User ${userId} left room ${roomId}`);
    }

    async sendMessage(roomId, userId, content) {
        const message = {
            id: crypto.randomUUID(),
            roomId,
            userId,
            content,
            timestamp: Date.now()
        };

        this.messages.push(message);
        console.log('[Community] Message sent:', message);

        // Notify listeners
        this.notifyListeners(roomId, message);

        return message;
    }

    // --- Mock Realtime Logic ---

    subscribe(roomId, callback) {
        if (!this.listeners.has(roomId)) {
            this.listeners.set(roomId, new Set());
        }
        this.listeners.get(roomId).add(callback);

        return () => { // Unsubscribe
            const roomListeners = this.listeners.get(roomId);
            if (roomListeners) {
                roomListeners.delete(callback);
            }
        };
    }

    notifyListeners(roomId, message) {
        const roomListeners = this.listeners.get(roomId);
        if (roomListeners) {
            roomListeners.forEach(cb => cb(message));
        }
    }

    getMessages(roomId) {
        // Return existing messages for this room
        return this.messages.filter(m => m.roomId === roomId);
    }

    // --- Event Logic ---

    async createVirtualEvent(userId, eventData) {
        const event = {
            id: crypto.randomUUID(),
            hostId: userId,
            ...eventData,
            timestamp: Date.now()
        };
        console.log('[Community] Event created:', event);
        return event;
    }
}

export const communityService = new CommunityService();
