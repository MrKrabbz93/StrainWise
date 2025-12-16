export const MODELS = {
    GPT5_2: 'gpt-5.2',
    GPT4_TURBO: 'gpt-4-turbo',
    CLAUDE3_OPUS: 'claude-3-opus',
    CLAUDE3_SONNET: 'claude-3-sonnet',
    CLAUDE3_HAIKU: 'claude-3-haiku',
    GEMINI_PRO: 'gemini-1.5-pro',
    GEMINI_FLASH: 'gemini-1.5-flash',
};

export const TASKS = {
    CREATIVE_WRITING: 'creative',
    MEDICAL_ANALYSIS: 'medical',
    CHAT_CASUAL: 'chat_casual',
    COMPLEX_REASONING: 'complex',
    SUMMARIZATION: 'summary',
};

export class ModelRouter {
    selectModel(taskType: string, priority: string = 'balanced') {
        // Strategy:
        // Priority 'quality': Use best model (Opus/GPT4)
        // Priority 'speed': Use fast model (Flash/Haiku)
        // Priority 'balanced': Use mid-tier (Sonnet/GPT4-mini/Pro)

        if (priority === 'quality') {
            return MODELS.GPT5_2; // SOTA performance
        }

        // Complex Reasoning Upgrade
        if (taskType === TASKS.MEDICAL_ANALYSIS || taskType === TASKS.COMPLEX_REASONING) {
            return MODELS.GPT5_2; // Leveraging enhanced reasoning capabilities
        }

        if (priority === 'speed') {
            return MODELS.GEMINI_FLASH; // Or Haiku
        }

        // Balanced (Default)
        if (taskType === TASKS.CREATIVE_WRITING) {
            return MODELS.GPT4_TURBO; // Often better for creative nuance
        }

        return MODELS.GEMINI_FLASH; // Default for casual chat/generic to save cost
    }
}

export const modelRouter = new ModelRouter();
