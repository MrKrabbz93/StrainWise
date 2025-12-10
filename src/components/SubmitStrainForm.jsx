import React, { useState } from 'react';
import { Save, AlertTriangle, Check, Loader2, Leaf } from 'lucide-react';

const SubmitStrainForm = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'Hybrid',
        thc_level: '',
        cbd_level: '',
        effects: '',
        flavor: '',
        description: ''
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');
    const [verifiedSource, setVerifiedSource] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('Verifying with AI & Cannabis Databases...');
        setVerifiedSource(null);

        try {
            const response = await fetch('/api/verify-and-add-strain', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            setStatus('success');
            setMessage(data.message);
            setVerifiedSource(data.verification_source);
            if (onSuccess) onSuccess(data.strain);
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
                    <Leaf className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Contribute to the Archive</h2>
                    <p className="text-xs text-slate-400">All submissions are verified by AI against trusted sources.</p>
                </div>
            </div>

            {status === 'success' ? (
                <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                        <Check className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Strain Added Successfully!</h3>
                        <p className="text-slate-400 text-sm mt-1">Thank you for contributing to the community.</p>
                        {verifiedSource && (
                            <a href={verifiedSource} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline mt-2 inline-block">
                                Verified Source
                            </a>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setStatus('idle');
                            setFormData({ name: '', type: 'Hybrid', thc_level: '', cbd_level: '', effects: '', flavor: '', description: '' });
                        }}
                        className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Submit Another
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Strain Name *</label>
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Blue Dream"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none transition-colors"
                            >
                                <option value="Sativa">Sativa</option>
                                <option value="Indica">Indica</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">THC Level</label>
                            <input
                                name="thc_level"
                                value={formData.thc_level}
                                onChange={handleChange}
                                placeholder="e.g. 18-24%"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">CBD Level</label>
                            <input
                                name="cbd_level"
                                value={formData.cbd_level}
                                onChange={handleChange}
                                placeholder="e.g. <1%"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Effects</label>
                        <textarea
                            name="effects"
                            value={formData.effects}
                            onChange={handleChange}
                            placeholder="e.g. Relaxed, Happy, Euphoric, Creative"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none h-20 resize-none transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Flavors / Terpenes</label>
                        <textarea
                            name="flavor"
                            value={formData.flavor}
                            onChange={handleChange}
                            placeholder="e.g. Berry, Earthy, Sweet, Citrus"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none h-20 resize-none transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Description (Optional)</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Brief description or history..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-emerald-500/50 outline-none h-24 resize-none transition-colors"
                        />
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
                            disabled={status === 'loading'}
                            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Verify & Add
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default SubmitStrainForm;
