import { supabase } from '../supabase';

export const updateProfile = async (profileData) => {
    // Required: { id, username, bio, avatar_url, interests }
    const { id, username, bio, avatar_url, interests } = profileData;

    // Validate ID (Critical for RLS)
    if (!id) throw new Error("User ID is required for profile update.");

    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id,
            username,
            bio,
            avatar_url,
            interests,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error("User Service Error:", error);
        throw error;
    }

    return data;
};
