// SITES Spectral V3 AOIs Handler
// Areas of Interest with spatial query support
// Version: 8.0.0

import { requireAuthentication, checkUserPermissions } from '../../auth/permissions.js';
import { executeQuery, executeQueryFirst, executeQueryRun } from '../../utils/database.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse,
  createValidationErrorResponse
} from '../../utils/responses.js';
import { parsePaginationParams, parseSortParams, createPaginatedResponse, createGeoJSONResponse } from '../api-handler-v3.js';

/**
 * Handle V3 AOI requests with spatial queries
 * @param {string} method - HTTP method
 * @param {Object} params - Route parameters { id, spatialQuery, format, stationId, platformId }
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {URL} url - Parsed URL object
 * @returns {Response} AOI response
 */
export async function handleAOIsV3(method, params, request, env, url) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user;
  }

  try {
    // Handle spatial queries
    if (params.spatialQuery) {
      return await handleSpatialQuery(params.spatialQuery, user, request, env, url);
    }

    // Handle GeoJSON format requests
    if (params.format === 'geojson') {
      if (params.id) {
        return await getAOIAsGeoJSON(params.id, user, env);
      } else {
        return await getAllAOIsAsGeoJSON(user, request, env, url);
      }
    }

    // Handle filtered queries
    if (params.stationId) {
      return await getAOIsByStationV3(params.stationId, user, request, env, url);
    }

    if (params.platformId) {
      return await getAOIsByPlatformV3(params.platformId, user, request, env, url);
    }

    // Standard CRUD operations
    switch (method) {
      case 'GET':
        if (params.id) {
          return await getAOIByIdV3(params.id, user, env);
        } else {
          return await getAOIsListV3(user, request, env, url);
        }

      case 'POST':
        return await createAOIV3(user, request, env);

      case 'PUT':
        if (!params.id) {
          return createErrorResponse('AOI ID required for update', 400);
        }
        return await updateAOIV3(params.id, user, request, env);

      case 'DELETE':
        if (!params.id) {
          return createErrorResponse('AOI ID required for deletion', 400);
        }
        return await deleteAOIV3(params.id, user, env);

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('AOI V3 handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Handle spatial query requests
 * Supported queries: bbox, point, intersects, within, nearest
 */
async function handleSpatialQuery(queryType, user, request, env, url) {
  switch (queryType) {
    case 'bbox':
      return await queryAOIsByBBox(user, request, env, url);

    case 'point':
      return await queryAOIsByPoint(user, request, env, url);

    case 'intersects':
      return await queryAOIsIntersects(user, request, env, url);

    case 'within':
      return await queryAOIsWithin(user, request, env, url);

    case 'nearest':
      return await queryNearestAOIs(user, request, env, url);

    default:
      return createErrorResponse(`Unknown spatial query type: ${queryType}. Supported: bbox, point, intersects, within, nearest`, 400);
  }
}

/**
 * Query AOIs within a bounding box
 * Query params: minLon, minLat, maxLon, maxLat
 */
async function queryAOIsByBBox(user, request, env, url) {
  const minLon = parseFloat(url.searchParams.get('minLon') || url.searchParams.get('west'));
  const minLat = parseFloat(url.searchParams.get('minLat') || url.searchParams.get('south'));
  const maxLon = parseFloat(url.searchParams.get('maxLon') || url.searchParams.get('east'));
  const maxLat = parseFloat(url.searchParams.get('maxLat') || url.searchParams.get('north'));

  if (isNaN(minLon) || isNaN(minLat) || isNaN(maxLon) || isNaN(maxLat)) {
    return createErrorResponse('Bounding box parameters required: minLon, minLat, maxLon, maxLat', 400);
  }

  // Validate coordinates
  if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) {
    return createErrorResponse('Invalid coordinates. Longitude: -180 to 180, Latitude: -90 to 90', 400);
  }

  if (minLon >= maxLon || minLat >= maxLat) {
    return createErrorResponse('Invalid bounding box: min values must be less than max values', 400);
  }

  // Query AOIs where centroid is within bbox OR bbox intersects AOI bbox
  let query = `
    SELECT a.id, a.name, a.normalized_name, a.description,
           a.geometry_type, a.geometry_json, a.bbox_json,
           a.centroid_lat, a.centroid_lon, a.area_m2, a.perimeter_m,
           a.ecosystem_code, a.purpose, a.aoi_type, a.status,
           s.acronym as station_acronym, s.display_name as station_name,
           p.display_name as platform_name, p.platform_type
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    LEFT JOIN platforms p ON a.platform_id = p.id
    WHERE a.status = 'active'
      AND a.centroid_lon >= ? AND a.centroid_lon <= ?
      AND a.centroid_lat >= ? AND a.centroid_lat <= ?
  `;

  const params = [minLon, maxLon, minLat, maxLat];

  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  query += ' ORDER BY a.name';

  const result = await executeQuery(env, query, params, 'queryAOIsByBBox');
  const aois = result?.results || [];

  // Convert to GeoJSON
  const features = aois.map(aoi => aoiToGeoJSONFeature(aoi)).filter(f => f !== null);

  return createSuccessResponse(createGeoJSONResponse(features, {
    query: 'bbox',
    bounds: { minLon, minLat, maxLon, maxLat },
    count: features.length
  }));
}

/**
 * Query AOIs containing a specific point
 * Query params: lon, lat
 */
async function queryAOIsByPoint(user, request, env, url) {
  const lon = parseFloat(url.searchParams.get('lon') || url.searchParams.get('longitude'));
  const lat = parseFloat(url.searchParams.get('lat') || url.searchParams.get('latitude'));

  if (isNaN(lon) || isNaN(lat)) {
    return createErrorResponse('Point coordinates required: lon, lat', 400);
  }

  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
    return createErrorResponse('Invalid coordinates. Longitude: -180 to 180, Latitude: -90 to 90', 400);
  }

  // Query all active AOIs and check point-in-polygon
  let query = `
    SELECT a.id, a.name, a.normalized_name, a.description,
           a.geometry_type, a.geometry_json, a.bbox_json,
           a.centroid_lat, a.centroid_lon, a.area_m2, a.perimeter_m,
           a.ecosystem_code, a.purpose, a.aoi_type, a.status,
           s.acronym as station_acronym, s.display_name as station_name,
           p.display_name as platform_name, p.platform_type
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    LEFT JOIN platforms p ON a.platform_id = p.id
    WHERE a.status = 'active'
  `;

  const params = [];

  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const result = await executeQuery(env, query, params, 'queryAOIsByPoint');
  const aois = result?.results || [];

  // Filter AOIs that contain the point
  const containingAOIs = aois.filter(aoi => {
    if (!aoi.geometry_json) return false;
    try {
      const geometry = JSON.parse(aoi.geometry_json);
      return pointInPolygon([lon, lat], geometry);
    } catch (e) {
      return false;
    }
  });

  const features = containingAOIs.map(aoi => aoiToGeoJSONFeature(aoi)).filter(f => f !== null);

  return createSuccessResponse(createGeoJSONResponse(features, {
    query: 'point',
    point: { lon, lat },
    count: features.length
  }));
}

/**
 * Query AOIs that intersect with a given geometry (POST body)
 */
async function queryAOIsIntersects(user, request, env, url) {
  if (request.method !== 'POST') {
    return createErrorResponse('POST method required with GeoJSON geometry in body', 400);
  }

  let queryGeometry;
  try {
    const body = await request.json();
    queryGeometry = body.geometry || body;

    if (!queryGeometry.type || !queryGeometry.coordinates) {
      return createErrorResponse('Invalid GeoJSON geometry', 400);
    }
  } catch (e) {
    return createErrorResponse('Invalid JSON body', 400);
  }

  // Get the bounding box of the query geometry for initial filtering
  const queryBbox = getBoundingBox(queryGeometry);

  let query = `
    SELECT a.id, a.name, a.normalized_name, a.description,
           a.geometry_type, a.geometry_json, a.bbox_json,
           a.centroid_lat, a.centroid_lon, a.area_m2, a.perimeter_m,
           a.ecosystem_code, a.purpose, a.aoi_type, a.status,
           s.acronym as station_acronym, s.display_name as station_name,
           p.display_name as platform_name, p.platform_type
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    LEFT JOIN platforms p ON a.platform_id = p.id
    WHERE a.status = 'active'
  `;

  const params = [];

  // Use bbox for initial filtering
  if (queryBbox) {
    query += ` AND a.centroid_lon >= ? AND a.centroid_lon <= ?
               AND a.centroid_lat >= ? AND a.centroid_lat <= ?`;
    params.push(queryBbox[0] - 1, queryBbox[2] + 1, queryBbox[1] - 1, queryBbox[3] + 1);
  }

  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const result = await executeQuery(env, query, params, 'queryAOIsIntersects');
  const aois = result?.results || [];

  // Filter AOIs that intersect (simplified: check if bboxes overlap or centroids are within query)
  const intersectingAOIs = aois.filter(aoi => {
    if (!aoi.bbox_json && !aoi.geometry_json) return false;
    try {
      let aoiBbox;
      if (aoi.bbox_json) {
        aoiBbox = JSON.parse(aoi.bbox_json);
      } else {
        const geometry = JSON.parse(aoi.geometry_json);
        aoiBbox = getBoundingBox(geometry);
      }
      return bboxesIntersect(queryBbox, aoiBbox);
    } catch (e) {
      return false;
    }
  });

  const features = intersectingAOIs.map(aoi => aoiToGeoJSONFeature(aoi)).filter(f => f !== null);

  return createSuccessResponse(createGeoJSONResponse(features, {
    query: 'intersects',
    queryGeometryType: queryGeometry.type,
    count: features.length
  }));
}

/**
 * Query AOIs that are completely within a given geometry
 */
async function queryAOIsWithin(user, request, env, url) {
  if (request.method !== 'POST') {
    return createErrorResponse('POST method required with GeoJSON geometry in body', 400);
  }

  let containerGeometry;
  try {
    const body = await request.json();
    containerGeometry = body.geometry || body;

    if (!containerGeometry.type || !containerGeometry.coordinates) {
      return createErrorResponse('Invalid GeoJSON geometry', 400);
    }
  } catch (e) {
    return createErrorResponse('Invalid JSON body', 400);
  }

  const containerBbox = getBoundingBox(containerGeometry);

  let query = `
    SELECT a.id, a.name, a.normalized_name, a.description,
           a.geometry_type, a.geometry_json, a.bbox_json,
           a.centroid_lat, a.centroid_lon, a.area_m2, a.perimeter_m,
           a.ecosystem_code, a.purpose, a.aoi_type, a.status,
           s.acronym as station_acronym, s.display_name as station_name,
           p.display_name as platform_name, p.platform_type
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    LEFT JOIN platforms p ON a.platform_id = p.id
    WHERE a.status = 'active'
      AND a.centroid_lon >= ? AND a.centroid_lon <= ?
      AND a.centroid_lat >= ? AND a.centroid_lat <= ?
  `;

  const params = [containerBbox[0], containerBbox[2], containerBbox[1], containerBbox[3]];

  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const result = await executeQuery(env, query, params, 'queryAOIsWithin');
  const aois = result?.results || [];

  // Filter AOIs whose centroid is within the container geometry
  const withinAOIs = aois.filter(aoi => {
    if (!aoi.centroid_lon || !aoi.centroid_lat) return false;
    return pointInPolygon([aoi.centroid_lon, aoi.centroid_lat], containerGeometry);
  });

  const features = withinAOIs.map(aoi => aoiToGeoJSONFeature(aoi)).filter(f => f !== null);

  return createSuccessResponse(createGeoJSONResponse(features, {
    query: 'within',
    containerGeometryType: containerGeometry.type,
    count: features.length
  }));
}

/**
 * Query nearest AOIs to a point
 * Query params: lon, lat, limit (default 5)
 */
async function queryNearestAOIs(user, request, env, url) {
  const lon = parseFloat(url.searchParams.get('lon'));
  const lat = parseFloat(url.searchParams.get('lat'));
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '5', 10), 25);

  if (isNaN(lon) || isNaN(lat)) {
    return createErrorResponse('Point coordinates required: lon, lat', 400);
  }

  // Calculate approximate distance using Euclidean formula (simplified for SQLite)
  let query = `
    SELECT a.id, a.name, a.normalized_name, a.description,
           a.geometry_type, a.geometry_json, a.bbox_json,
           a.centroid_lat, a.centroid_lon, a.area_m2, a.perimeter_m,
           a.ecosystem_code, a.purpose, a.aoi_type, a.status,
           s.acronym as station_acronym, s.display_name as station_name,
           p.display_name as platform_name, p.platform_type,
           ((a.centroid_lon - ?) * (a.centroid_lon - ?) +
            (a.centroid_lat - ?) * (a.centroid_lat - ?)) as distance_sq
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    LEFT JOIN platforms p ON a.platform_id = p.id
    WHERE a.status = 'active'
      AND a.centroid_lon IS NOT NULL
      AND a.centroid_lat IS NOT NULL
  `;

  const params = [lon, lon, lat, lat];

  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  query += ' ORDER BY distance_sq ASC LIMIT ?';
  params.push(limit);

  const result = await executeQuery(env, query, params, 'queryNearestAOIs');
  const aois = result?.results || [];

  // Calculate actual distance in km (approximate)
  const featuresWithDistance = aois.map(aoi => {
    const feature = aoiToGeoJSONFeature(aoi);
    if (feature) {
      const distanceKm = haversineDistance(lat, lon, aoi.centroid_lat, aoi.centroid_lon);
      feature.properties.distance_km = Math.round(distanceKm * 100) / 100;
    }
    return feature;
  }).filter(f => f !== null);

  return createSuccessResponse(createGeoJSONResponse(featuresWithDistance, {
    query: 'nearest',
    point: { lon, lat },
    limit,
    count: featuresWithDistance.length
  }));
}

