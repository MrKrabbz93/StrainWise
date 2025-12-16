/**
 * CanaryDeploymentService
 * Manages feature flags and gradual rollouts using consistent hashing.
 */
export class CanaryDeploymentService {
    constructor() {
        this.featureFlags = {
            hybridAI: { enabled: true, rolloutPercentage: 100 }, // Full rollout for now
            tieredMemory: { enabled: true, rolloutPercentage: 100 },
            contentEngine: { enabled: true, rolloutPercentage: 100 },
            voiceInteraction: { enabled: false, rolloutPercentage: 0 },
            arVisualization: { enabled: false, rolloutPercentage: 0 },
            communityFeatures: { enabled: false, rolloutPercentage: 0 }
        };
    }

    /**
     * Checks if a feature is enabled for a specific user.
     * @param {string} userId 
     * @param {string} featureName 
     */
    async isFeatureEnabled(userId, featureName) {
        const feature = this.featureFlags[featureName];
        if (!feature || !feature.enabled) return false;

        // Consistent hashing for sticky sessions
        const hash = this.hashUserId(userId);
        return hash < feature.rolloutPercentage;
    }

    hashUserId(userId) {
        let hash = 0;
        const str = userId || 'anonymous';
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash) % 100;
    }

    /**
     * Updates the rollout percentage for a feature (Admin/Ops only).
     */
    async updateRolloutPercentage(featureName, newPercentage) {
        if (!this.featureFlags[featureName]) {
            throw new Error(`Feature ${featureName} not found`);
        }

        const oldPercentage = this.featureFlags[featureName].rolloutPercentage;
        this.featureFlags[featureName].rolloutPercentage = newPercentage;

        console.log(`[Canary] Updated ${featureName} rollout from ${oldPercentage}% to ${newPercentage}%`);

        // In a real app, persist this to DB/Redis
        await this.persistFeatureFlags();
    }

    async persistFeatureFlags() {
        // Mock persistence
        localStorage.setItem('strainwise_feature_flags', JSON.stringify(this.featureFlags));
    }
}

export const canaryService = new CanaryDeploymentService();
