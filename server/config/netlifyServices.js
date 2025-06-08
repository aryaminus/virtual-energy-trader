// Netlify-specific service management
// This file provides service instances for Netlify Functions

let gridStatusClient = null;
let dataCache = null;
let spikeAnalyzer = null;

/**
 * Set service instances (called from Netlify function)
 */
export const setNetlifyServices = (gridStatus, cache, analyzer) => {
  gridStatusClient = gridStatus;
  dataCache = cache;
  spikeAnalyzer = analyzer;
};

/**
 * Get GridStatus client instance
 */
export const getNetlifyGridStatusClient = () => gridStatusClient;

/**
 * Get data cache instance
 */
export const getNetlifyDataCache = () => dataCache;

/**
 * Get spike analyzer instance
 */
export const getNetlifySpikeAnalyzer = () => spikeAnalyzer;