import { createApiHandler, withLogging, withValidation } from '../src/lib/api-handler.ts';
import { strainService } from '../src/lib/services/strain.service.ts';
import { z } from 'zod';

const getStrainsSchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    search: z.string().optional(),
    type: z.string().optional(),
    effect: z.string().optional(),
});

const handler = async (req, res) => {
    if (req.method === 'GET') {
        const result = await strainService.getStrains(req.query);
        return res.status(200).json(result);
    } else {
        // Other methods 405
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default createApiHandler(handler, [
    withLogging,
    withValidation(getStrainsSchema),
]);
