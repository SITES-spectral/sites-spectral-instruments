/**
 * AOI (Area of Interest) Entity
 *
 * Domain entity representing a geographic area of interest for monitoring or surveys.
 * Follows Single Responsibility Principle - only contains AOI data and behavior.
 *
 * @module domain/aoi/AOI
 */

export class AOI {
    /**
     * Valid geometry types supported by AOI
     */
    static GEOMETRY_TYPES = {
        POINT: 'point',
        POLYGON: 'polygon',
        MULTIPOLYGON: 'multipolygon'
    };

    /**
     * Valid mission types
     */
    static MISSION_TYPES = {
        MONITORING: 'monitoring',
        SURVEY: 'survey',
        CALIBRATION: 'calibration'
    };

    /**
     * Valid mission recurrence patterns
     */
    static RECURRENCE = {
        DAILY: 'daily',
        WEEKLY: 'weekly',
        MONTHLY: 'monthly',
        SEASONAL: 'seasonal',
        ONE_TIME: 'one_time'
    };

    /**
     * Valid source format types
     */
    static SOURCE_FORMATS = {
        MANUAL: 'manual',
        GEOJSON: 'geojson',
        KML: 'kml'
    };

    /**
     * Create a new AOI instance
     * @param {Object} data - AOI data
     */
    constructor({
        id = null,
        name,
        description = null,
        geometry,
        geometryType,
        stationId,
        ecosystemCode = null,
        platformTypeCode = null,
        platformId = null,
        missionType = AOI.MISSION_TYPES.MONITORING,
        missionRecurrence = AOI.RECURRENCE.ONE_TIME,
        sourceFormat = AOI.SOURCE_FORMATS.MANUAL,
        metadata = {},
        createdAt = null,
        updatedAt = null
    }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.geometry = geometry;
        this.geometryType = geometryType;
        this.stationId = stationId;
        this.ecosystemCode = ecosystemCode;
        this.platformTypeCode = platformTypeCode;
        this.platformId = platformId;
        this.missionType = missionType;
        this.missionRecurrence = missionRecurrence;
        this.sourceFormat = sourceFormat;
        this.metadata = metadata;
        this.createdAt = createdAt || new Date().toISOString();
        this.updatedAt = updatedAt || new Date().toISOString();

        this.validate();
    }

    /**
     * Validate AOI entity
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.name || typeof this.name !== 'string') {
            throw new Error('AOI name is required and must be a string');
        }

        if (!this.geometry) {
            throw new Error('AOI geometry is required');
        }

        if (!Object.values(AOI.GEOMETRY_TYPES).includes(this.geometryType)) {
            throw new Error(`Invalid geometry type: ${this.geometryType}`);
        }

        if (!this.stationId) {
            throw new Error('AOI station ID is required');
        }

        if (!Object.values(AOI.MISSION_TYPES).includes(this.missionType)) {
            throw new Error(`Invalid mission type: ${this.missionType}`);
        }

        if (!Object.values(AOI.RECURRENCE).includes(this.missionRecurrence)) {
            throw new Error(`Invalid mission recurrence: ${this.missionRecurrence}`);
        }

        if (!Object.values(AOI.SOURCE_FORMATS).includes(this.sourceFormat)) {
            throw new Error(`Invalid source format: ${this.sourceFormat}`);
        }
    }

    /**
     * Update AOI properties
     * @param {Object} updates - Properties to update
     * @returns {AOI} Updated AOI instance
     */
    update(updates) {
        const updatedData = {
            ...this.toObject(),
            ...updates,
            updatedAt: new Date().toISOString()
        };

        return new AOI(updatedData);
    }

    /**
     * Check if AOI is a point
     * @returns {boolean}
     */
    isPoint() {
        return this.geometryType === AOI.GEOMETRY_TYPES.POINT;
    }

    /**
     * Check if AOI is a polygon
     * @returns {boolean}
     */
    isPolygon() {
        return this.geometryType === AOI.GEOMETRY_TYPES.POLYGON;
    }

    /**
     * Check if AOI is a multipolygon
     * @returns {boolean}
     */
    isMultiPolygon() {
        return this.geometryType === AOI.GEOMETRY_TYPES.MULTIPOLYGON;
    }

    /**
     * Check if AOI has recurring missions
     * @returns {boolean}
     */
    isRecurring() {
        return this.missionRecurrence !== AOI.RECURRENCE.ONE_TIME;
    }

    /**
     * Check if AOI is monitoring type
     * @returns {boolean}
     */
    isMonitoring() {
        return this.missionType === AOI.MISSION_TYPES.MONITORING;
    }

    /**
     * Check if AOI is survey type
     * @returns {boolean}
     */
    isSurvey() {
        return this.missionType === AOI.MISSION_TYPES.SURVEY;
    }

    /**
     * Check if AOI is calibration type
     * @returns {boolean}
     */
    isCalibration() {
        return this.missionType === AOI.MISSION_TYPES.CALIBRATION;
    }

    /**
     * Check if AOI is linked to a platform
     * @returns {boolean}
     */
    hasPlatform() {
        return this.platformId !== null;
    }

    /**
     * Convert AOI to plain object
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            geometry: this.geometry,
            geometryType: this.geometryType,
            stationId: this.stationId,
            ecosystemCode: this.ecosystemCode,
            platformTypeCode: this.platformTypeCode,
            platformId: this.platformId,
            missionType: this.missionType,
            missionRecurrence: this.missionRecurrence,
            sourceFormat: this.sourceFormat,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Convert AOI to GeoJSON Feature
     * @returns {Object} GeoJSON Feature
     */
    toGeoJSON() {
        return {
            type: 'Feature',
            id: this.id,
            geometry: this.geometry,
            properties: {
                name: this.name,
                description: this.description,
                stationId: this.stationId,
                ecosystemCode: this.ecosystemCode,
                platformTypeCode: this.platformTypeCode,
                platformId: this.platformId,
                missionType: this.missionType,
                missionRecurrence: this.missionRecurrence,
                sourceFormat: this.sourceFormat,
                metadata: this.metadata,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt
            }
        };
    }

    /**
     * Create AOI from GeoJSON Feature
     * @param {Object} feature - GeoJSON Feature
     * @returns {AOI}
     */
    static fromGeoJSON(feature) {
        if (feature.type !== 'Feature') {
            throw new Error('Invalid GeoJSON: must be a Feature');
        }

        return new AOI({
            id: feature.id || null,
            name: feature.properties.name,
            description: feature.properties.description,
            geometry: feature.geometry,
            geometryType: feature.geometry.type.toLowerCase(),
            stationId: feature.properties.stationId,
            ecosystemCode: feature.properties.ecosystemCode,
            platformTypeCode: feature.properties.platformTypeCode,
            platformId: feature.properties.platformId,
            missionType: feature.properties.missionType,
            missionRecurrence: feature.properties.missionRecurrence,
            sourceFormat: feature.properties.sourceFormat || AOI.SOURCE_FORMATS.GEOJSON,
            metadata: feature.properties.metadata || {},
            createdAt: feature.properties.createdAt,
            updatedAt: feature.properties.updatedAt
        });
    }
}
