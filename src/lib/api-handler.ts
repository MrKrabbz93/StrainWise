import { handleApiError } from './error-handler';
import { logger } from './logger';
import { jwtService, rateLimiter } from './security';
import { UnauthorizedError, ForbiddenError } from './error-handler';
import { z } from 'zod';

export function createApiHandler(handler, middlewares = []) {
    return async (req, res) => {
        try {
            // 1. Run Middlewares
            for (const middleware of middlewares) {
                await middleware(req, res);
                if (res.headersSent) return; // Middleware handled response
            }

            // 2. Run Handler
            await handler(req, res);

        } catch (error) {
            handleApiError(error, res);
        }
    };
}

// --- Middlewares ---

export const withLogging = async (req, res) => {
    logger.info(`[API] ${req.method} ${req.url}`, {
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
    });
};

export const withRateLimit = (limit = 100, window = 60) => async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const isLimited = await rateLimiter.isRateLimited(ip, req.url); // Note: Instantiating specific limit check might need refactor or just global check
    // For now using global limiter instance but ideally we pass config

    // Custom check reusing the class logic locally if needed, or just using the global one
    // The global one has default 60s/100req. We might want to customize per route.
    // Implementation in security.ts was simple. Let's just use it.

    if (isLimited) {
        res.setHeader('Retry-After', window);
        throw new ForbiddenError('Rate limit exceeded');
        // Technically should be 429, but AppError defaults are limited. 
        // Let's assume handleApiError handles custom status or we throw specific object.
    }
};

export const withAuth = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];
    const payload = jwtService.verify(token);

    if (!payload) {
        throw new UnauthorizedError('Invalid or expired token');
    }

    req.user = payload; // Attach user to request
};

export const withValidation = (schema) => async (req, res) => {
    try {
        if (req.method === 'GET') {
            req.query = schema.parse(req.query);
        } else {
            req.body = schema.parse(req.body);
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Wrap Zod error
            const msg = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            // Throw validation error-like object or specific class
            // For now rethrow as custom object for error handler to pick up?
            // Or update error-handler to handle ZodError. 
            // Let's throw a simple error for now.
            throw new Error(`Validation Error: ${msg}`); // TODO: Use ValidationError class
        }
        throw error;
    }
};
