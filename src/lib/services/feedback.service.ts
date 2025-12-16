// This service handles logging user feedback interactions
import { supabase } from '../supabase';


type FeedbackSource = 'view' | 'click' | 'explicit_rating';

/**
 * Logs a user's interaction with a strain to the feedback table.
 * @param userId - The user's ID.
 * @param strainId - The ID of the strain.
 * @param rating - The rating (-1, 0, or 1).
 * @param source - The source of the feedback.
 */
export async function logFeedback(
    userId: string,
    strainId: string,
    rating: number,
    source: FeedbackSource
): Promise<void> {
    try {
        // NOTE: RLS requires the executing client to be authenticated as 'userId'.
        // If this is called client-side, 'supabase' (imported) holds the session.
        // If called server-side (API route), we might need a Service Role client or pass the user token.

        // Check if we have a session matching the userId (simple check)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || session.user.id !== userId) {
            console.warn(`logFeedback: Current session user (${session?.user?.id}) does not match provided userId (${userId}). RLS might fail.`);
        }

        const { error } = await supabase.from('user_feedback').insert({
            user_id: userId,
            strain_id: strainId,
            rating,
            feedback_source: source,
        });

        if (error) {
            console.error('Error logging feedback:', error);
        }
    } catch (err) {
        console.error('Unexpected error in logFeedback:', err);
    }
}
