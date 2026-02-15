import React from 'react';
import { motion } from 'framer-motion';

export const Logo = ({ className = "w-12 h-12", withText = true }) => {
    return (
        <div className="flex items-center gap-4 select-none group cursor-pointer">
            <div className={`relative ${className} flex items-center justify-center`}>
                <img
                    src="/logo-icon-transparent.png"
                    alt="Logo"
                    className="w-full h-full object-contain scale-110"
                />
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
