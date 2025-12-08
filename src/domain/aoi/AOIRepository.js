/**
 * AOI Repository Port (Interface)
 *
 * Defines the contract for AOI persistence operations.
 * Follows Interface Segregation Principle - focused interface for AOI operations.
 * Follows Dependency Inversion Principle - domain depends on this abstraction.
 *
 * Implementations (adapters) live in infrastructure layer.
 *
 * @module domain/aoi/AOIRepository
 */

export class AOIRepository {
    /**
     * Find AOI by ID
     * @param {number} id - AOI ID
     * @returns {Promise<AOI|null>}
     */
    async findById(id) {
        throw new Error('Method findById() must be implemented');
    }

    /**
     * Find all AOIs for a station
     * @param {number} stationId - Station ID
     * @returns {Promise<AOI[]>}
     */
    async findByStationId(stationId) {
        throw new Error('Method findByStationId() must be implemented');
    }

    /**
     * Find all AOIs for a platform
     * @param {number} platformId - Platform ID
     * @returns {Promise<AOI[]>}
     */
    async findByPlatformId(platformId) {
        throw new Error('Method findByPlatformId() must be implemented');
    }

    /**
     * Find AOIs by mission type
     * @param {string} missionType - Mission type
     * @returns {Promise<AOI[]>}
     */
    async findByMissionType(missionType) {
        throw new Error('Method findByMissionType() must be implemented');
    }

    /**
     * Find AOIs by geometry type
     * @param {string} geometryType - Geometry type
     * @returns {Promise<AOI[]>}
     */
    async findByGeometryType(geometryType) {
        throw new Error('Method findByGeometryType() must be implemented');
    }

    /**
     * Find AOIs by ecosystem code
     * @param {string} ecosystemCode - Ecosystem code
     * @returns {Promise<AOI[]>}
     */
    async findByEcosystemCode(ecosystemCode) {
        throw new Error('Method findByEcosystemCode() must be implemented');
    }

    /**
     * Find all AOIs
     * @returns {Promise<AOI[]>}
     */
    async findAll() {
        throw new Error('Method findAll() must be implemented');
    }

    /**
     * Save AOI (create or update)
     * @param {AOI} aoi - AOI entity
     * @returns {Promise<AOI>}
     */
    async save(aoi) {
        throw new Error('Method save() must be implemented');
    }

    /**
     * Delete AOI by ID
     * @param {number} id - AOI ID
     * @returns {Promise<boolean>}
     */
    async deleteById(id) {
        throw new Error('Method deleteById() must be implemented');
    }

    /**
     * Count AOIs for a station
     * @param {number} stationId - Station ID
     * @returns {Promise<number>}
     */
    async countByStationId(stationId) {
        throw new Error('Method countByStationId() must be implemented');
    }

    /**
     * Check if AOI exists by ID
     * @param {number} id - AOI ID
     * @returns {Promise<boolean>}
     */
    async existsById(id) {
        throw new Error('Method existsById() must be implemented');
    }

    /**
     * Find AOIs within bounding box
     * @param {Object} bounds - Bounding box {minLat, maxLat, minLon, maxLon}
     * @returns {Promise<AOI[]>}
     */
    async findWithinBounds(bounds) {
        throw new Error('Method findWithinBounds() must be implemented');
    }
}
