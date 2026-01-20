import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    maxRetriesPerRequest: 0,
    connectTimeout: 5000
});

redis.on('error', (err) => {
    // Only log if it's not a connection error to keep logs clean
    if (err.code !== 'ECONNREFUSED') {
        console.error('Redis error:', err.message);
    }
});

redis.on('connect', () => {
    console.log('Redis connected successfully');
});

export default redis;
