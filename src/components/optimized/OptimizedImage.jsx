import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const OptimizedImage = ({ src, alt, fallbackSrc = 'https://images.unsplash.com/photo-1608678280017-d572791e2338?auto=format&fit=crop&w=400&q=60', className, ...props }) => {
    const [imgSrc, setImgSrc] = useState(null); // Null initial to show placeholder/loading
    const [isLoaded, setIsLoaded] = useState(false);
    const imgRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setImgSrc(src);
                    observer.disconnect();
                }
            });
        });

        if (imgRef.current) observer.observe(imgRef.current);

        return () => observer.disconnect();
    }, [src]);

    const handleError = () => {
        if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
        }
    };

    return (
        <div ref={imgRef} className={`relative overflow-hidden bg-gray-200 ${className}`} {...props}>
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                    <span className="sr-only">Loading...</span>
                </div>
            )}
            {imgSrc && (
                <motion.img
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isLoaded ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    src={imgSrc}
                    alt={alt}
                    className={`w-full h-full object-cover ${!isLoaded ? 'invisible' : ''}`}
                    onLoad={() => setIsLoaded(true)}
                    onError={handleError}
                />
            )}
        </div>
    );
};

export default React.memo(OptimizedImage);
