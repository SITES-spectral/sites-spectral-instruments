#!/usr/bin/env node

/**
 * SITES Spectral - Thumbnail Generation Script
 *
 * Generates optimized thumbnails for phenocam images
 * Usage: node scripts/generate-thumbnails.js
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
    sourceDir: 'public/assets/instruments',
    thumbnailDir: 'public/assets/thumbnails',
    sizes: {
        thumbnail: { width: 80, height: 80, quality: 85 },
        small: { width: 160, height: 160, quality: 90 }
    },
    supportedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
};

class ThumbnailGenerator {
    constructor() {
        this.sourceDir = path.resolve(CONFIG.sourceDir);
        this.thumbnailDir = path.resolve(CONFIG.thumbnailDir);
        this.processedCount = 0;
        this.skippedCount = 0;
        this.errorCount = 0;
    }

    async init() {
        console.log('🖼️  SITES Spectral Thumbnail Generator');
        console.log('=====================================\n');

        // Check if ImageMagick is available
        try {
            execSync('convert -version', { stdio: 'ignore' });
            console.log('✅ ImageMagick detected');
        } catch (error) {
            console.log('❌ ImageMagick not found. Installing via package manager...');
            await this.installImageMagick();
        }

        // Create directories
        await this.createDirectories();

        // Process images
        await this.processImages();

        // Generate manifest
        await this.generateManifest();

        // Summary
        this.printSummary();
    }

    async installImageMagick() {
        console.log('📦 Attempting to install ImageMagick...');
        try {
            // Try different package managers
            const commands = [
                'apt-get update && apt-get install -y imagemagick',
                'yum install -y ImageMagick',
                'brew install imagemagick'
            ];

            for (const cmd of commands) {
                try {
                    execSync(cmd, { stdio: 'ignore' });
                    console.log('✅ ImageMagick installed successfully');
                    return;
                } catch (e) {
                    continue;
                }
            }

            throw new Error('Could not install ImageMagick automatically');
        } catch (error) {
            console.log('⚠️  Could not install ImageMagick automatically');
            console.log('Please install ImageMagick manually:');
            console.log('  Ubuntu/Debian: sudo apt-get install imagemagick');
            console.log('  CentOS/RHEL: sudo yum install ImageMagick');
            console.log('  macOS: brew install imagemagick');
            process.exit(1);
        }
    }

    async createDirectories() {
        console.log('📁 Creating directory structure...');

        try {
            await fs.mkdir(this.thumbnailDir, { recursive: true });
            console.log(`✅ Created: ${this.thumbnailDir}`);
        } catch (error) {
            console.error(`❌ Failed to create directory: ${error.message}`);
            process.exit(1);
        }
    }

    async processImages() {
        console.log('🔍 Scanning for images...');

        try {
            const files = await fs.readdir(this.sourceDir);
            const imageFiles = files.filter(file =>
                CONFIG.supportedExtensions.includes(path.extname(file).toLowerCase())
            );

            console.log(`📸 Found ${imageFiles.length} images to process\n`);

            for (const file of imageFiles) {
                await this.processImage(file);
            }
        } catch (error) {
            console.error(`❌ Error scanning directory: ${error.message}`);
            process.exit(1);
        }
    }

    async processImage(filename) {
        const sourcePath = path.join(this.sourceDir, filename);
        const baseName = path.parse(filename).name;
        const ext = path.parse(filename).ext;

        console.log(`🔄 Processing: ${filename}`);

        for (const [sizeName, config] of Object.entries(CONFIG.sizes)) {
            const thumbnailFilename = `${baseName}_${sizeName}${ext}`;
            const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);

            try {
                // Check if thumbnail already exists and is newer than source
                const sourceStats = await fs.stat(sourcePath);
                let thumbnailStats;
                try {
                    thumbnailStats = await fs.stat(thumbnailPath);
                    if (thumbnailStats.mtime > sourceStats.mtime) {
                        console.log(`   ⏭️  Skipped ${sizeName} (up to date)`);
                        this.skippedCount++;
                        continue;
                    }
                } catch {
                    // Thumbnail doesn't exist, proceed with generation
                }

                // Generate thumbnail using ImageMagick
                const command = [
                    'convert',
                    `"${sourcePath}"`,
                    '-resize', `${config.width}x${config.height}^`,
                    '-gravity', 'center',
                    '-extent', `${config.width}x${config.height}`,
                    '-quality', config.quality.toString(),
                    '-strip', // Remove metadata to reduce file size
                    `"${thumbnailPath}"`
                ].join(' ');

                execSync(command, { stdio: 'pipe' });

                // Verify file was created and get size
                const stats = await fs.stat(thumbnailPath);
                const sizeKB = Math.round(stats.size / 1024);

                console.log(`   ✅ Generated ${sizeName}: ${sizeKB}KB`);
                this.processedCount++;

            } catch (error) {
                console.log(`   ❌ Failed ${sizeName}: ${error.message}`);
                this.errorCount++;
            }
        }
    }

    async generateManifest() {
        console.log('\n📋 Generating thumbnail manifest...');

        try {
            const files = await fs.readdir(this.thumbnailDir);
            const thumbnails = [];

            for (const file of files) {
                const filePath = path.join(this.thumbnailDir, file);
                const stats = await fs.stat(filePath);
                const parsed = path.parse(file);

                // Extract size from filename (e.g., "SKC_CEM_FOR_PL02_PHE01_thumbnail.jpg")
                const parts = parsed.name.split('_');
                const sizeName = parts.pop(); // Last part should be size name
                const instrumentId = parts.join('_');

                thumbnails.push({
                    instrumentId,
                    size: sizeName,
                    filename: file,
                    sizeBytes: stats.size,
                    sizeKB: Math.round(stats.size / 1024),
                    generated: stats.mtime.toISOString(),
                    url: `/assets/thumbnails/${file}`
                });
            }

            const manifest = {
                generated: new Date().toISOString(),
                version: '1.0.0',
                totalThumbnails: thumbnails.length,
                sizes: CONFIG.sizes,
                thumbnails: thumbnails.sort((a, b) => a.instrumentId.localeCompare(b.instrumentId))
            };

            const manifestPath = path.join(this.thumbnailDir, 'thumbnail-manifest.json');
            await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

            console.log(`✅ Generated manifest: ${thumbnails.length} thumbnails`);
        } catch (error) {
            console.error(`❌ Failed to generate manifest: ${error.message}`);
        }
    }

    printSummary() {
        console.log('\n📊 SUMMARY');
        console.log('==================');
        console.log(`✅ Processed: ${this.processedCount}`);
        console.log(`⏭️  Skipped: ${this.skippedCount}`);
        console.log(`❌ Errors: ${this.errorCount}`);
        console.log(`📁 Output: ${this.thumbnailDir}`);

        if (this.errorCount === 0) {
            console.log('\n🎉 All thumbnails generated successfully!');
            console.log('\nNext steps:');
            console.log('1. Deploy thumbnails: npm run deploy');
            console.log('2. Update JavaScript to use thumbnail URLs');
            console.log('3. Test performance improvements');
        } else {
            console.log('\n⚠️  Some errors occurred. Check output above.');
        }
    }
}

// Run the generator
if (require.main === module) {
    const generator = new ThumbnailGenerator();
    generator.init().catch(error => {
        console.error('\n💥 Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = ThumbnailGenerator;