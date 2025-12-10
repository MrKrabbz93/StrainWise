import React, { useState } from 'react';
import { Save, AlertTriangle, Check, Loader2, Store, MapPin, Globe } from 'lucide-react';

const SubmitDispensaryForm = ({ user, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        website: '',
        city: '',
        state: ''
    });
    const [useMyLocation, setUseMyLocation] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');
    const [earnedXP, setEarnedXP] = useState(0);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMyLocation = () => {
        if (navigator.geolocation) {
            setStatus('locating');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // In a real app, we'd reverse geocode here. 
                    // For now, we'll just store the coords as a string or handle in backend if needed.
                    // But the form asks for address. Let's just flag it.
                    setUseMyLocation(true);
                    setFormData(prev => ({
                        ...prev,
                        address: `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`
                    }));
                    setStatus('idle');
                },
                (err) => {
                    console.error(err);
                    alert("Could not retrieve location.");
                    setStatus('idle');
                }
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('Verifying Dispensary...');

        try {
            const response = await fetch('/api/add-dispensary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    user_id: user?.id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Submission failed');
            }

            setStatus('success');
            setEarnedXP(data.earned_xp || 0);
            setMessage(data.message);
            if (onSuccess) onSuccess(data.dispensary);
        } catch (error) {
            console.error("Submission error:", error);
            setStatus('error');
            setMessage(error.message);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto shadow-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                    <Store className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Add Local Dispensary</h2>
                    <p className="text-xs text-slate-400">Earn XP by expanding our map.</p>
                </div>
            </div>

            {status === 'success' ? (
                <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                        <Check className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Dispensary Added!</h3>
                        <p className="text-slate-400 text-sm mt-1">Thank you for your contribution.</p>
                        {earnedXP > 0 && (
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/20 font-bold">
                                +{earnedXP} XP Earned!
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setStatus('idle');
                            setFormData({ name: '', address: '', website: '', city: '', state: '' });
                            setEarnedXP(0);
                        }}
                        className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Add Another
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Dispensary Name *</label>
                        <input
                            required
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Green Horizon Collective"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                            Address *
                            <button type="button" onClick={handleMyLocation} className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Use My Location
                            </button>
                        </label>
                        <input
                            required
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="123 Main St, City, State"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="City"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none transition-colors"
                        />
                        <input
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="State"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Website (Optional)</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-3.5 w-4 h-4 text-slate-600" />
                            <input
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 pl-10 text-slate-200 focus:border-emerald-500/50 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {status === 'error' && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {message}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'locating'}
                            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Submit & Earn XP
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default SubmitDispensaryForm;
