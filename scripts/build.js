#!/usr/bin/env node

/**
 * Build Script for SITES Spectral Stations & Instruments
 * 
 * This script:
 * 1. Reads the current version from VERSION file
 * 2. Updates all HTML files with version parameters for cache busting
 * 3. Updates meta tags with version and build date
 * 
 * Usage: node scripts/build.js [--bump-version]
 */

const fs = require('fs');
const path = require('path');

class BuildManager {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.version = null;
        this.buildDate = new Date().toISOString().split('T')[0];
        this.shouldBumpVersion = process.argv.includes('--bump-version');
        
        this.htmlFiles = [
            'public/index.html',
            'public/login.html',
            'public/station/dashboard.html'
        ];
        
        this.jsFiles = [
            'utils.js',
            'api.js', 
            'components.js',
            'interactive-map.js',
            'dashboard.js',
            'station-dashboard.js'
        ];
    }
    
    readVersion() {
        const versionPath = path.join(this.rootDir, 'VERSION');
        try {
            this.version = fs.readFileSync(versionPath, 'utf8').trim();
            console.log(`Current version: ${this.version}`);
        } catch (error) {
            console.error('Could not read VERSION file:', error.message);
            process.exit(1);
        }
    }
    
    bumpVersion() {
        if (!this.shouldBumpVersion) return;
        
        const parts = this.version.split('.');
        const patch = parseInt(parts[2]) + 1;
        this.version = `${parts[0]}.${parts[1]}.${patch}`;
        
        const versionPath = path.join(this.rootDir, 'VERSION');
        fs.writeFileSync(versionPath, this.version);
        console.log(`Version bumped to: ${this.version}`);
    }
    
    updateHtmlFiles() {
        console.log('Updating HTML files with version parameters...');
        
        this.htmlFiles.forEach(filePath => {
            const fullPath = path.join(this.rootDir, filePath);
            if (!fs.existsSync(fullPath)) {
                console.warn(`File not found: ${filePath}`);
                return;
            }
            
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Update CSS version
            content = content.replace(
                /href="\/css\/styles\.css(\?v=[^"]*)?"/g,
                `href="/css/styles.css?v=${this.version}"`
            );
            
            // Update JS versions
            this.jsFiles.forEach(jsFile => {
                const regex = new RegExp(`src="/js/${jsFile}(\\?v=[^"]*)?"`,"g");
                content = content.replace(regex, `src="/js/${jsFile}?v=${this.version}"`);
            });
            
            // Update version meta tags
            content = content.replace(
                /<meta name="app-version" content="[^"]*">/g,
                `<meta name="app-version" content="${this.version}">`
            );
            
            content = content.replace(
                /<meta name="build-date" content="[^"]*">/g,
                `<meta name="build-date" content="${this.buildDate}">`
            );
            
            // Update footer version displays
            content = content.replace(
                /<span id="app-version">[^<]*<\/span>/g,
                `<span id="app-version">${this.version}</span>`
            );
            
            content = content.replace(
                /<span id="build-date">[^<]*<\/span>/g,
                `<span id="build-date">${this.buildDate}</span>`
            );
            
            fs.writeFileSync(fullPath, content);
            console.log(`Updated: ${filePath}`);
        });
    }
    
    generateCacheBustManifest() {
        const manifest = {
            version: this.version,
            buildDate: this.buildDate,
            timestamp: Date.now(),
            files: {}
        };
        
        // Add CSS files
        manifest.files[`/css/styles.css?v=${this.version}`] = this.version;
        
        // Add JS files
        this.jsFiles.forEach(jsFile => {
            manifest.files[`/js/${jsFile}?v=${this.version}`] = this.version;
        });
        
        const manifestPath = path.join(this.rootDir, 'public', 'version-manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`Generated version manifest: public/version-manifest.json`);
    }
    
    run() {
        console.log('🏗️  Building SITES Spectral Stations & Instruments...');
        console.log('');
        
        this.readVersion();
        this.bumpVersion();
        this.updateHtmlFiles();
        this.generateCacheBustManifest();
        
        console.log('');
        console.log('✅ Build completed successfully!');
        console.log(`📦 Version: ${this.version}`);
        console.log(`📅 Build Date: ${this.buildDate}`);
        console.log('');
        console.log('Ready for deployment with cache-busting enabled.');
    }
}

// Run the build
const buildManager = new BuildManager();
buildManager.run();