export const MODELS = {
    CLAUDE_4_6_SONNET: 'claude-4-6-sonnet-20260205',
    GEMINI_2_5_PRO: 'gemini-2.5-pro-latest',
    GEMINI_2_5_FLASH: 'gemini-2.5-flash-latest',
    GPT5_3_CODEX: 'gpt-5.3-codex',
    GPT4O: 'gpt-4o',
    DEEPSEEK_V3: 'deepseek-chat',
};

export const TASKS = {
    CREATIVE_WRITING: 'creative',
    MEDICAL_ANALYSIS: 'medical',
    CHAT_CASUAL: 'chat_casual',
    COMPLEX_REASONING: 'complex',
    SUMMARIZATION: 'summary',
    TOOL_USE: 'tool_use',
};

export class ModelRouter {
    selectModel(taskType, priority = 'balanced') {
        // Quality Priority: Go for the most intelligent reasoning
        if (priority === 'quality' || taskType === TASKS.COMPLEX_REASONING) {
            return MODELS.GEMINI_2_5_PRO;
        }

        // Tool Use & MCP Logic: Claude 4.6 is now the state-of-the-art
        if (taskType === TASKS.TOOL_USE) {
            return MODELS.CLAUDE_4_6_SONNET;
        }

        // Medical & Sensitive: Use Pro
        if (taskType === TASKS.MEDICAL_ANALYSIS) {
            return MODELS.GEMINI_2_5_PRO;
        }

        // Fast & Cheap: Gemini 2.5 Flash
        if (priority === 'speed') {
            return MODELS.GEMINI_2_5_FLASH;
        }

        // Efficiency (Default for casual chat)
        if (taskType === TASKS.CHAT_CASUAL || priority === 'efficiency') {
            return MODELS.GEMINI_2_5_FLASH;
        }

        // Balanced (Default)
        return MODELS.GEMINI_2_5_FLASH;
    }
}

export const modelRouter = new ModelRouter();
