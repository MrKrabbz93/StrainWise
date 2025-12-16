/**
 * TieredMemory
 * Manages conversation context across Short, Medium, and Long-term tiers.
 */
export class TieredMemory {
    constructor(userId) {
        this.userId = userId;
        this.shortTerm = []; // Current session (Detailed)
        this.mediumTerm = []; // Recent sessions (Summarized)
        this.longTerm = {
            attributes: {}, // Extracted user details (Name, Location, Tolerance)
            preferences: {
                strains: [],
                effects: [],
                conditions: []
            },
            sentiment: 'neutral',
            lastInteraction: null
        };

        this.LIMITS = {
            SHORT: 10,
            MEDIUM: 5
        };
    }

    /**
     * Updates memory with a new interaction.
     * Triggers summarization if short-term memory overflows.
     */
    async updateContext(userMessage, aiResponse, persona) {
        // 1. Short Term (Immediate Context)
        this.shortTerm.push({ role: 'user', content: userMessage, timestamp: Date.now() });
        this.shortTerm.push({ role: 'assistant', content: aiResponse, persona, timestamp: Date.now() });

        // 2. Promotion Logic (Short -> Medium)
        if (this.shortTerm.length > this.LIMITS.SHORT * 2) {
            await this.promoteToMediumTerm();
        }

        // 3. Long Term Extraction (Heuristics for now, simulated NLP)
        this.extractLongTermInsights(userMessage);

        this.longTerm.lastInteraction = new Date();
    }

    /**
     * Compresses the oldest chunk of short-term memory into a summary.
     */
    async promoteToMediumTerm() {
        // Take the oldest 4 messages
        const chunk = this.shortTerm.splice(0, 4);

        // In a real system, we'd ask the AI to summarize this chunk.
        // For now, we store a lightweight representation.
        const summary = `Conversation about "${chunk[0].content.substring(0, 20)}..."`;

        this.mediumTerm.push({
            summary,
            timestamp: Date.now(),
            messageCount: chunk.length
        });

        // Prune Medium Term
        if (this.mediumTerm.length > this.LIMITS.MEDIUM) {
            this.mediumTerm.shift(); // Forget oldest summaries
        }
    }

    extractLongTermInsights(text) {
        const lower = text.toLowerCase();

        // Simple extraction rules
        if (lower.includes('my name is')) {
            const name = text.split('name is')[1]?.split(' ')[1];
            if (name) this.longTerm.attributes.name = name.replace(/[^a-zA-Z]/g, '');
        }

        if (lower.includes('indica')) this.addPreference('strains', 'Indica');
        if (lower.includes('sativa')) this.addPreference('strains', 'Sativa');
        if (lower.includes('sleep')) this.addPreference('conditions', 'Insomnia');
        if (lower.includes('pain')) this.addPreference('conditions', 'Pain');
    }

    addPreference(category, value) {
        if (!this.longTerm.preferences[category].includes(value)) {
            this.longTerm.preferences[category].push(value);
        }
    }

    /**
     * Generates a rich context prompt for the AI.
     */
    getContextualPrompt(currentPersona) {
        const { attributes, preferences, lastInteraction } = this.longTerm;

        const context = `
[TIERED MEMORY SYSTEM]
User Profile:
- Name: ${attributes.name || 'Unknown'}
- Last Seen: ${lastInteraction ? lastInteraction.toDateString() : 'New User'}

Long-Term Insights:
- Preferred Strains: ${preferences.strains.join(', ') || 'None'}
- Conditions/Goals: ${preferences.conditions.join(', ') || 'None'}

Recent Context (Medium-Term):
${this.mediumTerm.map(m => `- ${m.summary}`).join('\n')}

Current Session (Short-Term):
${this.shortTerm.length / 2} turns active.
`;
        return context;
    }

    getHistory() {
        return this.shortTerm.map(m => ({ role: m.role, content: m.content }));
    }

    clear() {
        this.shortTerm = [];
        this.mediumTerm = [];
    }
}
