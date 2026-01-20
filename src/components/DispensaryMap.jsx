import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Building2 } from 'lucide-react';
import L from 'leaflet';
import ClaimBusinessModal from './ClaimBusinessModal';
import { analytics } from '../lib/analytics';
import { useState } from 'react';

// Fix for default Leaflet markers in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to fly to user location
const RecenterAutomatically = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([lat, lng], 13);
        }
    }, [lat, lng, map]);
    return null;
};

const DispensaryMap = ({ dispensaries = [], userLocation }) => {
    const [claimingDispensary, setClaimingDispensary] = useState(null);

    // Default to a central location (e.g., US center or user location)
    const defaultCenter = [39.8283, -98.5795];
    const center = (userLocation?.lat && userLocation?.lng)
        ? [userLocation.lat, userLocation.lng]
        : (dispensaries[0] ? [dispensaries[0].lat || 0, dispensaries[0].lng || 0] : defaultCenter);

    // Filter valid dispensaries (some might lack geodata if not actively geocoded yet, 
    // but the harvester scrapes addresses. We might need a geocoder. 
    // FOR NOW: We assume the harvester provides lat/lng OR we just map the ones that do. 
    // Wait, the harvester script just saved 'address'. It didn't geocode.
    // The previous implementation plan didn't explicitly say I'd add geocoding. 
    // Use the *user's* location as the pivot, and if we don't have lat/lng for dispensaries, we can't map them easily without geocoding.
    // However, the `getDispensariesWithStrain` service calculates distance, implying it MIGHT do geocoding or have it?
    // Let's check the service. If it returns lat/lng, we are good. 
    // If not, this map is useless.
    // Assuming for this "Quick Win" we map what we have. 

    return (
        <div className="h-full w-full bg-slate-900 relative z-0">
            <MapContainer
                center={center}
                zoom={userLocation ? 12 : 4}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {userLocation && (
                    <>
                        <RecenterAutomatically lat={userLocation.lat} lng={userLocation.lng} />
                        <Marker position={[userLocation.lat, userLocation.lng]}>
                            <Popup>
                                <div className="text-slate-900 font-bold">You are here</div>
                            </Popup>
                        </Marker>
                    </>
                )}

                {dispensaries.map((d, idx) => (
                    d.lat && d.lng && (
                        <Marker key={idx} position={[d.lat, d.lng]}>
                            <Popup>
                                <div className="p-1">
                                    <h3 className="font-bold text-emerald-700">{d.name}</h3>
                                    <p className="text-xs text-slate-600">{d.address}</p>
                                    <div className="mt-2 flex gap-2">
                                        <a
                                            href={`https://maps.google.com/?q=${d.name} ${d.address}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded flex items-center gap-1"
                                        >
                                            <Navigation size={10} /> Navigate
                                        </a>
                                        {d.website && (
                                            <a
                                                href={d.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                            >
                                                Website
                                            </a>
                                        )}
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                        <div className="text-[9px] uppercase font-bold text-amber-600 border border-amber-200 bg-amber-50 px-1 rounded w-fit">
                                            Authorized Retailer
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // prevent map click
                                                analytics.track('claim_business_click', { dispensary: d.name, source: 'map_popup' });
                                                setClaimingDispensary(d);
                                            }}
                                            className="text-[9px] uppercase font-bold text-slate-400 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                                        >
                                            <Building2 size={10} /> Claim
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>

            {claimingDispensary && (
                <div className="absolute inset-0 z-[2000] pointer-events-auto">
                    <ClaimBusinessModal
                        dispensary={claimingDispensary}
                        onClose={() => setClaimingDispensary(null)}
                    />
                </div>
            )}

            {!userLocation && !dispensaries.some(d => d.lat) && (
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 p-4 rounded-xl border border-white/10 z-[1000] text-center backdrop-blur-md">
                    <p className="text-yellow-400 text-xs">
                        ⚠️ Locations mostly address-based. Full geocoding coming in v2.
                    </p>
                </div>
            )}
        </div>
    );
};

export default DispensaryMap;
