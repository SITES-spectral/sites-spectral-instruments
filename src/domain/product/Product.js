/**
 * Product Entity
 *
 * Domain entity representing a data product (L0, L1, L2, L3 processed data).
 * Follows Single Responsibility Principle - only contains product data and behavior.
 *
 * @module domain/product/Product
 */

export class Product {
    /**
     * Valid processing levels
     */
    static PROCESSING_LEVELS = {
        L0: 'L0', // Raw data
        L1: 'L1', // Geometrically corrected
        L2: 'L2', // Derived geophysical variables
        L3: 'L3', // Spatially/temporally aggregated
        L4: 'L4'  // Model output or higher-level products
    };

    /**
     * Valid product types
     */
    static TYPES = {
        IMAGE: 'image',
        TIMESERIES: 'timeseries',
        VEGETATION_INDEX: 'vegetation_index',
        SPECTRAL_DATA: 'spectral_data',
        COMPOSITE: 'composite',
        CALIBRATION: 'calibration',
        DERIVED: 'derived'
    };

    /**
     * Valid quality control levels
     */
    static QUALITY_CONTROL = {
        RAW: 'raw',
        QUALITY_CONTROLLED: 'quality_controlled',
        VALIDATED: 'validated',
        RESEARCH_GRADE: 'research_grade'
    };

    /**
     * Valid data licenses
     */
    static LICENSES = {
        CC_BY_4_0: 'CC-BY-4.0',
        CC_BY_SA_4_0: 'CC-BY-SA-4.0',
        CC0_1_0: 'CC0-1.0',
        PROPRIETARY: 'proprietary'
    };

    /**
     * Create a new Product instance
     * @param {Object} data - Product data
     */
    constructor({
        id = null,
        name,
        description = null,
        type = Product.TYPES.IMAGE,
        instrumentId,
        campaignId = null,
        processingLevel = Product.PROCESSING_LEVELS.L0,
        dataPath = null,
        dataUrl = null,
        metadata = {},
        qualityScore = null,
        qualityControlLevel = Product.QUALITY_CONTROL.RAW,
        productDate,
        processingDate = null,
        dataLicense = Product.LICENSES.CC_BY_4_0,
        licenseUrl = 'https://creativecommons.org/licenses/by/4.0/',
        doi = null,
        citation = null,
        keywords = [],
        spatialResolution = null,
        temporalResolution = null,
        format = null,
        fileSize = null,
        checksum = null,
        version = '1.0',
        isPublic = true,
        createdAt = null,
        updatedAt = null
    }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.type = type;
        this.instrumentId = instrumentId;
        this.campaignId = campaignId;
        this.processingLevel = processingLevel;
        this.dataPath = dataPath;
        this.dataUrl = dataUrl;
        this.metadata = metadata;
        this.qualityScore = qualityScore;
        this.qualityControlLevel = qualityControlLevel;
        this.productDate = productDate;
        this.processingDate = processingDate;
        this.dataLicense = dataLicense;
        this.licenseUrl = licenseUrl;
        this.doi = doi;
        this.citation = citation;
        this.keywords = keywords;
        this.spatialResolution = spatialResolution;
        this.temporalResolution = temporalResolution;
        this.format = format;
        this.fileSize = fileSize;
        this.checksum = checksum;
        this.version = version;
        this.isPublic = isPublic;
        this.createdAt = createdAt || new Date().toISOString();
        this.updatedAt = updatedAt || new Date().toISOString();

        this.validate();
    }

