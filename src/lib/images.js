// Helper to determine the URL. Re-implementing a simple getEnv here to avoid circular dependencies or complex imports, 
// as this is a utility file.
const getEnv = (key) => {
    try { if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env[key]; } catch (e) { }
    try { if (typeof process !== 'undefined' && process.env) return process.env[key]; } catch (e) { }
    return '';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');

/**
 * Generates a public CDN URL for a file in Supabase Storage.
 * @param {string} bucket - The storage bucket name (e.g. 'strains', 'assets')
 * @param {string} path - The file path within the bucket
 * @returns {string} - The public CDN URL
 */
export const getSupabaseFileUrl = (bucket, path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path; // Already a full URL
    // Clean path
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanPath}`;
};

export const getStrainImageUrl = (strain) => {
    // 1. Prefer explicit Supabase hosted image
    if (strain.image_url) {
        return getSupabaseFileUrl('strains', strain.image_url);
    }

    // 2. Fallback to Curated Unsplash Image IDs for premium aesthetic
    const visualProfiles = {
        purple: "1559828851-9e8a71d604e3", // Lavender/Purple aesthetic
        green_sativa: "1620134440788-e2187d90d3e2", // Vibrant Green Cannabis
        frosty: "1603525547614-74768393c52a", // Trichome Macro
        orange: "1632289437146-527c95697672", // Dried Orange/Amber tones
        dark: "1653839794503-68d172e0bfb5", // Dark/Moody Plant
        default: "1534073383561-bd872db2f01f" // Generic
    };

    const imageId = visualProfiles[strain.visual_profile] || visualProfiles.default;
    // Unsplash Source URL (High Quality Optimized)
    return `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=1200&q=90`;
};
