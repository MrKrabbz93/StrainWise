import React, { useState, useEffect } from 'react';
import { arService } from '../../lib/services/ar.service';
import { Box, X } from 'lucide-react';

const ARStrainViewer = ({ strainId, strainName, onClose }) => {
    const [isSupported, setIsSupported] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        setIsSupported(arService.isSupported);
    }, []);

    const startAR = async () => {
        try {
            setStatus('Initializing AR...');
            await arService.initializeSession();
            setIsActive(true);
            setStatus('Point camera at flat surface & tap to place.');
        } catch (error) {
            setStatus(`Error: ${error.message}`);
        }
    };

    const endAR = () => {
        arService.endSession();
        setIsActive(false);
        if (onClose) onClose();
    };

    // Note: React logic for 3D overlay usually hooks into a canvas (R3F)
    // For this prototype, we'll simulate the UI controls overlay.

    if (!isSupported) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl p-6 max-w-sm text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">AR Not Supported</h3>
                    <p className="text-slate-600 mb-4">Your device or browser doesn't support WebXR. Try using Chrome on Android or an iOS device with a WebXR viewer.</p>
                    <button onClick={onClose} className="bg-slate-900 text-white px-4 py-2 rounded-lg">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col pointer-events-none">
            {/* UI Overlay */}
            <div className="bg-black/40 backdrop-blur-md text-white p-4 flex justify-between items-center pointer-events-auto">
                <div className="flex items-center gap-3">
                    <Box className="w-6 h-6 text-emerald-400" />
                    <div>
                        <h3 className="font-bold">{strainName}</h3>
                        <p className="text-xs opacity-70">AR Visualizer</p>
                    </div>
                </div>
                <button onClick={endAR} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Instruction / Status */}
            {status && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur rounded-full px-4 py-2 text-sm text-white pointer-events-auto">
                    {status}
                </div>
            )}

            {/* Start Button if not active */}
            {!isActive && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto">
                    <button
                        onClick={startAR}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-8 py-3 rounded-full shadow-lg shadow-emerald-500/20 transform transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <Box className="w-5 h-5" />
                        Start AR Session
                    </button>
                </div>
            )}
        </div>
    );
};

export default ARStrainViewer;
