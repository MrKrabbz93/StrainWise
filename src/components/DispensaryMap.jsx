import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Loader2 } from 'lucide-react';

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.75rem'
};

// Custom Dark Mode Style for Google Maps
const mapStyles = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
    },
];

const DispensaryMap = ({ dispensaries, center = { lat: -31.9505, lng: 115.8605 }, userLocation }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const [map, setMap] = useState(null);
    const [selectedDispensary, setSelectedDispensary] = useState(null);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    const mapCenter = userLocation || center;

    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
        return (
            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-6 text-center border border-slate-800 rounded-xl">
                <MapPin className="w-12 h-12 mb-4 text-slate-600" />
                <p className="font-medium text-slate-300">Map Unavailable</p>
                <p className="text-sm mt-2">Please add VITE_GOOGLE_MAPS_API_KEY to your .env file to enable the map.</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-emerald-400 border border-slate-800 rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={userLocation ? 13 : 12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                styles: mapStyles,
                disableDefaultUI: true,
                zoomControl: true,
            }}
        >
            {/* User Location Marker */}
            {userLocation && (
                <Marker
                    position={userLocation}
                    icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeColor: "white",
                        strokeWeight: 2,
                    }}
                    title="You are here"
                />
            )}

            {dispensaries.map((dispensary) => (
                <Marker
                    key={dispensary.id}
                    position={dispensary.location}
                    onClick={() => setSelectedDispensary(dispensary)}
                    icon={{
                        url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
                    }}
                />
            ))}

            {selectedDispensary && (
                <InfoWindow
                    position={selectedDispensary.location}
                    onCloseClick={() => setSelectedDispensary(null)}
                >
                    <div className="text-slate-900 p-1">
                        <h3 className="font-bold text-sm">{selectedDispensary.name}</h3>
                        <p className="text-xs text-slate-600">{selectedDispensary.rating} ★ Rating</p>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
};

export default React.memo(DispensaryMap);
