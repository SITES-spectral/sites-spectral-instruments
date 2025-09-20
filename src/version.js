/**
 * Version Management for Cache Busting
 * Reads version from VERSION file and provides utilities for cache invalidation
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

class VersionManager {
    constructor() {
        this.version = null;
        this.loadVersion();
    }
    
    loadVersion() {
        try {
            // In Cloudflare Workers, we'll embed the version during build
            // For local development, read from file
            this.version = process.env.SITES_VERSION || '4.7.4';
        } catch (error) {
            console.warn('Could not read VERSION file, using default');
            this.version = '4.7.4';
        }
    }
    
    getVersion() {
        return this.version;
    }
    
    getVersionedUrl(url) {
        if (url.includes('?')) {
            return `${url}&v=${this.version}`;
        } else {
            return `${url}?v=${this.version}`;
        }
    }
    
    // Generate version info for HTML meta tags
    getVersionMeta() {
        return {
            version: this.version,
            build: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            timestamp: Date.now()
        };
    }
}

export const versionManager = new VersionManager();