/**
 * Get AOI by ID
 */
async function getAOIByIdV3(id, user, env) {
  let query = `
    SELECT a.id, a.station_id, a.platform_id, a.name, a.normalized_name,
           a.description, a.geometry_type, a.geometry_json, a.bbox_json,
           a.centroid_lat, a.centroid_lon, a.area_m2, a.perimeter_m,
           a.ecosystem_code, a.purpose, a.aoi_type, a.status,
           a.source, a.source_file, a.source_crs,
           a.created_by, a.created_at, a.updated_at,
           s.acronym as station_acronym, s.display_name as station_name,
           p.display_name as platform_name, p.platform_type
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    LEFT JOIN platforms p ON a.platform_id = p.id
    WHERE a.id = ?
  `;

  const params = [id];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const aoi = await executeQueryFirst(env, query, params, 'getAOIByIdV3');

  if (!aoi) {
    return createNotFoundResponse();
  }

  // Parse JSON fields
  if (aoi.geometry_json) {
    try {
      aoi.geometry = JSON.parse(aoi.geometry_json);
    } catch (e) {
      aoi.geometry = null;
    }
  }

  if (aoi.bbox_json) {
    try {
      aoi.bbox = JSON.parse(aoi.bbox_json);
    } catch (e) {
      aoi.bbox = null;
    }
  }

  // Get related campaign count
  const campaignCount = await executeQueryFirst(env,
    'SELECT COUNT(*) as count FROM acquisition_campaigns WHERE aoi_id = ?',
    [id], 'getAOICampaignCount'
  );
  aoi.campaign_count = campaignCount?.count || 0;

  return createSuccessResponse(aoi);
}

