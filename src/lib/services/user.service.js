import { supabase } from '../supabase';

export const updateProfile = async (profileData) => {
    const { id, ...updates } = profileData;

    // Validate ID (Critical for RLS)
    if (!id) throw new Error("User ID is required for profile update.");

    // Clean updates object: remove undefined values and add updated_at
    const cleanUpdates = {
        id,
        updated_at: new Date().toISOString()
    };

    // Only include fields that are actually provided
    ['username', 'bio', 'avatar_url', 'interests', 'is_public', 'tutorial_completed'].forEach(field => {
        if (updates[field] !== undefined) {
            cleanUpdates[field] = updates[field];
        }
    });

    const { data, error } = await supabase
        .from('profiles')
        .upsert(cleanUpdates)
        .select()
        .single();

    if (error) {
        console.error("User Service Error:", error);
        throw error;
    }

    return data;
};