    /**
     * Validate product entity
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.name || typeof this.name !== 'string') {
            throw new Error('Product name is required and must be a string');
        }

        if (!Object.values(Product.TYPES).includes(this.type)) {
            throw new Error(`Invalid product type: ${this.type}`);
        }

        if (!this.instrumentId) {
            throw new Error('Product instrument ID is required');
        }

        if (!Object.values(Product.PROCESSING_LEVELS).includes(this.processingLevel)) {
            throw new Error(`Invalid processing level: ${this.processingLevel}`);
        }

        if (!Object.values(Product.QUALITY_CONTROL).includes(this.qualityControlLevel)) {
            throw new Error(`Invalid quality control level: ${this.qualityControlLevel}`);
        }

        if (this.qualityScore !== null && (this.qualityScore < 0 || this.qualityScore > 1)) {
            throw new Error('Quality score must be between 0 and 1');
        }

        if (!this.productDate) {
            throw new Error('Product date is required');
        }

        if (!this.isValidDate(this.productDate)) {
            throw new Error('Product date must be in ISO 8601 format');
        }

        if (this.processingDate && !this.isValidDate(this.processingDate)) {
            throw new Error('Processing date must be in ISO 8601 format');
        }

        if (!Array.isArray(this.keywords)) {
            throw new Error('Product keywords must be an array');
        }

        if (typeof this.isPublic !== 'boolean') {
            throw new Error('Product isPublic must be a boolean');
        }
    }

    /**
     * Check if date string is valid ISO 8601
     * @param {string} dateString - Date string to validate
     * @returns {boolean}
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    /**
     * Update product properties
     * @param {Object} updates - Properties to update
     * @returns {Product} Updated product instance
     */
    update(updates) {
        const updatedData = {
            ...this.toObject(),
            ...updates,
            updatedAt: new Date().toISOString()
        };

        return new Product(updatedData);
    }

    /**
     * Check if product is L0 (raw data)
     * @returns {boolean}
     */
    isL0() {
        return this.processingLevel === Product.PROCESSING_LEVELS.L0;
    }

    /**
     * Check if product is L1 (geometrically corrected)
     * @returns {boolean}
     */
    isL1() {
        return this.processingLevel === Product.PROCESSING_LEVELS.L1;
    }

    /**
     * Check if product is L2 (derived variables)
     * @returns {boolean}
     */
    isL2() {
        return this.processingLevel === Product.PROCESSING_LEVELS.L2;
    }

    /**
     * Check if product is L3 (aggregated)
     * @returns {boolean}
     */
    isL3() {
        return this.processingLevel === Product.PROCESSING_LEVELS.L3;
    }

    /**
     * Check if product is L4 (model output)
     * @returns {boolean}
     */
    isL4() {
        return this.processingLevel === Product.PROCESSING_LEVELS.L4;
    }

    /**
     * Check if product is quality controlled
     * @returns {boolean}
     */
    isQualityControlled() {
        return this.qualityControlLevel === Product.QUALITY_CONTROL.QUALITY_CONTROLLED ||
               this.qualityControlLevel === Product.QUALITY_CONTROL.VALIDATED ||
               this.qualityControlLevel === Product.QUALITY_CONTROL.RESEARCH_GRADE;
    }

    /**
     * Check if product is validated
     * @returns {boolean}
     */
    isValidated() {
        return this.qualityControlLevel === Product.QUALITY_CONTROL.VALIDATED ||
               this.qualityControlLevel === Product.QUALITY_CONTROL.RESEARCH_GRADE;
    }

    /**
     * Check if product is research grade
     * @returns {boolean}
     */
    isResearchGrade() {
        return this.qualityControlLevel === Product.QUALITY_CONTROL.RESEARCH_GRADE;
    }

    /**
     * Check if product is linked to a campaign
     * @returns {boolean}
     */
    hasCampaign() {
        return this.campaignId !== null;
    }

    /**
     * Check if product has a DOI
     * @returns {boolean}
     */
    hasDOI() {
        return this.doi !== null;
    }

    /**
     * Check if product is public
     * @returns {boolean}
     */
    isPublicProduct() {
        return this.isPublic;
    }

    /**
     * Check if product has quality score
     * @returns {boolean}
     */
    hasQualityScore() {
        return this.qualityScore !== null;
    }

    /**
     * Check if product has high quality (score >= 0.8)
     * @returns {boolean}
     */
    isHighQuality() {
        return this.qualityScore !== null && this.qualityScore >= 0.8;
    }

    /**
     * Check if product has acceptable quality (score >= 0.6)
     * @returns {boolean}
     */
    isAcceptableQuality() {
        return this.qualityScore !== null && this.qualityScore >= 0.6;
    }

    /**
     * Check if product has low quality (score < 0.6)
     * @returns {boolean}
     */
    isLowQuality() {
        return this.qualityScore !== null && this.qualityScore < 0.6;
    }

