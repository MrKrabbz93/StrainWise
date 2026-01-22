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
                    className="w-full h-full relative z-10 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                >
                    <defs>
                        <linearGradient id="sw-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <filter id="sw-glow">
                            <feGaussianBlur stdDeviation="2" result="glow" />
                            <feComposite in="SourceGraphic" in2="glow" operator="over" />
                        </filter>
                    </defs>

                    {/* Premium Octagon Shield */}
                    <path
                        d="M30 10 H70 L90 30 V70 L70 90 H30 L10 70 V30 Z"
                        fill="#0f172a"
                        stroke="url(#sw-gradient)"
                        strokeWidth="1.5"
                    />

                    {/* The "SW" Monogram - World Class Architectural Lineup */}
                    <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        d="M25 35 C25 25, 45 25, 45 35 C45 45, 25 45, 25 55 C25 65, 45 65, 45 55"
                        stroke="url(#sw-gradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                        d="M55 35 V65 L75 35 V65"
                        stroke="white"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        style={{ opacity: 0.9 }}
                    />

                    {/* Tech Accents */}
                    <circle cx="80" cy="20" r="3" fill="#10b981" className="animate-pulse" />
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