/**
 * Get AOI as GeoJSON Feature
 */
async function getAOIAsGeoJSON(id, user, env) {
  const response = await getAOIByIdV3(id, user, env);

  if (response.status !== 200) {
    return response;
  }

  const aoi = JSON.parse(await response.text());
  const feature = aoiToGeoJSONFeature(aoi);

  if (!feature) {
    return createErrorResponse('AOI has no valid geometry', 400);
  }

  return createSuccessResponse(feature);
}

/**
 * Get all AOIs as GeoJSON FeatureCollection
 */
async function getAllAOIsAsGeoJSON(user, request, env, url) {
  const stationParam = url.searchParams.get('station');
  const typeParam = url.searchParams.get('type');
  const statusParam = url.searchParams.get('status') || 'active';

  let query = `
    SELECT a.id, a.name, a.normalized_name, a.description,
           a.geometry_type, a.geometry_json, a.bbox_json,
           a.centroid_lat, a.centroid_lon, a.area_m2, a.perimeter_m,
           a.ecosystem_code, a.purpose, a.aoi_type, a.status,
           s.acronym as station_acronym, s.display_name as station_name,
           p.display_name as platform_name, p.platform_type
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    LEFT JOIN platforms p ON a.platform_id = p.id
  `;

  let whereConditions = [];
  let params = [];

  if (stationParam) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ? OR s.id = ?)');
    params.push(stationParam, stationParam, stationParam);
  }

  if (typeParam) {
    whereConditions.push('a.aoi_type = ?');
    params.push(typeParam);
  }

  if (statusParam && statusParam !== 'all') {
    whereConditions.push('a.status = ?');
    params.push(statusParam);
  }

  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += ' ORDER BY s.acronym, a.name';

  const result = await executeQuery(env, query, params, 'getAllAOIsAsGeoJSON');
  const aois = result?.results || [];

  const features = aois.map(aoi => aoiToGeoJSONFeature(aoi)).filter(f => f !== null);

  return createSuccessResponse(createGeoJSONResponse(features, {
    station: stationParam,
    type: typeParam,
    status: statusParam,
    count: features.length
  }));
}

