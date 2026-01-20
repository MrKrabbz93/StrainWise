import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2 } from 'lucide-react';

const ProfileImageUpload = ({ imageUrl, onFileSelect, size = 'lg', editable = true, isLoading = false }) => {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && onFileSelect) {
            onFileSelect(file);
        }
    };

    const sizeClasses = {
        sm: "w-10 h-10",
        md: "w-16 h-16",
        lg: "w-24 h-24",
        xl: "w-32 h-32"
    };

    return (
        <div className="relative group inline-block">
            {/* Image Container */}
            <div className={`${sizeClasses[size] || sizeClasses.md} rounded-full overflow-hidden border-2 border-emerald-500/30 bg-slate-800 shadow-xl relative z-10`}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover transition-opacity duration-300"
                        style={{ opacity: isLoading ? 0.5 : 1 }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                        <ImageIcon className="w-1/2 h-1/2 opacity-50" />
                    </div>
                )}

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    </div>
                )}
            </div>

            {/* Edit Button */}
            {editable && !isLoading && (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-full shadow-lg border-2 border-slate-900 transition-transform transform hover:scale-110 z-20"
                    title="Change Profile Picture"
                >
                    <Camera className="w-4 h-4" />
                </button>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
};

export default ProfileImageUpload;
