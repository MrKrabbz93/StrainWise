import { supabase } from './supabase';

export const RANKS = [
    { name: 'Seedling', minXP: 0, icon: '🌱' },
    { name: 'Sprout', minXP: 100, icon: '🌿' },
    { name: 'Cultivator', minXP: 500, icon: '🚜' },
    { name: 'Botanist', minXP: 1000, icon: '🔬' },
    { name: 'Master Grower', minXP: 2500, icon: '🏆' },
    { name: 'Legend', minXP: 5000, icon: '👑' }
];

export const XP_EVENTS = {
    ADD_STRAIN: 150,
    WRITE_REVIEW: 50,
    DAILY_LOGIN: 10
};

export const getRank = (xp) => {
    // Find the highest rank where xp >= minXP
    return RANKS.slice().reverse().find(r => xp >= r.minXP) || RANKS[0];
};

export const addXP = async (userId, amount, reason) => {
    try {
        // 1. Get current XP
        const { data: profile } = await supabase.from('profiles').select('xp, rank, username').eq('id', userId).single();
        if (!profile) return;

        const newXP = (profile.xp || 0) + amount;
        const newRankObj = getRank(newXP);
        const currentRankObj = RANKS.find(r => r.name === profile.rank) || RANKS[0];

        // 2. Update DB
        const updates = { xp: newXP };

        let rankUpMsg = null;

        // Check for Rank Up
        if (newRankObj.minXP > currentRankObj.minXP) {
            updates.rank = newRankObj.name;
            rankUpMsg = `Congratulations! You've reached the rank of ${newRankObj.icon} ${newRankObj.name}!`;

            // Post Rank Up Shoutout
            await supabase.from('community_activity').insert([{
                user_id: userId,
                type: 'rank_up',
                content: `${profile.username || 'A user'} promoted to ${newRankObj.name}!`,
                metadata: { old_rank: profile.rank, new_rank: newRankObj.name }
            }]);
        }

        await supabase.from('profiles').update(updates).eq('id', userId);

        return { newXP, rankUpMsg };
    } catch (error) {
        console.error("Error adding XP:", error);
    }
};

export const postStrainShoutout = async (userId, strainName) => {
    try {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', userId).single();
        const username = profile?.username || "A contributor";

        await supabase.from('community_activity').insert([{
            user_id: userId,
            type: 'new_strain',
            content: `📢 Shoutout to @${username} for adding "${strainName}" to the Encyclopedia!`,
            metadata: { strain: strainName }
        }]);
    } catch (error) {
        console.error("Error posting shoutout:", error);
    }
};