/**
 * Get AOIs list with pagination
 */
async function getAOIsListV3(user, request, env, url) {
  const pagination = parsePaginationParams(url);
  const { sortBy, sortOrder } = parseSortParams(url, ['created_at', 'name', 'id', 'area_m2']);

  const stationParam = url.searchParams.get('station');
  const platformParam = url.searchParams.get('platform');
  const typeParam = url.searchParams.get('type');
  const statusParam = url.searchParams.get('status') || 'active';

  let whereConditions = [];
  let params = [];

  if (stationParam) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ? OR s.id = ?)');
    params.push(stationParam, stationParam, stationParam);
  }

  if (platformParam) {
    whereConditions.push('(p.id = ? OR p.normalized_name = ?)');
    params.push(platformParam, platformParam);
  }

  if (typeParam) {
    whereConditions.push('a.aoi_type = ?');
    params.push(typeParam);
  }

  if (statusParam && statusParam !== 'all') {
    whereConditions.push('a.status = ?');
    params.push(statusParam);
  }

  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  // Count query
  const countQuery = `
    SELECT COUNT(*) as total
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    LEFT JOIN platforms p ON a.platform_id = p.id
    ${whereClause}
  `;
  const countResult = await executeQueryFirst(env, countQuery, params, 'getAOIsListCount');
  const totalCount = countResult?.total || 0;

  // Main query
  const query = `
    SELECT a.id, a.station_id, a.platform_id, a.name, a.normalized_name,
           a.description, a.geometry_type, a.bbox_json,
           a.centroid_lat, a.centroid_lon, a.area_m2, a.perimeter_m,
           a.ecosystem_code, a.purpose, a.aoi_type, a.status,
           a.source, a.created_at,
           s.acronym as station_acronym, s.display_name as station_name,
           p.display_name as platform_name, p.platform_type,
           (SELECT COUNT(*) FROM acquisition_campaigns WHERE aoi_id = a.id) as campaign_count
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    LEFT JOIN platforms p ON a.platform_id = p.id
    ${whereClause}
    ORDER BY a.${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, pagination.limit, pagination.offset];
  const result = await executeQuery(env, query, queryParams, 'getAOIsListV3');

  const aois = (result?.results || []).map(aoi => {
    if (aoi.bbox_json) {
      try {
        aoi.bbox = JSON.parse(aoi.bbox_json);
      } catch (e) {
        aoi.bbox = null;
      }
    }
    return aoi;
  });

  const baseUrl = url.origin + url.pathname;
  return createSuccessResponse(createPaginatedResponse(aois, totalCount, pagination, baseUrl));
}

/**
 * Get AOIs by station
 */
async function getAOIsByStationV3(stationId, user, request, env, url) {
  url.searchParams.set('station', stationId);
  return await getAOIsListV3(user, request, env, url);
}

/**
 * Get AOIs by platform
 */
async function getAOIsByPlatformV3(platformId, user, request, env, url) {
  url.searchParams.set('platform', platformId);
  return await getAOIsListV3(user, request, env, url);
}

/**
 * Create a new AOI
 */
async function createAOIV3(user, request, env) {
  const permission = checkUserPermissions(user, 'aois', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const aoiData = await request.json();
  const errors = validateAOIData(aoiData);

  if (errors.length > 0) {
    return createValidationErrorResponse(errors);
  }

  // Get station info
  let stationId = aoiData.station_id;
  let stationNormalizedName = null;

  if (aoiData.platform_id) {
    const platform = await executeQueryFirst(env, `
      SELECT p.id, p.station_id, s.normalized_name as station_normalized_name
      FROM platforms p JOIN stations s ON p.station_id = s.id
      WHERE p.id = ?
    `, [aoiData.platform_id], 'createAOIV3-platformCheck');

    if (!platform) {
      return createErrorResponse('Platform not found', 404);
    }

    stationId = platform.station_id;
    stationNormalizedName = platform.station_normalized_name;
  } else if (stationId) {
    const station = await executeQueryFirst(env,
      'SELECT normalized_name FROM stations WHERE id = ?',
      [stationId], 'createAOIV3-stationCheck'
    );
    if (station) {
      stationNormalizedName = station.normalized_name;
    }
  }

  // Check station access
  if (user.role === 'station' && user.station_normalized_name !== stationNormalizedName) {
    return createForbiddenResponse();
  }

  // Generate normalized name
  let normalizedName = aoiData.normalized_name;
  if (!normalizedName && aoiData.name) {
    normalizedName = aoiData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  // Parse and validate geometry
  const geometryJson = typeof aoiData.geometry_json === 'string'
    ? aoiData.geometry_json
    : JSON.stringify(aoiData.geometry_json);

  // Calculate bbox and centroid from geometry
  let geometry;
  try {
    geometry = JSON.parse(geometryJson);
  } catch (e) {
    return createErrorResponse('Invalid geometry JSON', 400);
  }

  const bbox = getBoundingBox(geometry);
  const centroid = getCentroid(geometry);

  const bboxJson = bbox ? JSON.stringify(bbox) : null;

  const now = new Date().toISOString();

  const insertQuery = `
    INSERT INTO areas_of_interest (
      station_id, platform_id, name, normalized_name, description,
      geometry_type, geometry_json, bbox_json,
      centroid_lat, centroid_lon, area_m2, perimeter_m,
      ecosystem_code, purpose, aoi_type, status,
      source, source_file, source_crs,
      created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await executeQueryRun(env, insertQuery, [
    stationId,
    aoiData.platform_id || null,
    aoiData.name.trim(),
    normalizedName,
    aoiData.description || '',
    aoiData.geometry_type || geometry.type || 'Polygon',
    geometryJson,
    bboxJson,
    centroid ? centroid[1] : aoiData.centroid_lat || null,
    centroid ? centroid[0] : aoiData.centroid_lon || null,
    aoiData.area_m2 || null,
    aoiData.perimeter_m || null,
    aoiData.ecosystem_code || null,
    aoiData.purpose || 'mapping',
    aoiData.aoi_type || 'flight_area',
    aoiData.status || 'active',
    aoiData.source || 'manual',
    aoiData.source_file || null,
    aoiData.source_crs || 'EPSG:4326',
    user.id || null,
    now,
    now
  ], 'createAOIV3');

  if (!result || !result.meta?.last_row_id) {
    return createErrorResponse('Failed to create AOI', 500);
  }

  // Log activity
  try {
    await executeQueryRun(env, `
      INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_name, created_at)
      VALUES (?, ?, 'create', 'aoi', ?, ?, ?)
    `, [user.id, user.username, result.meta.last_row_id, aoiData.name, now], 'createAOIV3-log');
  } catch (e) {
    console.warn('Failed to log AOI creation:', e);
  }

  return createSuccessResponse({
    success: true,
    message: 'AOI created successfully',
    id: result.meta.last_row_id,
    name: aoiData.name,
    normalized_name: normalizedName
  }, 201);
}

