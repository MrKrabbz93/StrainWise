import { supabaseReplica as supabase } from '../supabase';

// Service Role logic removed in favor of centralized client usage.
// Assuming client-side execution or proper environment config in ../supabase.


/**
 * Analyzes a user's journals to find their favorite activities and associated strains.
 * @param userId - The user to analyze.
 * @returns A map of activity -> array of { strainId, score }.
 */
export async function getUserActivityPreferences(userId: string): Promise<Map<string, Array<{ strainId: string; score: number }>>> {
    if (!supabase) return new Map();

    const { data: journals, error } = await supabase
        .from('strain_journals')
        .select('strain_id, activity_tags, rating')
        .eq('user_id', userId)
        .not('activity_tags', 'is', null);

    if (error || !journals) {
        console.error('Error fetching journals for activity analysis:', error);
        return new Map();
    }

    const activityMap = new Map<string, Map<string, number[]>>();

    // 1. Aggregate ratings for each (activity, strain) pair
    journals.forEach((journal: any) => {
        journal.activity_tags.forEach((activity: string) => {
            if (!activityMap.has(activity)) {
                activityMap.set(activity, new Map());
            }
            const strainMap = activityMap.get(activity)!;
            if (!strainMap.has(journal.strain_id)) {
                strainMap.set(journal.strain_id, []);
            }
            strainMap.get(journal.strain_id)!.push(journal.rating);
        });
    });

    // 2. Calculate average scores and find top strains for each activity
    const finalPreferences = new Map<string, Array<{ strainId: string; score: number }>>();

    activityMap.forEach((strainMap, activity) => {
        const scoredStrains = Array.from(strainMap.entries()).map(([strainId, ratings]) => {
            const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            return { strainId, score: avgRating };
        });

        // Sort by score and take the top 5 for each activity
        scoredStrains.sort((a, b) => b.score - a.score);
        finalPreferences.set(activity, scoredStrains.slice(0, 5));
    });

    return finalPreferences;
}
