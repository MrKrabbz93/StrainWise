import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';


// --- In-Memory LRU Cache ---
class LRUCache {
    private capacity: number;
    private cache: Map<any, any>;

    constructor(capacity: number = 100) {
        this.capacity = capacity;
        this.cache = new Map();
    }

    get(key: any) {
        if (!this.cache.has(key)) return null;
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key: any, value: any) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.capacity) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    del(key: any) {
        this.cache.delete(key);
    }

    flush() {
        this.cache.clear();
    }
}

// --- Hybrid Cache Service (Redis + Local) ---
class CacheService {
    private redis: Redis | null;
    private localCache: LRUCache;
    private useRedis: boolean;

    constructor() {
        this.redis = null;
        this.localCache = new LRUCache(500);
        this.useRedis = !!process.env.REDIS_URL;

        if (this.useRedis && process.env.REDIS_URL) {
            this.redis = new Redis(process.env.REDIS_URL);
            this.redis.on('error', (err: any) => {
                console.error('Redis Error:', err);
                this.useRedis = false; // Fallback to local
            });
        }
    }

    async get(key: string) {
        if (this.useRedis && this.redis) {
            try {
                const data = await this.redis.get(key);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.warn('Cache Read Error', e);
                return this.localCache.get(key);
            }
        }
        return this.localCache.get(key);
    }

    async set(key: string, value: any, ttlSeconds: number = 3600) {
        if (this.useRedis && this.redis) {
            try {
                await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
            } catch (e) {
                console.warn('Cache Write Error', e);
                this.localCache.set(key, value);
            }
        } else {
            this.localCache.set(key, value);
        }
    }

    async del(key: string) {
        if (this.useRedis && this.redis) {
            await this.redis.del(key);
        }
        this.localCache.del(key);
    }

    async invalidatePattern(pattern: string) {
        if (this.useRedis && this.redis) {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(keys);
            }
        }
    }
}

export const cache = new CacheService();

export const strainCache = {
    get: (id: string) => cache.get(`strain:${id}`),
    set: (id: string, data: any) => cache.set(`strain:${id}`, data, 3600 * 24), // 24 hours
    invalidate: (id: string) => cache.del(`strain:${id}`)
};

export const userCache = {
    getProfile: (id: string) => cache.get(`user:${id}:profile`),
    setProfile: (id: string, data: any) => cache.set(`user:${id}:profile`, data, 3600),
    invalidate: (id: string) => cache.del(`user:${id}:profile`)
};

// --- Persistent Cache (Supabase) ---

// Initialize Supabase Client for Persistent Cache (Server-Side)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Only create client if URL is present to avoid build errors if env mostly missing
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
}) : null;

/**
 * Generates a consistent, unique hash for a given request object.
 * @param {object} request - The AI request object (e.g., { strain: 'OG Kush', type: 'info' })
 * @returns {string} A SHA256 hash string.
 */
export function generateCacheKey(request: any) {
    const stringifiedRequest = JSON.stringify(request, Object.keys(request).sort());
    return crypto.createHash('sha256').update(stringifiedRequest).digest('hex');
}

/**
 * Attempts to retrieve a cached response from the database.
 * @param {string} key - The cache key.
 * @returns {Promise<any|null>} The cached JSON value or null if not found/expired.
 */
export async function getPersistentCache(key: string) {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('response_cache')
            .select('value')
            .eq('key', key)
            .gt('expires_at', new Date().toISOString()) // Ensure it's not expired
            .maybeSingle();

        if (error || !data) {
            return null;
        }

        return data.value;
    } catch (err) {
        console.error('Error fetching from persistent cache:', err);
        return null;
    }
}

/**
 * Stores a response in the persistent cache.
 * @param {string} key - The cache key.
 * @param {any} value - The JSON value to cache.
 * @param {number} ttlSeconds - Time-to-live in seconds.
 */
export async function setPersistentCache(key: string, value: any, ttlSeconds: number = 3600) {
    if (!supabase) return;
    try {
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

        const { error } = await supabase
            .from('response_cache')
            .upsert(
                { key, value, expires_at: expiresAt },
                { onConflict: 'key' }
            );

        if (error) {
            console.error('Error setting persistent cache:', error);
        }
    } catch (err) {
        console.error('Error setting persistent cache:', err);
    }
}