/**
 * Update AOI
 */
async function updateAOIV3(id, user, request, env) {
  const permission = checkUserPermissions(user, 'aois', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const aoiData = await request.json();

  // Check exists and access
  const existing = await executeQueryFirst(env, `
    SELECT a.id, a.name, s.normalized_name as station_normalized_name
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    WHERE a.id = ?
  `, [id], 'updateAOIV3-check');

  if (!existing) {
    return createNotFoundResponse();
  }

  if (user.role === 'station' && user.station_normalized_name !== existing.station_normalized_name) {
    return createForbiddenResponse();
  }

  const allowedFields = [];
  const values = [];

  const editableFields = [
    'name', 'normalized_name', 'description',
    'geometry_type', 'geometry_json', 'bbox_json',
    'centroid_lat', 'centroid_lon', 'area_m2', 'perimeter_m',
    'ecosystem_code', 'purpose', 'aoi_type', 'status',
    'source', 'source_file', 'source_crs'
  ];

  editableFields.forEach(field => {
    if (aoiData[field] !== undefined) {
      let value = aoiData[field];
      if ((field === 'geometry_json' || field === 'bbox_json') && typeof value !== 'string') {
        value = JSON.stringify(value);
      }
      allowedFields.push(`${field} = ?`);
      values.push(value);
    }
  });

  if (allowedFields.length === 0) {
    return createErrorResponse('No valid fields to update', 400);
  }

  allowedFields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const updateQuery = `UPDATE areas_of_interest SET ${allowedFields.join(', ')} WHERE id = ?`;
  const result = await executeQueryRun(env, updateQuery, values, 'updateAOIV3');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update AOI', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'AOI updated successfully',
    id: parseInt(id, 10)
  });
}

