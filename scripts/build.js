#!/usr/bin/env node

/**
 * Build Script for SITES Spectral Stations & Instruments
 *
 * This script:
 * 1. Reads the current version from package.json (single source of truth)
 * 2. Updates the centralized version module (src/version/index.js)
 * 3. Generates instrument types module from YAML configuration
 * 4. Updates all HTML files with version parameters for cache busting
 * 5. Updates meta tags with version and build date
 * 6. Generates version manifest for frontend cache busting
 *
 * Usage: node scripts/build.js [--bump-version]
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class BuildManager {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.version = null;
        this.buildDate = new Date().toISOString().split('T')[0];
        this.buildTimestamp = Date.now();
        this.shouldBumpVersion = process.argv.includes('--bump-version');

        this.htmlFiles = [
            'public/index.html',
            'public/login.html',
            'public/station-dashboard.html',
            'public/sites-dashboard.html',
            'public/spectral.html'
        ];

        this.jsFiles = [
            'utils.js',
            'api.js',
            'components.js',
            'interactive-map.js',
            'dashboard.js',
            'station-dashboard.js',
            'navigation.js',
            'export.js',
            'core/version.js',
            'core/security.js',
            'core/promise-utils.js'
        ];
    }
    
    readVersion() {
        const packagePath = path.join(this.rootDir, 'package.json');
        try {
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            this.version = packageData.version;
            console.log(`Current version: ${this.version}`);
        } catch (error) {
            console.error('Could not read package.json:', error.message);
            process.exit(1);
        }
    }
    
    bumpVersion() {
        if (!this.shouldBumpVersion) return;

        const parts = this.version.split('.');
        const patch = parseInt(parts[2]) + 1;
        this.version = `${parts[0]}.${parts[1]}.${patch}`;

        // Update package.json
        const packagePath = path.join(this.rootDir, 'package.json');
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        packageData.version = this.version;
        fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');

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
            timestamp: this.buildTimestamp,
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

    /**
     * Update the centralized version module (src/version/index.js)
     * This is the single source of truth for the backend
     */
    updateVersionModule() {
        const versionModulePath = path.join(this.rootDir, 'src', 'version', 'index.js');

        const versionModuleContent = `/**
 * SITES Spectral - Centralized Version Management
 *
 * Single source of truth for application version.
 * This file is auto-generated during build from package.json.
 * DO NOT EDIT MANUALLY - run 'npm run build' to update.
 *
 * @module version
 * @generated ${this.buildDate}
 * @see scripts/build.js
 */

// Version info is injected at build time
// DO NOT EDIT - this is auto-generated
export const VERSION = '${this.version}';
export const BUILD_DATE = '${this.buildDate}';
export const BUILD_TIMESTAMP = ${this.buildTimestamp};

/**
 * Version information object
 */
export const VersionInfo = {
  version: VERSION,
  major: parseInt(VERSION.split('.')[0], 10),
  minor: parseInt(VERSION.split('.')[1], 10),
  patch: parseInt(VERSION.split('.')[2], 10),
  buildDate: BUILD_DATE,
  buildTimestamp: BUILD_TIMESTAMP,

  /**
   * Get full version string with build info
   * @returns {string} e.g., "13.2.0 (2025-12-27)"
   */
  getFullVersion() {
    return \`\${this.version} (\${this.buildDate})\`;
  },

  /**
   * Get semantic version string
   * @returns {string} e.g., "13.2.0"
   */
  getSemanticVersion() {
    return this.version;
  },

  /**
   * Add version query param to URL for cache busting
   * @param {string} url - The URL to version
   * @returns {string} URL with version query param
   */
  versionUrl(url) {
    const separator = url.includes('?') ? '&' : '?';
    return \`\${url}\${separator}v=\${this.version}\`;
  },

  /**
   * Get version as JSON (for API responses)
   * @returns {Object} Version info object
   */
  toJSON() {
    return {
      version: this.version,
      major: this.major,
      minor: this.minor,
      patch: this.patch,
      buildDate: this.buildDate,
      buildTimestamp: this.buildTimestamp
    };
  }
};

export default VersionInfo;
`;

        fs.writeFileSync(versionModulePath, versionModuleContent);
        console.log(`Updated version module: src/version/index.js`);
    }

    /**
     * Update package.json description with version
     */
    updatePackageDescription() {
        const packagePath = path.join(this.rootDir, 'package.json');
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

        // Update description to include version
        const baseDescription = 'SITES Spectral';
        const versionSuffix = this.version.includes('alpha') || this.version.includes('beta')
            ? this.version
            : `v${this.version}`;
        packageData.description = `${baseDescription} ${versionSuffix} - Stations & Instruments Registry`;

        fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');
        console.log(`Updated package.json description`);
    }

    /**
     * Generate instrument types module from YAML configuration
     * This creates a JavaScript module that can be imported by the InstrumentTypeRegistry
     */
    generateInstrumentTypesModule() {
        console.log('Generating instrument types module from YAML...');

        const yamlPath = path.join(this.rootDir, 'yamls', 'instruments', 'instrument-types.yaml');
        const outputPath = path.join(this.rootDir, 'src', 'domain', 'instrument', 'instrument-types.generated.js');

        try {
            // Read and parse YAML
            const yamlContent = fs.readFileSync(yamlPath, 'utf8');
            const config = yaml.load(yamlContent);

            // Extract instrument types and categories
            const instrumentTypes = config.instrument_types || {};
            const categories = config.categories || {};

            // Generate JavaScript module
            const moduleContent = `/**
 * Instrument Types Configuration - Auto-Generated
 *
 * DO NOT EDIT THIS FILE DIRECTLY!
 * This file is auto-generated from yamls/instruments/instrument-types.yaml
 * Run 'npm run build' to regenerate after editing the YAML file.
 *
 * @generated ${this.buildDate}
 * @version ${this.version}
 * @see yamls/instruments/instrument-types.yaml
 */

/**
 * Instrument type configurations loaded from YAML
 * @type {Object.<string, InstrumentTypeConfig>}
 */
export const INSTRUMENT_TYPES = ${JSON.stringify(instrumentTypes, null, 2)};

/**
 * Category configurations loaded from YAML
 * @type {Object.<string, CategoryConfig>}
 */
export const CATEGORIES = ${JSON.stringify(categories, null, 2)};

/**
 * Get all instrument type keys
 * @returns {string[]}
 */
export function getTypeKeys() {
  return Object.keys(INSTRUMENT_TYPES);
}

/**
 * Get all category keys
 * @returns {string[]}
 */
export function getCategoryKeys() {
  return Object.keys(CATEGORIES);
}

export default { INSTRUMENT_TYPES, CATEGORIES };
`;

            fs.writeFileSync(outputPath, moduleContent);
            console.log(`Generated: src/domain/instrument/instrument-types.generated.js`);
            console.log(`  - ${Object.keys(instrumentTypes).length} instrument types`);
            console.log(`  - ${Object.keys(categories).length} categories`);

        } catch (error) {
            console.error('Failed to generate instrument types module:', error.message);
            console.warn('Continuing build without instrument types generation...');
        }
    }

    run() {
        console.log('🏗️  Building SITES Spectral Stations & Instruments...');
        console.log('');

        this.readVersion();
        this.bumpVersion();
        this.updateVersionModule();
        this.generateInstrumentTypesModule();
        this.updatePackageDescription();
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