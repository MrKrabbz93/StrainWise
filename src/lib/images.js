export const getStrainImageUrl = (strain) => {
    // Curated Unsplash Image IDs for premium aesthetic
    const visualProfiles = {
        purple: "1550529949-9f895c9705a3", // Purple cannabis
        green_sativa: "1589337077382-36c561b32d20", // Bright green sativa
        frosty: "1603525547614-74768393c52a", // Trichomes close up
        orange: "1602167382229-3a3f06927954", // Orange hairs
        dark: "1606735584883-7c3e2182d334", // Dark moody
        default: "1534073383561-bd872db2f01f" // Generic high quality
    };

    const imageId = visualProfiles[strain.visual_profile] || visualProfiles.default;
    // Unsplash Source URL (High Quality Optimized)
    return `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=1200&q=90`;
};
