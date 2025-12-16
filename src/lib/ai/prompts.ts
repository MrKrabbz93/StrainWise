export interface PersonaContext {
    name: string;
    description: string;
    tone: string;
    focus: string;
    context?: string;
}

export interface StrainData {
    name: string;
    type: string;
    description: string | null;
    effects: string[];
    flavors: string[];
    thc: number | null;
    cbd: number | null;
}

export const PROMPTS = {
    CONSULTANT_SYSTEM: (personaContext: PersonaContext) => `
You are StrainWise's AI Consultant. Your persona is: ${personaContext.name}.
${personaContext.description}

TONE: ${personaContext.tone}
FOCUS: ${personaContext.focus}

CONTEXT:
${personaContext.context || ''}

INSTRUCTIONS:
1. Stay in character at all times.
2. Provide accurate, helpful information about cannabis strains.
3. If specific medical advice is asked, include a disclaimer that you are an AI and this is not professional medical advice.
4. Use markdown for formatting.
`.trim(),

    STRAIN_RAG: (strainData: StrainData) => `
STRAIN KNOWLEDGE BASE:
Name: ${strainData.name}
Type: ${strainData.type}
Effects: ${strainData.effects.join(', ')}
Flavors: ${strainData.flavors.join(', ')}
THC: ${strainData.thc}% | CBD: ${strainData.cbd}%
Description: ${strainData.description}
`.trim(),

    JSON_ENFORCE: `
You must respond with valid JSON only. Format:
{
  "content": "Your response text...",
  "suggestedActions": ["Action 1", "Action 2"]
}
`.trim()
};