/**
 * Delete AOI
 */
async function deleteAOIV3(id, user, env) {
  const permission = checkUserPermissions(user, 'aois', 'delete');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // Check exists and access
  const existing = await executeQueryFirst(env, `
    SELECT a.id, a.name, s.normalized_name as station_normalized_name
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    WHERE a.id = ?
  `, [id], 'deleteAOIV3-check');

  if (!existing) {
    return createNotFoundResponse();
  }

  if (user.role === 'station' && user.station_normalized_name !== existing.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Check for campaigns
  const campaignCheck = await executeQueryFirst(env,
    'SELECT COUNT(*) as count FROM acquisition_campaigns WHERE aoi_id = ?',
    [id], 'deleteAOIV3-campaignCheck'
  );

  if (campaignCheck && campaignCheck.count > 0) {
    return createErrorResponse(
      `Cannot delete AOI: ${campaignCheck.count} campaign(s) reference this AOI`,
      409
    );
  }

  const result = await executeQueryRun(env, 'DELETE FROM areas_of_interest WHERE id = ?', [id], 'deleteAOIV3');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to delete AOI', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'AOI deleted successfully',
    id: parseInt(id, 10)
  });
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Convert AOI record to GeoJSON Feature
 */
function aoiToGeoJSONFeature(aoi) {
  let geometry = null;
  try {
    geometry = typeof aoi.geometry_json === 'string'
      ? JSON.parse(aoi.geometry_json)
      : aoi.geometry_json || aoi.geometry;
  } catch (e) {
    return null;
  }

  if (!geometry) return null;

  return {
    type: 'Feature',
    id: aoi.id,
    geometry: geometry,
    properties: {
      id: aoi.id,
      name: aoi.name,
      normalized_name: aoi.normalized_name,
      description: aoi.description,
      aoi_type: aoi.aoi_type,
      purpose: aoi.purpose,
      ecosystem_code: aoi.ecosystem_code,
      area_m2: aoi.area_m2,
      perimeter_m: aoi.perimeter_m,
      status: aoi.status,
      station_acronym: aoi.station_acronym,
      station_name: aoi.station_name,
      platform_name: aoi.platform_name,
      platform_type: aoi.platform_type
    }
  };
}

