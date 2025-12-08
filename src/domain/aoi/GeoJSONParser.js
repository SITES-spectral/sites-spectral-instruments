/**
 * GeoJSON Parser
 *
 * Handles parsing and conversion of geospatial data formats.
 * Follows Single Responsibility Principle - only handles format conversion.
 * Follows Open/Closed Principle - extensible for new formats without modification.
 *
 * @module domain/aoi/GeoJSONParser
 */

import { AOI } from './AOI.js';

export class GeoJSONParser {
    /**
     * Parse GeoJSON string to AOI objects
     * @param {string} geojsonString - GeoJSON string
     * @returns {AOI[]}
     */
    static parseGeoJSON(geojsonString) {
        let geojson;
        try {
            geojson = JSON.parse(geojsonString);
        } catch (error) {
            throw new Error(`Invalid JSON: ${error.message}`);
        }

        return this.parseGeoJSONObject(geojson);
    }

    /**
     * Parse GeoJSON object to AOI objects
     * @param {Object} geojson - GeoJSON object
     * @returns {AOI[]}
     */
    static parseGeoJSONObject(geojson) {
        if (geojson.type === 'Feature') {
            return [this.parseFeature(geojson)];
        }

        if (geojson.type === 'FeatureCollection') {
            return this.parseFeatureCollection(geojson);
        }

        if (geojson.type === 'GeometryCollection') {
            return this.parseGeometryCollection(geojson);
        }

        // Single geometry object
        if (this.isGeometry(geojson)) {
            return [this.parseGeometry(geojson)];
        }

        throw new Error(`Unsupported GeoJSON type: ${geojson.type}`);
    }

    /**
     * Parse GeoJSON Feature
     * @param {Object} feature - GeoJSON Feature
     * @returns {AOI}
     */
    static parseFeature(feature) {
        if (!feature.geometry) {
            throw new Error('Feature must have a geometry');
        }

        const geometryType = this.normalizeGeometryType(feature.geometry.type);
        this.validateGeometry(feature.geometry, geometryType);

        return AOI.fromGeoJSON(feature);
    }

    /**
     * Parse GeoJSON FeatureCollection
     * @param {Object} featureCollection - GeoJSON FeatureCollection
     * @returns {AOI[]}
     */
    static parseFeatureCollection(featureCollection) {
        if (!Array.isArray(featureCollection.features)) {
            throw new Error('FeatureCollection must have a features array');
        }

        return featureCollection.features.map(feature => this.parseFeature(feature));
    }

    /**
     * Parse GeoJSON GeometryCollection
     * @param {Object} geometryCollection - GeoJSON GeometryCollection
     * @returns {AOI[]}
     */
    static parseGeometryCollection(geometryCollection) {
        if (!Array.isArray(geometryCollection.geometries)) {
            throw new Error('GeometryCollection must have a geometries array');
        }

        return geometryCollection.geometries.map((geometry, index) => {
            return this.parseGeometry(geometry, `Geometry ${index + 1}`);
        });
    }

    /**
     * Parse single geometry to AOI
     * @param {Object} geometry - GeoJSON Geometry
     * @param {string} defaultName - Default name if not provided
     * @returns {AOI}
     */
    static parseGeometry(geometry, defaultName = 'Unnamed AOI') {
        const geometryType = this.normalizeGeometryType(geometry.type);
        this.validateGeometry(geometry, geometryType);

        return new AOI({
            name: defaultName,
            geometry: geometry,
            geometryType: geometryType,
            stationId: null, // Must be set by caller
            sourceFormat: AOI.SOURCE_FORMATS.GEOJSON
        });
    }

