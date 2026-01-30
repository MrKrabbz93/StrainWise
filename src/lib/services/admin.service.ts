import { supabase } from '../supabase';

export interface LeadStats {
    total: number;
    cold: number;
    sent: number;
    engaged: number;
    partner: number;
}

export interface InventoryStats {
    totalStrains: number;
    geocodedDispensaries: number;
    activeMenus: number;
}

export interface AgentEngagement {
    id: string;
    target_handle: string;
    status: string;
    timestamp: string;
    content: string;
}

/**
 * Fetch aggregated metrics for the Lead Pipeline
 */
export async function fetchLeadMetrics(): Promise<LeadStats> {
    const { data: leads, error } = await (supabase
        .from('dispensaries')
        .select('outreach_status') as any);

    if (error) throw error;

    const stats: LeadStats = {
        total: leads.length,
        cold: leads.filter((l: any) => !l.outreach_status || l.outreach_status === 'cold').length,
        sent: leads.filter((l: any) => l.outreach_status === 'sent').length,
        engaged: leads.filter((l: any) => l.outreach_status === 'engaged').length,
        partner: leads.filter((l: any) => l.outreach_status === 'partner').length,
    };

    return stats;
}

/**
 * Fetch stats regarding geocoding and inventory harvesting
 */
export async function fetchInventoryHealth(): Promise<InventoryStats> {
    const { count: strainCount } = await (supabase.from('strains').select('*', { count: 'exact', head: true }) as any);
    const { count: geoCount } = await (supabase.from('dispensaries').select('*', { count: 'exact', head: true }).not('latitude', 'is', null) as any);
    const { count: menuCount } = await (supabase.from('dispensary_inventory').select('dispensary_id', { count: 'exact', head: true }) as any);

    return {
        totalStrains: strainCount || 0,
        geocodedDispensaries: geoCount || 0,
        activeMenus: menuCount || 0
    };
}

/**
 * Fetch the 10 most recent agent engagements (The HUD feed)
 */
export async function fetchRecentEngagements(): Promise<AgentEngagement[]> {
    const { data, error } = await (supabase
        .from('dispensaries')
        .select('id, name, twitter_handle, outreach_status, last_contacted_at, lead_notes')
        .not('last_contacted_at', 'is', null)
        .order('last_contacted_at', { ascending: false })
        .limit(10) as any);

    if (error) throw error;

    return (data as any[]).map(d => ({
        id: d.id,
        target_handle: d.twitter_handle || d.name,
        status: d.outreach_status,
        timestamp: d.last_contacted_at,
        content: d.lead_notes || ''
    }));
}
