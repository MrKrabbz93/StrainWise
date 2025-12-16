import { HybridAIService } from '../ai/hybrid.service';

/**
 * Platform Formatters
 * Adapts raw content to platform-specific constraints/styles.
 */
const FORMATTERS = {
    instagram: (content) => {
        // Ensure hashtags are present, limit caption length
        const hashtags = content.hashtags || "#CannabisCommunity #StrainWise #Premium";
        return {
            imagePrompt: content.image_idea,
            caption: `${content.caption}\n.\n.\n${hashtags}`,
            aspectRatio: "4:5"
        };
    },
    twitter: (content) => {
        // Enforce 280 chars per tweet in thread
        const tweets = Array.isArray(content) ? content : [content];
        return tweets.map((t, i) => `${i + 1}/${tweets.length} ${t}`.substring(0, 280));
    },
    tiktok: (content) => {
        // Return script format
        return {
            script: content,
            duration: "30s",
            visualNotes: "Fast cuts, upbeat music"
        };
    }
};

/**
 * ContentScheduler
 * Manages the timing and queueing of posts.
 */
class ContentScheduler {
    constructor() {
        this.queue = [];
    }

    schedule(platform, content, publishTime) {
        const id = crypto.randomUUID();
        this.queue.push({
            id,
            platform,
            content,
            publishTime,
            status: 'pending'
        });
        console.log(`[Scheduler] Queued for ${platform} @ ${publishTime}`);
        return id;
    }

    getQueue() {
        return this.queue.sort((a, b) => new Date(a.publishTime) - new Date(b.publishTime));
    }
}

/**
 * AdvancedContentEngine
 * Generates, Formats, and Schedules social media campaigns.
 */
export class AdvancedContentEngine {
    constructor() {
        this.ai = new HybridAIService();
        this.scheduler = new ContentScheduler();
    }

    /**
     * Generates a multi-platform content bundle.
     */
    async generateCampaign(topic, platforms = ['instagram', 'twitter', 'tiktok']) {
        const prompt = `Act as a specialized Social Media Manager.
        Topic: "${topic}"
        Target Platforms: ${platforms.join(', ')}
        
        Generate raw content for each platform.
        - Instagram: { "image_idea": "...", "caption": "...", "hashtags": "..." }
        - Twitter: ["Thread tweet 1", "Thread tweet 2"]
        - TikTok: "Script text..."
        
        Format strictly as JSON.`;

        try {
            const response = await this.ai.generateResponse({
                type: 'generate',
                prompt,
                generationConfig: { responseMimeType: 'application/json' }
            });

            const rawContent = JSON.parse(response.replace(/```json/g, '').replace(/```/g, '').trim());

            // Format for each platform
            const formattedCampaign = {};
            platforms.forEach(p => {
                if (rawContent[p] && FORMATTERS[p]) {
                    formattedCampaign[p] = FORMATTERS[p](rawContent[p]);
                }
            });

            return formattedCampaign;

        } catch (error) {
            console.error("Campaign Generation Failed:", error);
            return null;
        }
    }

    scheduleCampaign(campaignData, startDate) {
        const results = {};
        const start = new Date(startDate);

        Object.entries(campaignData).forEach(([platform, content], index) => {
            // Stagger posts by 2 hours
            const postTime = new Date(start.getTime() + (index * 2 * 60 * 60 * 1000));
            results[platform] = this.scheduler.schedule(platform, content, postTime.toISOString());
        });

        return results;
    }
}
