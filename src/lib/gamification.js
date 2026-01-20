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
    PUBLIC_REVIEW: 75,
    PRIVATE_JOURNAL: 15,
    DAILY_LOGIN: 10,
    LIKE_RECEIVED: 5,
    REFERRAL_SIGNUP: 250
};

export const BADGES = {
    PIONEER: { id: 'pioneer', name: 'First Contact', icon: '🛰️', desc: 'First referral successful' },
    CONNECTOR: { id: 'connector', name: 'Mycelium Connector', icon: '🕸️', desc: '5 pioneers invited' },
    EVANGELIST: { id: 'evangelist', name: 'Strain Evangelist', icon: '📢', desc: '10 pioneers invited' },
    NETWORK_LORD: { id: 'network_lord', name: 'Network Lord', icon: '🌍', desc: '50 pioneers invited' },
    LEGENDARY_RECRUITER: { id: 'legendary', name: 'Legendary Recruiter', icon: '👑', desc: '100 pioneers invited' },
    EARLY_ADOPTER: { id: 'early_adopter', name: 'Founding Member', icon: '💎', desc: 'Participated in the first 1000 users of the Mycelium network.' },
};

export const REFERRAL_MILESTONES = [
    { count: 1, badge: BADGES.PIONEER },
    { count: 5, badge: BADGES.CONNECTOR },
    { count: 10, badge: BADGES.EVANGELIST },
    { count: 50, badge: BADGES.NETWORK_LORD },
    { count: 100, badge: BADGES.LEGENDARY_RECRUITER }
];

export const checkReferralMilestones = async (userId) => {
    try {
        const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('referred_by', userId);

        const { data: profile } = await supabase.from('profiles').select('badges').eq('id', userId).single();
        if (!profile) return null;

        const currentBadges = profile.badges || [];
        const newBadges = [...currentBadges];
        let newlyUnlocked = [];

        REFERRAL_MILESTONES.forEach(m => {
            if (count >= m.count && !currentBadges.includes(m.badge.id)) {
                newBadges.push(m.badge.id);
                newlyUnlocked.push(m.badge);
            }
        });

        if (newlyUnlocked.length > 0) {
            await supabase.from('profiles').update({ badges: newBadges }).eq('id', userId);
            return newlyUnlocked;
        }
        return null;
    } catch (e) {
        console.error("Badge Error:", e);
        return null;
    }
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
            rankUpMsg = `You've reached the rank of ${newRankObj.icon} ${newRankObj.name}!`;

            // Trigger Premium Notification
            try {
                const { useUIStore } = await import('./stores/ui.store');
                useUIStore.getState().addNotification(rankUpMsg, 'rank_up', 10000);
            } catch (e) {
                console.warn("Could not trigger rank up notification:", e);
            }

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

export const awardEarlyAdopter = async (userId) => {
    try {
        const { data: profile } = await supabase.from('profiles').select('badges').eq('id', userId).single();
        if (!profile || profile?.badges?.includes(BADGES.EARLY_ADOPTER.id)) return;

        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

        if (count && count <= 1000) {
            const newBadges = [...(profile?.badges || []), BADGES.EARLY_ADOPTER.id];
            await supabase.from('profiles').update({ badges: newBadges }).eq('id', userId);

            // Notification
            try {
                const { useUIStore } = await import('./stores/ui.store');
                useUIStore.getState().addNotification(`💎 Awarded Badge: ${BADGES.EARLY_ADOPTER.name}`, 'badge', 10000);
            } catch (e) { }

            return true;
        }
    } catch (e) {
        console.error("Early Adopter Error:", e);
    }
    return false;
};
