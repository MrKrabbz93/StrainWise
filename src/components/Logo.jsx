import React from 'react';

export const Logo = ({ className = "w-8 h-8", withText = true }) => {
    return (
        <div className="flex items-center gap-3">
            <div className={`relative ${className} flex items-center justify-center`}>
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                >
                    <defs>
                        <linearGradient id="brand-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#15803d" />   {/* green-700 */}
                            <stop offset="100%" stopColor="#22c55e" /> {/* green-500 */}
                        </linearGradient>
                    </defs>

                    {/* Outer Circle Ring (Broken/Stylized) */}
                    <path
                        d="M50 5 A 45 45 0 1 1 50 95 A 45 45 0 0 1 50 5"
                        stroke="url(#brand-gradient)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeOpacity="0.8"
                        fill="none"
                    />

                    {/* Center Leaf */}
                    <path
                        d="M50 85 Q 50 60, 50 15 Q 50 60, 50 85 Z"
                        stroke="url(#brand-gradient)"
                        strokeWidth="2"
                        className="opacity-50"
                    />
                    <path
                        d="M50 85 Q 30 55, 50 10 Q 70 55, 50 85 Z"
                        fill="url(#brand-gradient)"
                    />

                    {/* Left Leaves */}
                    <path
                        d="M45 80 Q 20 60, 20 30 Q 30 50, 45 80 Z"
                        fill="url(#brand-gradient)"
                    />
                    <path
                        d="M48 82 Q 35 70, 15 60 Q 30 70, 48 82 Z"
                        fill="url(#brand-gradient)"
                    />

                    {/* Right Leaves */}
                    <path
                        d="M55 80 Q 80 60, 80 30 Q 70 50, 55 80 Z"
                        fill="url(#brand-gradient)"
                    />
                    <path
                        d="M52 82 Q 65 70, 85 60 Q 70 70, 52 82 Z"
                        fill="url(#brand-gradient)"
                    />
                </svg>
            </div>

            {withText && (
                <div className="flex flex-col select-none">
                    <span className="font-bold text-2xl tracking-tight leading-none text-white drop-shadow-sm">
                        Strain<span className="text-emerald-400">Wise</span>
                    </span>
                </div>
            )}
        </div>
    );
};

export default Logo;
