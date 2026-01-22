import React from 'react';
import { motion } from 'framer-motion';

export const Logo = ({ className = "w-12 h-12", withText = true }) => {
    return (
        <div className="flex items-center gap-4 select-none group cursor-pointer">
            <div className={`relative ${className} flex items-center justify-center`}>
                {/* 3D Depth Layer */}
                <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full relative z-10 drop-shadow-[0_20px_20px_rgba(0,0,0,0.6)]"
                >
                    <defs>
                        <linearGradient id="premium-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="50%" stopColor="#059669" />
                            <stop offset="100%" stopColor="#064e3b" />
                        </linearGradient>
                        <linearGradient id="crystal-shine" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                            <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
                        </linearGradient>
                    </defs>

                    {/* Architectural Leaf Base (7 Points) */}
                    <motion.path
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2 }}
                        d="M50 10 L58 35 L85 35 L62 50 L75 75 L50 60 L25 75 L38 50 L15 35 L42 35 Z"
                        fill="url(#premium-gradient)"
                        className="filter drop-shadow-2xl"
                    />

                    {/* Inner Facets for 'Crystal' look */}
                    <path
                        d="M50 10 L50 60 L75 75 Z"
                        fill="rgba(0,0,0,0.2)"
                    />
                    <path
                        d="M50 10 L50 60 L25 75 Z"
                        fill="rgba(255,255,255,0.1)"
                    />

                    {/* The Intelligence Core (Center) */}
                    <motion.circle
                        cx="50"
                        cy="45"
                        r="8"
                        fill="#020617"
                        stroke="#10b981"
                        strokeWidth="1"
                        initial={{ r: 0 }}
                        animate={{ r: 8 }}
                        transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                    />
                    <motion.circle
                        cx="50"
                        cy="45"
                        r="3"
                        fill="#10b981"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />

                    {/* Shine Layer */}
                    <path
                        d="M50 10 L58 35 L42 35 Z"
                        fill="url(#crystal-shine)"
                    />
                </svg>
            </div>

            {withText && (
                <div className="flex flex-col justify-center">
                    <span className="font-black text-2xl tracking-tighter premium-gradient-text uppercase">
                        StrainWise
                    </span>
                </div>
            )}
        </div>
    );
};

export default Logo;