    /**
     * Check if product has data path
     * @returns {boolean}
     */
    hasDataPath() {
        return this.dataPath !== null;
    }

    /**
     * Check if product has data URL
     * @returns {boolean}
     */
    hasDataUrl() {
        return this.dataUrl !== null;
    }

    /**
     * Get quality rating as string
     * @returns {string} 'high', 'acceptable', 'low', or 'unknown'
     */
    getQualityRating() {
        if (this.qualityScore === null) return 'unknown';
        if (this.qualityScore >= 0.8) return 'high';
        if (this.qualityScore >= 0.6) return 'acceptable';
        return 'low';
    }

    /**
     * Add keyword to product
     * @param {string} keyword - Keyword to add
     * @returns {Product}
     */
    addKeyword(keyword) {
        if (this.keywords.includes(keyword)) {
            throw new Error(`Keyword "${keyword}" already exists`);
        }

        return this.update({
            keywords: [...this.keywords, keyword]
        });
    }

    /**
     * Remove keyword from product
     * @param {string} keyword - Keyword to remove
     * @returns {Product}
     */
    removeKeyword(keyword) {
        return this.update({
            keywords: this.keywords.filter(k => k !== keyword)
        });
    }

    /**
     * Set quality score
     * @param {number} score - Quality score (0-1)
     * @returns {Product}
     */
    setQualityScore(score) {
        if (score < 0 || score > 1) {
            throw new Error('Quality score must be between 0 and 1');
        }

        return this.update({ qualityScore: score });
    }

    /**
     * Promote quality control level
     * @returns {Product}
     */
    promoteQualityControlLevel() {
        const levels = [
            Product.QUALITY_CONTROL.RAW,
            Product.QUALITY_CONTROL.QUALITY_CONTROLLED,
            Product.QUALITY_CONTROL.VALIDATED,
            Product.QUALITY_CONTROL.RESEARCH_GRADE
        ];

        const currentIndex = levels.indexOf(this.qualityControlLevel);
        if (currentIndex === levels.length - 1) {
            throw new Error('Product is already at highest quality control level');
        }

        return this.update({
            qualityControlLevel: levels[currentIndex + 1]
        });
    }

    /**
     * Make product public
     * @returns {Product}
     */
    makePublic() {
        return this.update({ isPublic: true });
    }

    /**
     * Make product private
     * @returns {Product}
     */
    makePrivate() {
        return this.update({ isPublic: false });
    }

    /**
     * Set DOI
     * @param {string} doi - Digital Object Identifier
     * @returns {Product}
     */
    setDOI(doi) {
        return this.update({ doi });
    }

    /**
     * Set citation
     * @param {string} citation - Citation text
     * @returns {Product}
     */
    setCitation(citation) {
        return this.update({ citation });
    }

    /**
     * Get full citation with DOI if available
     * @returns {string}
     */
    getFullCitation() {
        if (this.citation) {
            return this.doi ? `${this.citation} DOI: ${this.doi}` : this.citation;
        }

        // Generate default citation
        const year = new Date(this.productDate).getFullYear();
        const base = `${this.name} (${year}). Processing Level: ${this.processingLevel}`;
        return this.doi ? `${base}. DOI: ${this.doi}` : base;
    }

    /**
     * Convert product to plain object
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            instrumentId: this.instrumentId,
            campaignId: this.campaignId,
            processingLevel: this.processingLevel,
            dataPath: this.dataPath,
            dataUrl: this.dataUrl,
            metadata: this.metadata,
            qualityScore: this.qualityScore,
            qualityControlLevel: this.qualityControlLevel,
            productDate: this.productDate,
            processingDate: this.processingDate,
            dataLicense: this.dataLicense,
            licenseUrl: this.licenseUrl,
            doi: this.doi,
            citation: this.citation,
            keywords: this.keywords,
            spatialResolution: this.spatialResolution,
            temporalResolution: this.temporalResolution,
            format: this.format,
            fileSize: this.fileSize,
            checksum: this.checksum,
            version: this.version,
            isPublic: this.isPublic,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Convert product to metadata-only object (no data paths)
     * @returns {Object}
     */
    toMetadataObject() {
        const obj = this.toObject();
        delete obj.dataPath;
        delete obj.dataUrl;
        return obj;
    }
}
