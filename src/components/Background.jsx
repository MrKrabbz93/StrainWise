import React from 'react';

const Background = () => {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-[#020617] pointer-events-none">
            {/* Optimized Static Gradients for Performance */}
            <div
                className="absolute -top-[10%] -left-[10%] w-[80vw] h-[80vw] rounded-full opacity-20 blur-[120px]"
                style={{
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
                    willChange: 'transform'
                }}
            />

            <div
                className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full opacity-15 blur-[120px]"
                style={{
                    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%)',
                    willChange: 'transform'
                }}
            />

            <div
                className="absolute -bottom-[10%] left-[20%] w-[70vw] h-[70vw] rounded-full opacity-10 blur-[120px]"
                style={{
                    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%)',
                    willChange: 'transform'
                }}
            />

            {/* Subtle Noise Texture instead of SVG Grid for lower paint cost */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay"></div>
        </div>
    );
};

export default React.memo(Background);
