import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cache } from './cache'; // Use our CacheService for rate limiting

export class JWTService {
    constructor() {
        this.secret = process.env.JWT_SECRET || 'default-secret-change-me';
        this.expiresIn = '1h';
        this.refreshExpiresIn = '7d';
    }

    signAccessToken(payload) {
        return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
    }

    signRefreshToken(payload) {
        return jwt.sign(payload, this.secret, { expiresIn: this.refreshExpiresIn });
    }

    verify(token) {
        try {
            return jwt.verify(token, this.secret);
        } catch (error) {
            return null;
        }
    }
}

export class PasswordService {
    async hash(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    async compare(password, hash) {
        return bcrypt.compare(password, hash);
    }
}

export class RateLimiter {
    constructor(windowSeconds = 60, maxRequests = 100) {
        this.windowSeconds = windowSeconds;
        this.maxRequests = maxRequests;
    }

    async isRateLimited(ip, endpoint) {
        const key = `ratelimit:${ip}:${endpoint}`;
        const current = await cache.get(key); // Assuming cache.get returns just the count if we stored it as number, but our cache stores JSON.
        // Let's refine cache usage for counters or just use simple implementation

        // For Redis, we should use incr and expire, but our CacheService wraps it. 
        // We will use the raw redis client if available or basic logic

        // Simplified logic using get/set
        const count = current ? current.count : 0;

        if (count >= this.maxRequests) {
            return true;
        }

        const newCount = count + 1;
        await cache.set(key, { count: newCount }, this.windowSeconds);
        return false;
    }
}

export class SanitizationService {
    sanitizeUser(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        // Basic XSS prevention (for illustration - ideally use a library like DOMPurify for HTML or just text escaping)
        return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}

export const jwtService = new JWTService();
export const passwordService = new PasswordService();
export const rateLimiter = new RateLimiter(); // Default implementation
export const sanitizationService = new SanitizationService();
