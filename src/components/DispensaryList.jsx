import React from 'react';
import DispensaryMap from './DispensaryMap';
import { MapPin, Star, Phone, Clock } from 'lucide-react';

const DispensaryList = ({ dispensaries, userLocation }) => {
    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex gap-6">
            {/* List View */}
            <div className="w-1/3 overflow-y-auto pr-2 space-y-4">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">Nearby Dispensaries</h2>
                {dispensaries.map(d => (
                    <div key={d.id} className="bg-slate-900/50 border border-white/10 p-4 rounded-xl hover:border-emerald-500/30 transition-colors cursor-pointer group">
                        <h3 className="font-bold text-lg text-slate-200 group-hover:text-emerald-400 transition-colors">{d.name}</h3>
                        <div className="flex items-center gap-1 text-emerald-500 text-sm mb-2">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{d.rating}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-500">Cannabis Store</span>
                        </div>
                        <div className="space-y-2 text-sm text-slate-400">
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{d.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span className="text-emerald-400/80">Open Now</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Map View */}
            <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 relative">
                <DispensaryMap dispensaries={dispensaries} userLocation={userLocation} />
            </div>
        </div>
    );
};

export default DispensaryList;
