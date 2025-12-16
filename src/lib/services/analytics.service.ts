import { prisma } from '../db';
import { logger } from '../logger';

export class AnalyticsService {
    async trackEvent({ userId, action, category, label, value, metadata = {} }) {
        try {
            await prisma.userActivity.create({
                data: {
                    userId: userId || 'anonymous',
                    action: action,
                    details: {
                        category,
                        label,
                        value,
                        ...metadata,
                        timestamp: new Date().toISOString()
                    },
                    // userActivity schema might need 'ipAddress' if available in context
                }
            });
            logger.info(`Analytics Event: ${action}`, { userId, category });
        } catch (error) {
            logger.error('Failed to track event', { error });
            // Analytics should fail silently to not disrupt UX
        }
    }

    async getDashboardMetrics(days = 7) {
        // Aggregate data for dashboard
        // Note: Real aggregation usually done via raw SQL or data warehouse
        try {
            const activities = await prisma.userActivity.findMany({
                where: {
                    timestamp: {
                        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
                    }
                },
                orderBy: { timestamp: 'asc' }
            });

            // Process for charts
            const dailyActiveUsers = {};
            const topActions = {};

            activities.forEach(act => {
                const date = act.timestamp.toISOString().split('T')[0];
                dailyActiveUsers[date] = (dailyActiveUsers[date] || new Set()).add(act.userId);
                topActions[act.action] = (topActions[act.action] || 0) + 1;
            });

            return {
                userGrowth: Object.keys(dailyActiveUsers).map(date => ({
                    date,
                    users: dailyActiveUsers[date].size
                })),
                topActions: Object.keys(topActions).map(action => ({
                    name: action,
                    count: topActions[action]
                }))
            };

        } catch (error) {
            logger.error('Failed to get dashboard metrics', { error });
            return { userGrowth: [], topActions: [] };
        }
    }
}

export const analyticsService = new AnalyticsService();