/**
 * Validate AOI data
 */
function validateAOIData(data) {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 3) {
    errors.push('Name is required and must be at least 3 characters');
  }

  if (!data.station_id && !data.platform_id) {
    errors.push('Either station_id or platform_id is required');
  }

  if (!data.geometry_json) {
    errors.push('Geometry JSON is required');
  } else {
    try {
      const geom = typeof data.geometry_json === 'string'
        ? JSON.parse(data.geometry_json)
        : data.geometry_json;

      if (!geom.type || !geom.coordinates) {
        errors.push('Invalid GeoJSON geometry structure');
      }
    } catch (e) {
      errors.push('Invalid GeoJSON: ' + e.message);
    }
  }

  return errors;
}

/**
 * Get bounding box from GeoJSON geometry
 */
function getBoundingBox(geometry) {
  if (!geometry || !geometry.coordinates) return null;

  let coords = [];

  if (geometry.type === 'Point') {
    return [geometry.coordinates[0], geometry.coordinates[1], geometry.coordinates[0], geometry.coordinates[1]];
  } else if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(poly => coords.push(...poly[0]));
  }

  if (coords.length === 0) return null;

  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;

  coords.forEach(coord => {
    minLon = Math.min(minLon, coord[0]);
    minLat = Math.min(minLat, coord[1]);
    maxLon = Math.max(maxLon, coord[0]);
    maxLat = Math.max(maxLat, coord[1]);
  });

  return [minLon, minLat, maxLon, maxLat];
}

/**
 * Get centroid from GeoJSON geometry
 */
function getCentroid(geometry) {
  const bbox = getBoundingBox(geometry);
  if (!bbox) return null;
  return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
}

/**
 * Check if point is in polygon (ray casting)
 */
function pointInPolygon(point, geometry) {
  let coords;

  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    // Check each polygon
    for (const poly of geometry.coordinates) {
      if (pointInRing(point, poly[0])) {
        return true;
      }
    }
    return false;
  } else {
    return false;
  }

  return pointInRing(point, coords);
}

/**
 * Ray casting algorithm
 */
function pointInRing(point, ring) {
  const x = point[0], y = point[1];
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Check if two bounding boxes intersect
 */
function bboxesIntersect(bbox1, bbox2) {
  if (!bbox1 || !bbox2) return false;
  return !(bbox1[2] < bbox2[0] || bbox1[0] > bbox2[2] || bbox1[3] < bbox2[1] || bbox1[1] > bbox2[3]);
}

/**
 * Haversine distance between two points in km
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
