import { supabase } from '../supabase';

export interface StrainJournal {
    id?: number;
    user_id?: string;
    strain_id: string;
    rating: number; // 1-5
    dosage?: string;
    effects: string[];
    notes?: string;
    activity_tags: string[];
    created_at?: string;
    updated_at?: string;
}

export const createJournal = async (journal: StrainJournal) => {
    const { data, error } = await supabase
        .from('strain_journals')
        .insert([journal])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getJournalsForUser = async (userId: string) => {
    const { data, error } = await supabase
        .from('strain_journals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const updateJournal = async (id: number, updates: Partial<StrainJournal>) => {
    const { data, error } = await supabase
        .from('strain_journals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteJournal = async (id: number) => {
    const { error } = await supabase
        .from('strain_journals')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};
