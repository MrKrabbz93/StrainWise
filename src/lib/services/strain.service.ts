import { prisma } from '../db';
import { strainCache } from '../cache';
import { logger } from '../logger';
import { NotFoundError } from '../error-handler';

export class StrainService {
    async getStrains({ page = 1, limit = 10, search, type, effect }) {
        const cacheKey = `strains:list:${page}:${limit}:${search || ''}:${type || ''}:${effect || ''}`;

        // Try cache first
        const cached = await strainCache.get(cacheKey);
        if (cached) {
            logger.debug('Strain list cache hit', { cacheKey });
            return cached;
        }

        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (type) where.type = type;
        if (effect) where.effects = { has: effect };

        try {
            const [strains, total] = await Promise.all([
                prisma.strain.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: { name: 'asc' },
                }),
                prisma.strain.count({ where }),
            ]);

            const result = {
                data: strains,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };

            // Cache the result
            await strainCache.set(cacheKey, result);
            return result;

        } catch (error) {
            logger.error('Error fetching strains from DB', { error });
            throw error;
        }
    }

    async getStrainById(id) {
        const cached = await strainCache.get(id);
        if (cached) {
            logger.debug('Strain detail cache hit', { id });
            return cached;
        }

        try {
            const strain = await prisma.strain.findUnique({
                where: { id },
            });

            if (!strain) {
                throw new NotFoundError(`Strain with ID ${id} not found`);
            }

            await strainCache.set(id, strain);
            return strain;

        } catch (error) {
            logger.error(`Error fetching strain ${id}`, { error });
            throw error;
        }
    }

    async createStrain(data) {
        try {
            const strain = await prisma.strain.create({ data });
            // Invalidate list caches (simplified - ideally we'd invalidate specific patterns)
            await strainCache.invalidate('strains:list:*');
            logger.info('Strain created', { strainId: strain.id });
            return strain;
        } catch (error) {
            logger.error('Error creating strain', { error });
            throw error;
        }
    }

    async updateStrain(id, data) {
        try {
            const strain = await prisma.strain.update({
                where: { id },
                data
            });
            await strainCache.invalidate(id);
            await strainCache.invalidate('strains:list:*');
            logger.info('Strain updated', { strainId: id });
            return strain;
        } catch (error) {
            logger.error(`Error updating strain ${id}`, { error });
            throw error;
        }
    }
}

export const strainService = new StrainService();
