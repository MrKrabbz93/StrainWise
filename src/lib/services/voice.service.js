class VoiceService {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.supported = this.checkSupport();
    }

    checkSupport() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    initializeRecognition(onResult, onError) {
        if (!this.supported) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            let transcript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }

            onResult(transcript, event.results[event.results.length - 1].isFinal);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (onError) onError(event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
        };
    }

    startListening() {
        if (!this.supported || !this.recognition) {
            console.warn('Speech recognition not initialized');
            return;
        }

        if (this.isListening) return;

        try {
            this.recognition.start();
            this.isListening = true;
        } catch (e) {
            console.error("Failed to start listening:", e);
        }
    }

    stopListening() {
        if (!this.supported || !this.recognition || !this.isListening) return;

        this.recognition.stop();
        this.isListening = false;
    }

    speak(text, options = {}) {
        if (!this.supported) {
            return Promise.resolve(); // Fail silently/gracefully
        }

        return new Promise((resolve, reject) => {
            // Cancel any current speaking
            this.synthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);

            utterance.rate = options.rate || 1;
            utterance.pitch = options.pitch || 1;
            utterance.volume = options.volume || 1;

            if (options.voice) {
                const voices = this.synthesis.getVoices();
                const selectedVoice = voices.find(voice => voice.name === options.voice);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }

            utterance.onend = () => resolve();
            utterance.onerror = (event) => reject(event.error);

            this.synthesis.speak(utterance);
        });
    }

    getAvailableVoices() {
        return this.synthesis.getVoices();
    }
}

export const voiceService = new VoiceService();
