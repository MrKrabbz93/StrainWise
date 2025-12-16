import { prisma } from '../db';
import { aiService } from '../ai/ai-service';
import { PERSONAS } from '../ai/personas';
import { PROMPTS } from '../ai/prompts';
import { strainService } from './strain.service';
import { TASKS } from '../ai/model-router';
import { logger } from '../logger';

export class AIConsultantService {
    async createSession(userId, personaId = 'guide') {
        const persona = Object.values(PERSONAS).find(p => p.id === personaId) || PERSONAS.GUIDE;

        try {
            const session = await prisma.consultantSession.create({
                data: {
                    userId,
                    persona: persona.id,
                    messages: [],
                    metadata: {}
                }
            });
            logger.info('New Consultant Session', { sessionId: session.id, persona: persona.id });
            return session;
        } catch (error) {
            logger.error('Failed to create session', { error });
            throw error;
        }
    }

    async sendMessage({ sessionId, userId, message, contextStrainId }) {
        try {
            const session = await prisma.consultantSession.findUnique({ where: { id: sessionId } });
            if (!session) throw new Error('Session not found');

            const persona = Object.values(PERSONAS).find(p => p.id === session.persona) || PERSONAS.GUIDE;

            // 1. Build Context
            let context = '';
            let ragSystem = '';

            if (contextStrainId) {
                const strain = await strainService.getStrainById(contextStrainId);
                if (strain) {
                    ragSystem = PROMPTS.STRAIN_RAG(strain);
                    context += `User is looking at strain: ${strain.name}\n`;
                }
            }

            // 2. Build System Prompt
            const systemPrompt = PROMPTS.CONSULTANT_SYSTEM({
                ...persona,
                context: ragSystem
            });

            // 3. Prepare Chat History (limited to last 10 turns to save tokens)
            // session.messages is Json[], assume format { role, content }
            const history = Array.isArray(session.messages) ? session.messages : [];
            const recentHistory = history.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');

            const fullPrompt = `${recentHistory}\nUser: ${message}`;

            // 4. Generate AI Response
            const aiResponse = await aiService.generateText({
                prompt: fullPrompt,
                system: systemPrompt,
                task: persona.id === 'scientist' ? TASKS.MEDICAL_ANALYSIS : TASKS.CHAT_CASUAL,
                userId: userId || session.userId,
                // Scientist needs quality, others can vary
                priority: persona.id === 'scientist' ? 'quality' : 'balanced'
            });

            // 5. Save Interaction
            const newMessages = [
                ...history,
                { role: 'user', content: message, timestamp: new Date().toISOString() },
                { role: 'consultant', content: aiResponse, timestamp: new Date().toISOString() }
            ];

            await prisma.consultantSession.update({
                where: { id: sessionId },
                data: { messages: newMessages }
            });

            return {
                response: aiResponse,
                sessionId
            };

        } catch (error) {
            logger.error('Error in consultant chat', { error });
            throw error;
        }
    }

    async getHistory(sessionId) {
        return prisma.consultantSession.findUnique({ where: { id: sessionId } });
    }
}

export const aiConsultantService = new AIConsultantService();
