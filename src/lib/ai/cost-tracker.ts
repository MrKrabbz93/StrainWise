import { prisma } from '../db';
import { logger } from '../logger';

// Approximated Pricing as of late 2024 / early 2025 (per 1M tokens)
const PRICING = {
    'gpt-5.2': { input: 1.75, output: 14.00 },
    'gpt-4-turbo': { input: 10, output: 30 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    'claude-3-opus': { input: 15, output: 75 },
    'claude-3-sonnet': { input: 3, output: 15 },
    'claude-3-haiku': { input: 0.25, output: 1.25 },
    'gemini-1.5-pro': { input: 3.5, output: 10.5 }, // Example
    'gemini-1.5-flash': { input: 0.35, output: 1.05 },
};

export class CostTracker {
    calculateCost(model, inputTokens, outputTokens) {
        const rates = PRICING[model];
        if (!rates) {
            logger.warn(`Pricing not found for model ${model}`);
            return 0;
        }
        const cost = (inputTokens / 1000000 * rates.input) + (outputTokens / 1000000 * rates.output);
        return parseFloat(cost.toFixed(6));
    }

    async trackUsage(userId, model, action, inputTokens, outputTokens, metadata = {}) {
        try {
            const cost = this.calculateCost(model, inputTokens, outputTokens);

            // Log to database (UserActivity)
            // We use the UserActivity table's 'details' JSON field to store token specifics
            // However, UserActivity is generic. 
            // Ideally we might want a dedicated Usage table, but plan said use UserActivity.

            await prisma.userActivity.create({
                data: {
                    userId: userId || 'system',
                    action: 'ai_usage',
                    details: {
                        model,
                        task: action, // e.g., "consultant_chat", "image_gen"
                        inputTokens,
                        outputTokens,
                        costUSD: cost,
                        ...metadata
                    },
                    // We might want to track IP here if available in context, but for internal service calls it's tricky.
                }
            });

            logger.info(`AI Usage: ${model} ($${cost})`, { userId, inputTokens, outputTokens });
            return cost;

        } catch (error) {
            logger.error('Failed to log AI usage', { error });
            // Don't fail the request just because logging failed
            return 0;
        }
    }
}

export const costTracker = new CostTracker();
