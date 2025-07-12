const Redis = require('ioredis');


const redisClient = new Redis('redis://localhost:6379', {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000); // Exponential backoff
        return delay;
    }
});


// set redis cache using ttl optionally
const setRedisCache = async (key, value, ttl) => {
    try {
        const data = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttl) {
            await redisClient.set(key, data, 'EX', ttl);
        } else {
            await redisClient.set(key, data);
        }

        console.log(`Cache set for key: ${key}`);
    } catch (error) {
        console.error(`Error setting cache for key ${key}:`, error);
        throw new Error('Failed to set cache');
    }
};


// get redis cache
const getRedisCache = async (key) => {
    try {
        const value = await redisClient.get(key);
        if (value) {
            console.log(`Cache hit for key: ${key}`);
            return JSON.parse(value);
        } else {
            console.log(`Cache miss for key: ${key}`);
            return null;
        }
    } catch (error) {
        console.error(`Error getting cache for key ${key}:`, error);
        return null; // Return null if cache retrieval fails
    }
};


// delete redis cache
const deleteRedisCache = async (key) => {
    try {
        await redisClient.del(key);
        console.log(`Cache deleted for key: ${key}`);
    } catch (error) {
        console.error(`Error deleting cache for key ${key}:`, error);
        throw new Error('Failed to delete cache');
    }
};


module.exports = { redisClient, setRedisCache, getRedisCache, deleteRedisCache };