import React, { useState, useEffect } from 'react';
import { voiceService } from '../../lib/services/voice.service';
import ConsultantInterface from '../ConsultantInterface';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const VoiceEnabledConsultant = (props) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    // We'll use a ref to the ConsultantInterface to trigger sending messages
    // But since we can't easily ref functional components without forwardRef,
    // we might need to pass the input down or simulate typing.
    // Ideally, ConsultantInterface would expose a way to set input or send message.
    // For now, let's pass a special prop or custom event if needed.
    // actually, we can just render ConsultantInterface and if we get voice input,
    // we update a state that is passed as `initialInput` or `externalInput` to ConsultantInterface.
    const [externalInput, setExternalInput] = useState('');

    useEffect(() => {
        setVoiceSupported(voiceService.supported);

        if (voiceService.supported) {
            voiceService.initializeRecognition(
                (text, isFinal) => {
                    setTranscript(text);
                    if (isFinal) {
                        setExternalInput(text);
                        setTranscript('');
                        // Optional: Auto-send?
                        // For now let's just populate the input.
                        // To auto-send we'd need a trigger in ConsultantInterface.
                    }
                },
                (error) => {
                    console.error('Voice Error:', error);
                    setIsListening(false);
                }
            );
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            voiceService.stopListening();
            setIsListening(false);
        } else {
            voiceService.startListening();
            setIsListening(true);
        }
    };

    const handleAIResponse = (responseText) => {
        if (!isMuted && voiceSupported) {
            setIsSpeaking(true);
            voiceService.speak(responseText)
                .then(() => setIsSpeaking(false))
                .catch(() => setIsSpeaking(false));
        }
    };

    return (
        <div className="relative h-full">
            <ConsultantInterface
                {...props}
                externalInput={externalInput}
                onInputHandled={() => setExternalInput('')}
                onResponse={handleAIResponse}
            />

            {/* Voice Controls Overlay */}
            {voiceSupported && (
                <div className="absolute bottom-24 right-6 flex flex-col gap-2 z-20">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-3 rounded-full shadow-lg backdrop-blur-md transition-all ${isMuted ? 'bg-slate-800/80 text-slate-400' : 'bg-emerald-500/80 text-white'}`}
                        title={isMuted ? "Unmute TTS" : "Mute TTS"}
                    >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={toggleListening}
                        className={`p-4 rounded-full shadow-lg backdrop-blur-md transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600/80 text-white hover:bg-blue-500'}`}
                        title="Toggle Voice Input"
                    >
                        {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    {transcript && (
                        <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-black/80 text-white text-sm rounded-lg backdrop-blur-sm pointer-events-none">
                            {transcript}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VoiceEnabledConsultant;