    /**
     * Parse KML string to GeoJSON
     * @param {string} kmlString - KML string
     * @returns {Object} GeoJSON object
     */
    static parseKML(kmlString) {
        // Basic KML to GeoJSON conversion
        // This is a simplified implementation - for production, use a library like togeojson
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(kmlString, 'text/xml');

            const placemarks = xmlDoc.getElementsByTagName('Placemark');
            const features = [];

            for (let i = 0; i < placemarks.length; i++) {
                const placemark = placemarks[i];
                const feature = this.parseKMLPlacemark(placemark);
                if (feature) {
                    features.push(feature);
                }
            }

            return {
                type: 'FeatureCollection',
                features: features
            };
        } catch (error) {
            throw new Error(`KML parsing failed: ${error.message}`);
        }
    }

    /**
     * Parse KML Placemark to GeoJSON Feature
     * @param {Element} placemark - KML Placemark element
     * @returns {Object|null} GeoJSON Feature
     */
    static parseKMLPlacemark(placemark) {
        const name = placemark.getElementsByTagName('name')[0]?.textContent || 'Unnamed';
        const description = placemark.getElementsByTagName('description')[0]?.textContent || '';

        // Try to find Point
        const point = placemark.getElementsByTagName('Point')[0];
        if (point) {
            const coordinates = point.getElementsByTagName('coordinates')[0]?.textContent;
            if (coordinates) {
                const coords = this.parseKMLCoordinates(coordinates)[0];
                return {
                    type: 'Feature',
                    properties: { name, description },
                    geometry: {
                        type: 'Point',
                        coordinates: coords
                    }
                };
            }
        }

        // Try to find Polygon
        const polygon = placemark.getElementsByTagName('Polygon')[0];
        if (polygon) {
            const outerBoundary = polygon.getElementsByTagName('outerBoundaryIs')[0];
            if (outerBoundary) {
                const coordinates = outerBoundary.getElementsByTagName('coordinates')[0]?.textContent;
                if (coordinates) {
                    const coords = this.parseKMLCoordinates(coordinates);
                    return {
                        type: 'Feature',
                        properties: { name, description },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [coords]
                        }
                    };
                }
            }
        }

        return null;
    }

    /**
     * Parse KML coordinates string
     * @param {string} coordString - KML coordinates string
     * @returns {Array} Array of [lon, lat] coordinates
     */
    static parseKMLCoordinates(coordString) {
        return coordString.trim().split(/\s+/).map(coord => {
            const parts = coord.split(',');
            return [parseFloat(parts[0]), parseFloat(parts[1])];
        });
    }

    /**
     * Normalize geometry type to lowercase
     * @param {string} type - Geometry type
     * @returns {string}
     */
    static normalizeGeometryType(type) {
        return type.toLowerCase();
    }

    /**
     * Check if object is a GeoJSON geometry
     * @param {Object} obj - Object to check
     * @returns {boolean}
     */
    static isGeometry(obj) {
        const geometryTypes = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'];
        return obj && geometryTypes.includes(obj.type);
    }

    /**
     * Validate geometry structure
     * @param {Object} geometry - GeoJSON geometry
     * @param {string} geometryType - Normalized geometry type
     * @throws {Error} If validation fails
     */
    static validateGeometry(geometry, geometryType) {
        if (!geometry.coordinates) {
            throw new Error('Geometry must have coordinates');
        }

        switch (geometryType) {
            case AOI.GEOMETRY_TYPES.POINT:
                this.validatePointCoordinates(geometry.coordinates);
                break;
            case AOI.GEOMETRY_TYPES.POLYGON:
                this.validatePolygonCoordinates(geometry.coordinates);
                break;
            case AOI.GEOMETRY_TYPES.MULTIPOLYGON:
                this.validateMultiPolygonCoordinates(geometry.coordinates);
                break;
            default:
                throw new Error(`Unsupported geometry type: ${geometryType}`);
        }
    }

    /**
     * Validate Point coordinates
     * @param {Array} coordinates - [lon, lat]
     */
    static validatePointCoordinates(coordinates) {
        if (!Array.isArray(coordinates) || coordinates.length < 2) {
            throw new Error('Point coordinates must be [lon, lat]');
        }

        const [lon, lat] = coordinates;
        if (typeof lon !== 'number' || typeof lat !== 'number') {
            throw new Error('Coordinates must be numbers');
        }

        if (lon < -180 || lon > 180) {
            throw new Error('Longitude must be between -180 and 180');
        }

        if (lat < -90 || lat > 90) {
            throw new Error('Latitude must be between -90 and 90');
        }
    }

    /**
     * Validate Polygon coordinates
     * @param {Array} coordinates - Array of linear rings
     */
    static validatePolygonCoordinates(coordinates) {
        if (!Array.isArray(coordinates) || coordinates.length === 0) {
            throw new Error('Polygon coordinates must be an array of linear rings');
        }

        coordinates.forEach((ring, index) => {
            if (!Array.isArray(ring) || ring.length < 4) {
                throw new Error(`Polygon ring ${index} must have at least 4 positions`);
            }

            ring.forEach(position => this.validatePointCoordinates(position));

            // First and last positions must be identical
            const first = ring[0];
            const last = ring[ring.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
                throw new Error(`Polygon ring ${index} must be closed (first and last positions must be identical)`);
            }
        });
    }

    /**
     * Validate MultiPolygon coordinates
     * @param {Array} coordinates - Array of polygon coordinates
     */
    static validateMultiPolygonCoordinates(coordinates) {
        if (!Array.isArray(coordinates) || coordinates.length === 0) {
            throw new Error('MultiPolygon coordinates must be an array of polygons');
        }

        coordinates.forEach((polygon, index) => {
            try {
                this.validatePolygonCoordinates(polygon);
            } catch (error) {
                throw new Error(`MultiPolygon polygon ${index}: ${error.message}`);
            }
        });
    }

    /**
     * Convert AOI to GeoJSON Feature
     * @param {AOI} aoi - AOI entity
     * @returns {Object} GeoJSON Feature
     */
    static toGeoJSON(aoi) {
        return aoi.toGeoJSON();
    }

    /**
     * Convert multiple AOIs to GeoJSON FeatureCollection
     * @param {AOI[]} aois - Array of AOI entities
     * @returns {Object} GeoJSON FeatureCollection
     */
    static toGeoJSONCollection(aois) {
        return {
            type: 'FeatureCollection',
            features: aois.map(aoi => aoi.toGeoJSON())
        };
    }
}
