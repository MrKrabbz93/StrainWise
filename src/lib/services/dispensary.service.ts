import { supabaseReplica as supabase } from '../supabase';

// Define types for better developer experience
export interface Dispensary {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    latitude: number;
    longitude: number;
    phone?: string;
    website?: string;
    hours?: Record<string, string>; // e.g. { "Monday": "9am-9pm" }
    rating: number;
    is_partner: boolean;
    distance?: number; // Calculated on client or via RPC
}

export interface InventoryItem {
    strain_id: string;
    product_type: string;
    price_eighth?: number;
    price_metric?: number;
    in_stock: boolean;
    dispensary_id: string;
}

/**
 * Fetch dispensaries near a location.
 * Currently uses client-side distance sorting for simplicity, 
 * but should use PostGIS 'st_distance_sphere' in production via RPC.
 */
export async function getNearbyDispensaries(lat: number, lng: number, radiusMiles: number = 25): Promise<Dispensary[]> {
    if (!lat || !lng) return [];

    // Fetch all (or a reasonable subset) and filter/sort in memory for MVP.
    // In production: Use an RPC call `get_nearby_dispensaries(lat, lng, radius)`
    const { data, error } = await supabase
        .from('dispensaries')
        .select('*');

    if (error) {
        console.error("Error fetching dispensaries:", error);
        return [];
    }

    // Calculate distance and filter
    const dispensariesWithDist = data.map((d: Dispensary) => {
        const dist = haversineDistance(lat, lng, d.latitude, d.longitude);
        return { ...d, distance: dist };
    }).filter((d: Dispensary) => d.distance! <= radiusMiles);

    return dispensariesWithDist.sort((a: Dispensary, b: Dispensary) => (a.distance || 0) - (b.distance || 0));
}

/**
 * Get detailed inventory for a specific dispensary.
 */
export async function getDispensaryInventory(dispensaryId: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
        .from('dispensary_inventory')
        .select('*')
        .eq('dispensary_id', dispensaryId)
        .eq('in_stock', true);

    if (error) {
        console.error("Error fetching inventory:", error);
        return [];
    }
    return data as InventoryItem[];
}

/**
 * Find which dispensaries have a specific strain in stock.
 * Helpful for "Where can I buy Blue Dream?"
 */
export async function getDispensariesWithStrain(strainId: string, lat: number, lng: number, radiusMiles: number = 25): Promise<(Dispensary & InventoryItem)[]> {
    // 1. Get Inventory records for this strain
    const { data: inventory, error: invError } = await supabase
        .from('dispensary_inventory')
        .select('*')
        .eq('strain_id', strainId)
        .eq('in_stock', true);

    if (invError || !inventory || inventory.length === 0) return [];

    const dispensaryIds = inventory.map((i: any) => i.dispensary_id);
    const inventoryMap = new Map();
    inventory.forEach((i: any) => inventoryMap.set(i.dispensary_id, i));

    // 2. Get Dispensary details
    const { data: dispensaries, error: dispError } = await supabase
        .from('dispensaries')
        .select('*')
        .in('id', dispensaryIds);

    if (dispError) return [];

    // 3. Merge and Sort by distance
    let results = dispensaries.map((d: any) => {
        const dist = haversineDistance(lat, lng, d.latitude, d.longitude);
        const inv = inventoryMap.get(d.id);
        return { ...d, ...inv, distance: dist }; // Merge inventory info (prices) with dispensary info
    });

    // 4. Filter by radius and sort
    results = results
        .filter((d: any) => d.distance <= radiusMiles)
        .sort((a: any, b: any) => a.distance - b.distance);

    return results;
}

// --- Helpers ---

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}
