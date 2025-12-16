import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

const DispensaryMap = () => {
    const [mapError, setMapError] = useState(false);

    useEffect(() => {
        // Check if Google Maps API key is available
        if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
            setMapError(true);
            console.warn('Google Maps API key is missing');
        }
    }, []);

    if (mapError) {
        return (
            <div className="h-full bg-slate-800 flex items-center justify-center">
                <div className="text-center p-6">
                    <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Map Unavailable</h3>
                    <p className="text-slate-400 mb-4">Google Maps API key is required for this feature</p>
                    <p className="text-xs text-slate-500">Please add VITE_GOOGLE_MAPS_API_KEY to your environment variables</p>
                </div>
            </div>
        );
    }

    // Placeholder for when Google Maps is properly configured
    return (
        <div className="h-full bg-slate-800 flex items-center justify-center">
            <div className="text-center p-6">
                <MapPin className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Interactive Map</h3>
                <p className="text-slate-400">Google Maps will load here with dispensary locations</p>
            </div>
        </div>
    );
};

export default DispensaryMap;
