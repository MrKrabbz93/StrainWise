import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Save, X, Sparkles, User, FileText, Hash, Upload } from 'lucide-react';

const EditProfilePanel = ({ editForm, setEditForm, onSave, onCancel, onGenerateAvatar, onUpload, isGenerating }) => {

    const handleChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto shadow-2xl relative overflow-hidden"
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-center mb-8 relative z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <User className="w-6 h-6 text-emerald-400" />
                    Edit Profile
                </h2>
                <button
                    onClick={onCancel}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-6 relative z-10">
                {/* Avatar Section */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-full md:w-1/3 flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 shadow-xl bg-slate-950 flex items-center justify-center relative">
                                {editForm.avatar_url ? (
                                    <img src={editForm.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-slate-600" />
                                )}

                                {/* Hover Overlay for Upload */}
                                <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Upload className="w-6 h-6 text-white mb-1" />
                                    <span className="text-[10px] text-white font-medium">Upload Photo</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={onUpload}
                                    />
                                </label>
                            </div>

                            {/* Generate Button (Floating) */}
                            <button
                                onClick={onGenerateAvatar}
                                disabled={isGenerating}
                                className="absolute -bottom-2 -right-2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg transition-transform hover:scale-110 disabled:opacity-50 border-2 border-slate-900"
                                title="Generate AI Avatar"
                            >
                                {isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 text-center max-w-[150px]">
                            Upload a photo or tap <span className="text-purple-400 font-bold">Sparkles</span> to generate an AI avatar.
                        </p>
                    </div>

                    <div className="w-full md:w-2/3 space-y-4">
                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <span className="w-4 h-4 flex items-center justify-center bg-slate-800 rounded text-[10px]">@</span>
                                Username
                            </label>
                            <input
                                type="text"
                                value={editForm.username}
                                onChange={(e) => handleChange('username', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                placeholder="YourAlias"
                            />
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <FileText className="w-3 h-3" />
                                Bio
                            </label>
                            <textarea
                                value={editForm.bio}
                                onChange={(e) => handleChange('bio', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all min-h-[100px]"
                                placeholder="Tell the community about your journey..."
                            />
                        </div>

                        {/* Interests */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Hash className="w-3 h-3" />
                                Interests (comma separated)
                            </label>
                            <input
                                type="text"
                                value={editForm.interests}
                                onChange={(e) => handleChange('interests', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                placeholder="Indica, Myrcene, Sleep, Cooking"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t border-slate-800 mt-6">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 px-6 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Save Changes
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default EditProfilePanel;
