/**
 * AOI Domain Service
 *
 * Orchestrates AOI business logic operations.
 * Follows Single Responsibility Principle - handles AOI-specific business rules.
 * Follows Dependency Inversion Principle - depends on repository abstraction.
 *
 * @module domain/aoi/AOIService
 */

import { AOI } from './AOI.js';

export class AOIService {
    /**
     * @param {AOIRepository} aoiRepository - AOI repository implementation
     */
    constructor(aoiRepository) {
        this.aoiRepository = aoiRepository;
    }

    /**
     * Create a new AOI
     * @param {Object} aoiData - AOI data
     * @returns {Promise<AOI>}
     */
    async createAOI(aoiData) {
        const aoi = new AOI(aoiData);
        return await this.aoiRepository.save(aoi);
    }

    /**
     * Update an existing AOI
     * @param {number} id - AOI ID
     * @param {Object} updates - Properties to update
     * @returns {Promise<AOI>}
     */
    async updateAOI(id, updates) {
        const existingAOI = await this.aoiRepository.findById(id);
        if (!existingAOI) {
            throw new Error(`AOI with ID ${id} not found`);
        }

        const updatedAOI = existingAOI.update(updates);
        return await this.aoiRepository.save(updatedAOI);
    }

    /**
     * Delete an AOI
     * @param {number} id - AOI ID
     * @returns {Promise<boolean>}
     */
    async deleteAOI(id) {
        const exists = await this.aoiRepository.existsById(id);
        if (!exists) {
            throw new Error(`AOI with ID ${id} not found`);
        }

        return await this.aoiRepository.deleteById(id);
    }

    /**
     * Get AOI by ID
     * @param {number} id - AOI ID
     * @returns {Promise<AOI|null>}
     */
    async getAOIById(id) {
        return await this.aoiRepository.findById(id);
    }

    /**
     * Get all AOIs for a station
     * @param {number} stationId - Station ID
     * @returns {Promise<AOI[]>}
     */
    async getAOIsByStation(stationId) {
        return await this.aoiRepository.findByStationId(stationId);
    }

    /**
     * Get all AOIs for a platform
     * @param {number} platformId - Platform ID
     * @returns {Promise<AOI[]>}
     */
    async getAOIsByPlatform(platformId) {
        return await this.aoiRepository.findByPlatformId(platformId);
    }

    /**
     * Get monitoring AOIs for a station
     * @param {number} stationId - Station ID
     * @returns {Promise<AOI[]>}
     */
    async getMonitoringAOIs(stationId) {
        const stationAOIs = await this.aoiRepository.findByStationId(stationId);
        return stationAOIs.filter(aoi => aoi.isMonitoring());
    }

    /**
     * Get survey AOIs for a station
     * @param {number} stationId - Station ID
     * @returns {Promise<AOI[]>}
     */
    async getSurveyAOIs(stationId) {
        const stationAOIs = await this.aoiRepository.findByStationId(stationId);
        return stationAOIs.filter(aoi => aoi.isSurvey());
    }

    /**
     * Get calibration AOIs for a station
     * @param {number} stationId - Station ID
     * @returns {Promise<AOI[]>}
     */
    async getCalibrationAOIs(stationId) {
        const stationAOIs = await this.aoiRepository.findByStationId(stationId);
        return stationAOIs.filter(aoi => aoi.isCalibration());
    }

    /**
     * Get recurring AOIs for a station
     * @param {number} stationId - Station ID
     * @returns {Promise<AOI[]>}
     */
    async getRecurringAOIs(stationId) {
        const stationAOIs = await this.aoiRepository.findByStationId(stationId);
        return stationAOIs.filter(aoi => aoi.isRecurring());
    }

    /**
     * Get AOIs by ecosystem
     * @param {string} ecosystemCode - Ecosystem code
     * @returns {Promise<AOI[]>}
     */
    async getAOIsByEcosystem(ecosystemCode) {
        return await this.aoiRepository.findByEcosystemCode(ecosystemCode);
    }

    /**
     * Get AOIs by geometry type
     * @param {string} geometryType - Geometry type
     * @returns {Promise<AOI[]>}
     */
    async getAOIsByGeometryType(geometryType) {
        return await this.aoiRepository.findByGeometryType(geometryType);
    }

    /**
     * Link AOI to a platform
     * @param {number} aoiId - AOI ID
     * @param {number} platformId - Platform ID
     * @returns {Promise<AOI>}
     */
    async linkAOIToPlatform(aoiId, platformId) {
        return await this.updateAOI(aoiId, { platformId });
    }

    /**
     * Unlink AOI from platform
     * @param {number} aoiId - AOI ID
     * @returns {Promise<AOI>}
     */
    async unlinkAOIFromPlatform(aoiId) {
        return await this.updateAOI(aoiId, { platformId: null });
    }

    /**
     * Get all AOIs as GeoJSON FeatureCollection
     * @param {number} stationId - Station ID (optional)
     * @returns {Promise<Object>} GeoJSON FeatureCollection
     */
    async getAOIsAsGeoJSON(stationId = null) {
        const aois = stationId
            ? await this.aoiRepository.findByStationId(stationId)
            : await this.aoiRepository.findAll();

        return {
            type: 'FeatureCollection',
            features: aois.map(aoi => aoi.toGeoJSON())
        };
    }

    /**
     * Find AOIs within bounding box
     * @param {Object} bounds - Bounding box {minLat, maxLat, minLon, maxLon}
     * @returns {Promise<AOI[]>}
     */
    async findAOIsWithinBounds(bounds) {
        return await this.aoiRepository.findWithinBounds(bounds);
    }

    /**
     * Count AOIs for a station
     * @param {number} stationId - Station ID
     * @returns {Promise<number>}
     */
    async countAOIsForStation(stationId) {
        return await this.aoiRepository.countByStationId(stationId);
    }

    /**
     * Validate AOI data without saving
     * @param {Object} aoiData - AOI data
     * @returns {boolean}
     */
    validateAOIData(aoiData) {
        try {
            new AOI(aoiData);
            return true;
        } catch (error) {
            throw new Error(`AOI validation failed: ${error.message}`);
        }
    }
}
