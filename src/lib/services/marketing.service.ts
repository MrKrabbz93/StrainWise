import { callGemini } from '../gemini';

export type Channel = 'twitter' | 'instagram' | 'tiktok' | 'email' | 'press_release';

interface GenerateParams {
    channel: Channel;
    focus: 'launch' | 'feature' | 'community';
    featureName?: string;
    targetAudience?: string;
}

export const generateMarketingContent = async (params: GenerateParams) => {
    const { channel, focus, featureName, targetAudience = 'Modern Cannabis Enthusiasts' } = params;

    const prompt = `Act as a high-end Digital Marketing Strategist for 'StrainWise', a premium AI Cannabis Sommelier application.
    
    CONTEXT:
    - App Name: StrainWise
    - Key Features: AI Consultant (The Guide), 3D Strain Encyclopedia, Terpene Science, Community Mycelium Network (XP & Ranks), Live Dispensary Map.
    - Aesthetic: Luxury, Dark Mode, Emerald & Slate, Minimalist, High-Tech.
    - Voice: Knowledgeable, Premium, Exciting, but Professional.
    
    TASK: Generate marketing content for the following:
    - CHANNEL: ${channel.toUpperCase()}
    - FOCUS: ${focus.toUpperCase()} ${featureName ? `(Specifically: ${featureName})` : ''}
    - TARGET AUDIENCE: ${targetAudience}

    REQUIREMENTS for ${channel.toUpperCase()}:
    ${getChannelRequirements(channel)}

    FORMAT: Return raw text with appropriate formatting (hashtags, emojis, subject lines).`;

    try {
        const result = await callGemini({ type: 'generate', prompt });
        return result;
    } catch (error) {
        console.error("Marketing Gen Error:", error);
        return "Failed to generate content. Please try again.";
    }
};

const getChannelRequirements = (channel: Channel) => {
    switch (channel) {
        case 'twitter':
            return "- 280 character limit.\n- Use 2-3 niche hashtags.\n- Hook-driven first sentence.\n- Include a Call to Action (CTA).";
        case 'instagram':
            return "- Engaging caption style.\n- Suggest 3 image/video ideas.\n- Block of 10 relevant hashtags.\n- Use line breaks for readability.";
        case 'tiktok':
            return "- Video script format (Hook, Body, CTA).\n- Suggested trending audio style.\n- Text overlay suggestions.";
        case 'email':
            return "- Compelling subject line.\n- Personalized feel (Hi [Name]).\n- Clear value propositions (bullet points).\n- Prominent CTA button description.";
        case 'press_release':
            return "- Formal PR header.\n- Catchy headline.\n- Dateline (The Cloud / December 2025).\n- Quotable 'founder' section.\n- Boilerplate about StrainWise.";
        default:
            return "";
    }
};
