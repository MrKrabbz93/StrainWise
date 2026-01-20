import { supabase } from '../supabase';
import { addXP, XP_EVENTS } from '../gamification';
import { moderateContent } from '../gemini';

export interface StrainJournal {
    id?: number;
    user_id?: string;
    strain_id: string;
    strain_name?: string;
    rating: number; // 1-5
    dosage?: string;
    effects: string[];
    notes?: string;
    review?: string;
    activity_tags: string[];
    is_public?: boolean;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

export const createJournal = async (journalRaw: StrainJournal) => {
    let journal = { ...journalRaw };
    let moderationResult = { safe: true, reason: '' };

    // AI Moderation for Public Reviews
    if (journal.is_public && journal.review) {
        moderationResult = await moderateContent(journal.review);
        if (!moderationResult.safe) {
            journal.status = 'flagged'; // Hide immediately
        }
    }

    const { data, error } = await (supabase
        .from('strain_journals') as any)
        .insert([journal])
        .select()
        .single();

    if (error) throw error;

    // If flagged by AI, log to content_reports automatically
    if (!moderationResult.safe) {
        await supabase.from('content_reports').insert([{
            reporter_id: '00000000-0000-0000-0000-000000000000', // System ID (AI)
            journal_id: data.id,
            reason: `AI Moderation Flag: ${moderationResult.reason}`,
            status: 'pending'
        }]);
    }

    // Award XP (Only if safe)
    let xpResult = null;
    if (journal.user_id && moderationResult.safe) {
        const xpAmount = journal.is_public ? XP_EVENTS.PUBLIC_REVIEW : XP_EVENTS.PRIVATE_JOURNAL;
        xpResult = await addXP(journal.user_id, xpAmount, journal.is_public ? 'Public Journal Entry' : 'Private Journal Entry');
    }

    return { data, xpResult, moderationResult };
};

export const getJournalsForUser = async (userId: string) => {
    const { data, error } = await (supabase
        .from('strain_journals') as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const updateJournal = async (id: number, updates: Partial<StrainJournal>) => {
    const { data, error } = await (supabase
        .from('strain_journals') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteJournal = async (id: number) => {
    const { error } = await (supabase
        .from('strain_journals') as any)
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};
