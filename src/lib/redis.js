import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL);

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redis.on('connect', () => {
    console.log('Redis connected successfully');
});

export default redis;
