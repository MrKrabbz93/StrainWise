import { supabaseReplica as supabase } from '../supabase';
import { logFeedback } from './feedback.service';

// Service Role logic removed in favor of centralized client usage.
// If server-side admin access is needed, extensive refactoring would be required to support both contexts safely.
// For now, consistent replica usage via the shared client is prioritized.


/**
 * Calculates a personalized score for strains for a given user.
 * This is a simple collaborative filtering-inspired approach.
 * @param userId - The user to get recommendations for.
 * @param strainIds - A list of strain IDs to score.
 * @returns A map of strainId to score.
 */
import { getUserActivityPreferences } from './activity-pairing.service';

// ... (keep init logic)

/**
 * Calculates a personalized score for strains for a given user.
 * This is a simple collaborative filtering-inspired approach.
 * @param userId - The user to get recommendations for.
 * @param strainIds - A list of strain IDs to score.
 * @param targetActivity - Optional activity to optimize for.
 * @returns A map of strainId to score.
 */
export async function getPersonalizedScores(userId: string, strainIds: string[], targetActivity?: string): Promise<Map<string, number>> {
    const scores = new Map<string, number>();

    if (!supabase) return scores;

    // 1. Get the user's explicit feedback (thumbs-up/down)
    const { data: explicitFeedback, error: feedbackError } = await supabase
        .from('user_feedback')
        .select('strain_id, rating')
        .eq('user_id', userId);

    if (feedbackError) {
        console.error('Error fetching user feedback:', feedbackError);
        // We can continue without explicit feedback
    }

    // 2. Get the user's detailed journal entries
    const { data: journals, error: journalError } = await supabase
        .from('strain_journals')
        .select('strain_id, rating, effects, activity_tags')
        .eq('user_id', userId);

    if (journalError) {
        console.error('Error fetching user journals:', journalError);
        // We can continue without journal data
    }

    // 3. Create preference maps for quick lookups
    const explicitPrefs = new Map<string, number>();
    explicitFeedback?.forEach((item: any) => {
        explicitPrefs.set(item.strain_id, item.rating);
    });

    const journalPrefs = new Map<string, any>();
    journals?.forEach((item: any) => {
        journalPrefs.set(item.strain_id, item);
    });

    // 4. Score each candidate strain
    strainIds.forEach(strainId => {
        let personalizedScore = 0.5; // Base neutral score

        // Boost from explicit feedback (thumbs-up/down)
        const explicitRating = explicitPrefs.get(strainId) || 0;
        personalizedScore += explicitRating;

        // Boost from journal ratings (1-5 scale)
        const journalEntry = journalPrefs.get(strainId);
        if (journalEntry) {
            // Normalize 1-5 rating to a score boost between -0.4 and +0.4
            // 3 stars = 0 boost. 5 stars = +0.4. 1 star = -0.4.
            const ratingBoost = (journalEntry.rating - 3) * 0.2;
            personalizedScore += ratingBoost;
        }

        scores.set(strainId, personalizedScore);
    });

    // 5. Boost score based on activity preferences
    if (targetActivity) {
        try {
            const activityPreferences = await getUserActivityPreferences(userId);
            const preferredStrainsForActivity = activityPreferences.get(targetActivity) || [];

            preferredStrainsForActivity.forEach(({ strainId: preferredStrainId, score: activityScore }) => {
                if (scores.has(preferredStrainId)) {
                    // Boost the score for strains known to be good for this activity
                    const currentScore = scores.get(preferredStrainId)!;
                    scores.set(preferredStrainId, currentScore + (activityScore / 5)); // Normalize (max ~1.0) and add
                }
            });
        } catch (err) {
            console.error("Failed to apply activity preferences", err);
        }
    }

    return scores;
}
