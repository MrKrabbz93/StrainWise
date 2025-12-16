import { io } from 'socket.io-client';
import { useConsultantStore } from '../stores/consultant.store';
import { logger } from '../logger';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    connect(url = process.env.VITE_WEBSOCKET_URL || 'http://localhost:3000') {
        if (this.socket) return;

        this.socket = io(url, {
            autoConnect: false,
            transports: ['websocket'],
            auth: (cb) => {
                // Get token from local storage or store
                const token = JSON.parse(localStorage.getItem('strainwise-user-storage'))?.state?.token;
                cb({ token });
            }
        });

        this.socket.on('connect', () => {
            logger.info('Socket connected', { id: this.socket.id });
            this.isConnected = true;
        });

        this.socket.on('disconnect', (reason) => {
            logger.warn('Socket disconnected', { reason });
            this.isConnected = false;
        });

        this.socket.on('connect_error', (err) => {
            logger.error('Socket connection error', { err });
        });

        // --- GLOBAL EVENT HANDLERS ---

        // Listen for new chat messages
        this.socket.on('message:received', (data) => {
            // Update Zustand store
            useConsultantStore.getState().receiveMessage(data);
        });

        this.socket.connect();
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    emit(event, data) {
        if (!this.socket) {
            logger.warn('Socket not connected, cannot emit', { event });
            return;
        }
        this.socket.emit(event, data);
    }
}

export const socketService = new SocketService();
