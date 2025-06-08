/**
 * Simple in-memory cache to avoid hitting API rate limits
 */
class DataCache {
  /**
   * Create a new data cache
   * @param {number} ttlMinutes - Time to live in minutes
   */
  constructor(ttlMinutes = 60) {
    this.cache = new Map();
    this.ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Generate cache key from endpoint and parameters
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {string} Cache key
   */
  generateKey(endpoint, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${endpoint}_${JSON.stringify(sortedParams)}`;
  }

  /**
   * Store data in cache
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @param {*} data - Data to cache
   */
  set(endpoint, params, data) {
    const key = this.generateKey(endpoint, params);
    const expiry = Date.now() + this.ttl;
    
    this.cache.set(key, { 
      data, 
      expiry, 
      createdAt: Date.now(),
      accessCount: 0
    });
    
    this.stats.sets++;
  }

  /**
   * Retrieve data from cache
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {*|null} Cached data or null if not found/expired
   */
  get(endpoint, params) {
    const key = this.generateKey(endpoint, params);
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.stats.misses++;
      return null;
    }
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      return null;
    }
    
    // Validate cached data integrity
    try {
      if (cached.data === null || cached.data === undefined) {
        this.cache.delete(key);
        this.stats.misses++;
        this.stats.deletes++;
        return null;
      }
      
      // Try to serialize and parse to detect corruption
      JSON.stringify(cached.data);
      
      // Update access statistics
      cached.accessCount++;
      cached.lastAccessed = Date.now();
      
      this.stats.hits++;
      return cached.data;
    } catch (error) {
      // Cache corruption detected - remove corrupted entry
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
  }

  /**
   * Get cache size
   * @returns {number} Number of cached items
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.size(),
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Estimate memory usage of cache
   * @returns {number} Estimated memory usage in bytes
   */
  getMemoryUsage() {
    let totalSize = 0;
    
    for (const [key, value] of this.cache) {
      totalSize += key.length * 2; // Approximate string size
      totalSize += JSON.stringify(value).length * 2; // Approximate object size
    }
    
    return totalSize;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let deletedCount = 0;
    
    for (const [key, value] of this.cache) {
      if (now > value.expiry) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    this.stats.deletes += deletedCount;
    return deletedCount;
  }

  /**
   * Get cache entries sorted by access frequency
   * @returns {Array} Array of cache entries with metadata
   */
  getTopEntries(limit = 10) {
    const entries = Array.from(this.cache.entries())
      .map(([key, value]) => ({
        key,
        accessCount: value.accessCount,
        createdAt: value.createdAt,
        lastAccessed: value.lastAccessed,
        size: JSON.stringify(value.data).length
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
    
    return entries;
  }
}

export default DataCache;