// SITES Spectral V3 Products Handler
// Product catalog with spatial filtering
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

// Valid product types
const PRODUCT_TYPES = [
  'ndvi', 'ndre', 'ndwi', 'evi', 'savi', 'gcc', 'rcc', 'bcc', 'grvi', 'vari',
  'chlorophyll', 'lai', 'fcover', 'fapar',
  'orthomosaic', 'dsm', 'dtm', 'dem', 'chm',
  'point_cloud', 'las', 'laz',
  'thermal', 'lst',
  'true_color', 'false_color', 'cir',
  'classification', 'segmentation', 'change_detection',
  'time_series', 'composite', 'mosaic',
  'raw', 'calibrated', 'corrected'
];

const QUALITY_FLAGS = ['good', 'moderate', 'poor', 'cloud_affected', 'shadow_affected', 'incomplete'];
const PROCESSING_LEVELS = ['raw', 'L0', 'L1', 'L2', 'L3', 'L4'];

/**
 * Handle V3 product requests
 * @param {string} method - HTTP method
 * @param {Object} params - Route parameters { id, productType, spatialQuery, stationId, platformId, campaignId, date }
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {URL} url - Parsed URL object
 * @returns {Response} Product response
 */
export async function handleProductsV3(method, params, request, env, url) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user;
  }

  try {
    // Handle special endpoints
    if (params.listTypes) {
      return await getProductTypesV3(user, env);
    }

    if (params.stats) {
      return await getProductStatsV3(user, request, env, url);
    }

    if (params.timeline) {
      return await getProductsTimelineV3(user, request, env, url);
    }

    if (params.archive && params.id) {
      return await archiveProductV3(params.id, user, request, env);
    }

    // Handle spatial queries
    if (params.spatialQuery) {
      return await handleProductSpatialQuery(params.spatialQuery, user, request, env, url);
    }

    // Handle filtered queries
    if (params.productType) {
      return await getProductsByTypeV3(params.productType, user, request, env, url);
    }

    if (params.stationId) {
      return await getProductsByStationV3(params.stationId, user, request, env, url);
    }

    if (params.platformId) {
      return await getProductsByPlatformV3(params.platformId, user, request, env, url);
    }

    if (params.campaignId) {
      return await getProductsByCampaignV3(params.campaignId, user, request, env, url);
    }

    if (params.date) {
      return await getProductsByDateV3(params.date, user, request, env, url);
    }

    // Standard CRUD operations
    switch (method) {
      case 'GET':
        if (params.id) {
          return await getProductByIdV3(params.id, user, env);
        } else {
          return await getProductsListV3(user, request, env, url);
        }

      case 'POST':
        return await createProductV3(user, request, env);

      case 'PUT':
        if (!params.id) {
          return createErrorResponse('Product ID required for update', 400);
        }
        return await updateProductV3(params.id, user, request, env);

      case 'DELETE':
        if (!params.id) {
          return createErrorResponse('Product ID required for deletion', 400);
        }
        return await deleteProductV3(params.id, user, env);

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('Product V3 handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Handle spatial queries for products
 */
async function handleProductSpatialQuery(queryType, user, request, env, url) {
  switch (queryType) {
    case 'bbox':
      return await queryProductsByBBox(user, request, env, url);

    case 'point':
      return await queryProductsByPoint(user, request, env, url);

    case 'coverage':
      return await getProductCoverageStats(user, request, env, url);

    default:
      return createErrorResponse(`Unknown spatial query type: ${queryType}. Supported: bbox, point, coverage`, 400);
  }
}

/**
 * Query products within a bounding box
 */
async function queryProductsByBBox(user, request, env, url) {
  const minLon = parseFloat(url.searchParams.get('minLon') || url.searchParams.get('west'));
  const minLat = parseFloat(url.searchParams.get('minLat') || url.searchParams.get('south'));
  const maxLon = parseFloat(url.searchParams.get('maxLon') || url.searchParams.get('east'));
  const maxLat = parseFloat(url.searchParams.get('maxLat') || url.searchParams.get('north'));

  if (isNaN(minLon) || isNaN(minLat) || isNaN(maxLon) || isNaN(maxLat)) {
    return createErrorResponse('Bounding box parameters required: minLon, minLat, maxLon, maxLat', 400);
  }

  const productType = url.searchParams.get('type');
  const fromDate = url.searchParams.get('from_date');
  const toDate = url.searchParams.get('to_date');
  const pagination = parsePaginationParams(url);

  let whereConditions = [
    'p.center_lon >= ? AND p.center_lon <= ?',
    'p.center_lat >= ? AND p.center_lat <= ?',
    "p.status = 'available'"
  ];
  let params = [minLon, maxLon, minLat, maxLat];

  if (productType) {
    whereConditions.push('p.product_type = ?');
    params.push(productType);
  }

  if (fromDate) {
    whereConditions.push('p.source_date >= ?');
    params.push(fromDate);
  }

  if (toDate) {
    whereConditions.push('p.source_date <= ?');
    params.push(toDate);
  }

  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  const whereClause = 'WHERE ' + whereConditions.join(' AND ');

  // Get count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM products p
    JOIN stations s ON p.station_id = s.id
    ${whereClause}
  `;
  const countResult = await executeQueryFirst(env, countQuery, params, 'queryProductsByBBoxCount');
  const totalCount = countResult?.total || 0;

  // Get products
  const query = `
    SELECT p.id, p.product_type, p.product_name, p.source_date,
           p.source_platform_type, p.resolution_m,
           p.center_lat, p.center_lon, p.bbox_json,
           p.quality_flag, p.cloud_cover_pct,
           p.processing_level, p.file_format,
           s.acronym as station_acronym,
           pl.display_name as platform_name, pl.platform_type
    FROM products p
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN platforms pl ON p.platform_id = pl.id
    ${whereClause}
    ORDER BY p.source_date DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, pagination.limit, pagination.offset];
  const result = await executeQuery(env, query, queryParams, 'queryProductsByBBox');
  const products = result?.results || [];

  const baseUrl = url.origin + url.pathname;
  const response = createPaginatedResponse(products, totalCount, pagination, baseUrl);
  response.meta.query = 'bbox';
  response.meta.bounds = { minLon, minLat, maxLon, maxLat };

  return createSuccessResponse(response);
}

/**
 * Query products at a specific point
 */
async function queryProductsByPoint(user, request, env, url) {
  const lon = parseFloat(url.searchParams.get('lon'));
  const lat = parseFloat(url.searchParams.get('lat'));
  const radius = parseFloat(url.searchParams.get('radius') || '0.1'); // Default 0.1 degrees (~11km)

  if (isNaN(lon) || isNaN(lat)) {
    return createErrorResponse('Point coordinates required: lon, lat', 400);
  }

  const productType = url.searchParams.get('type');
  const pagination = parsePaginationParams(url);

  // Search within radius
  let whereConditions = [
    'p.center_lon >= ? AND p.center_lon <= ?',
    'p.center_lat >= ? AND p.center_lat <= ?',
    "p.status = 'available'"
  ];
  let params = [lon - radius, lon + radius, lat - radius, lat + radius];

  if (productType) {
    whereConditions.push('p.product_type = ?');
    params.push(productType);
  }

  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  const whereClause = 'WHERE ' + whereConditions.join(' AND ');

  const query = `
    SELECT p.id, p.product_type, p.product_name, p.source_date,
           p.source_platform_type, p.resolution_m,
           p.center_lat, p.center_lon, p.bbox_json,
           p.quality_flag, p.processing_level,
           s.acronym as station_acronym,
           pl.display_name as platform_name,
           ((p.center_lon - ?) * (p.center_lon - ?) +
            (p.center_lat - ?) * (p.center_lat - ?)) as distance_sq
    FROM products p
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN platforms pl ON p.platform_id = pl.id
    ${whereClause}
    ORDER BY distance_sq ASC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [lon, lon, lat, lat, ...params, pagination.limit, pagination.offset];
  const result = await executeQuery(env, query, queryParams, 'queryProductsByPoint');
  const products = result?.results || [];

  return createSuccessResponse({
    data: products,
    meta: {
      query: 'point',
      point: { lon, lat },
      radius,
      count: products.length
    }
  });
}

/**
 * Get product coverage statistics
 */
async function getProductCoverageStats(user, request, env, url) {
  const stationParam = url.searchParams.get('station');
  const productType = url.searchParams.get('type');
  const year = url.searchParams.get('year');

  let whereConditions = ["p.status = 'available'"];
  let params = [];

  if (stationParam) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ?)');
    params.push(stationParam, stationParam);
  }

  if (productType) {
    whereConditions.push('p.product_type = ?');
    params.push(productType);
  }

  if (year) {
    whereConditions.push("strftime('%Y', p.source_date) = ?");
    params.push(year);
  }

  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  const whereClause = 'WHERE ' + whereConditions.join(' AND ');

  // Get coverage statistics
  const statsQuery = `
    SELECT
      COUNT(*) as total_products,
      COUNT(DISTINCT p.product_type) as unique_types,
      COUNT(DISTINCT p.source_date) as unique_dates,
      COUNT(DISTINCT p.station_id) as unique_stations,
      MIN(p.source_date) as earliest_date,
      MAX(p.source_date) as latest_date,
      AVG(p.resolution_m) as avg_resolution,
      SUM(p.file_size_bytes) as total_size_bytes
    FROM products p
    JOIN stations s ON p.station_id = s.id
    ${whereClause}
  `;

  const stats = await executeQueryFirst(env, statsQuery, params, 'getProductCoverageStats');

  // Get type breakdown
  const typeQuery = `
    SELECT p.product_type, COUNT(*) as count, AVG(p.resolution_m) as avg_resolution
    FROM products p
    JOIN stations s ON p.station_id = s.id
    ${whereClause}
    GROUP BY p.product_type
    ORDER BY count DESC
  `;

  const typeResult = await executeQuery(env, typeQuery, params, 'getProductTypeBreakdown');

  // Get platform type breakdown
  const platformQuery = `
    SELECT p.source_platform_type, COUNT(*) as count
    FROM products p
    JOIN stations s ON p.station_id = s.id
    ${whereClause}
    GROUP BY p.source_platform_type
  `;

  const platformResult = await executeQuery(env, platformQuery, params, 'getProductPlatformBreakdown');

  return createSuccessResponse({
    statistics: {
      total_products: stats?.total_products || 0,
      unique_types: stats?.unique_types || 0,
      unique_dates: stats?.unique_dates || 0,
      unique_stations: stats?.unique_stations || 0,
      date_range: {
        earliest: stats?.earliest_date,
        latest: stats?.latest_date
      },
      avg_resolution_m: stats?.avg_resolution ? Math.round(stats.avg_resolution * 100) / 100 : null,
      total_size_gb: stats?.total_size_bytes ? Math.round(stats.total_size_bytes / 1073741824 * 100) / 100 : 0
    },
    by_type: typeResult?.results || [],
    by_platform_type: platformResult?.results || [],
    filters: {
      station: stationParam,
      type: productType,
      year
    }
  });
}

/**
 * Get product by ID
 */
async function getProductByIdV3(id, user, env) {
  let query = `
    SELECT p.id, p.station_id, p.platform_id, p.campaign_id, p.aoi_id,
           p.product_type, p.product_name, p.description,
           p.source_platform_type, p.source_date, p.source_datetime,
           p.bbox_json, p.center_lat, p.center_lon, p.resolution_m, p.crs,
           p.file_path, p.file_format, p.file_size_bytes,
           p.min_value, p.max_value, p.mean_value, p.std_value, p.nodata_percent,
           p.quality_flag, p.cloud_cover_pct,
           p.processing_level, p.algorithm_version,
           p.status, p.metadata_json,
           p.created_at,
           s.acronym as station_acronym, s.display_name as station_name,
           s.normalized_name as station_normalized_name,
           pl.display_name as platform_name, pl.platform_type,
           c.campaign_name,
           a.name as aoi_name
    FROM products p
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN platforms pl ON p.platform_id = pl.id
    LEFT JOIN acquisition_campaigns c ON p.campaign_id = c.id
    LEFT JOIN areas_of_interest a ON p.aoi_id = a.id
    WHERE p.id = ?
  `;

  const params = [id];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const product = await executeQueryFirst(env, query, params, 'getProductByIdV3');

  if (!product) {
    return createNotFoundResponse();
  }

  // Parse JSON fields
  if (product.bbox_json) {
    try {
      product.bbox = JSON.parse(product.bbox_json);
    } catch (e) {
      product.bbox = null;
    }
  }

  if (product.metadata_json) {
    try {
      product.metadata = JSON.parse(product.metadata_json);
    } catch (e) {
      product.metadata = {};
    }
  }

  // Add file size in human readable format
  if (product.file_size_bytes) {
    product.file_size_mb = Math.round(product.file_size_bytes / 1048576 * 100) / 100;
  }

  return createSuccessResponse(product);
}

/**
 * Get products list with pagination
 */
async function getProductsListV3(user, request, env, url) {
  const pagination = parsePaginationParams(url);
  const { sortBy, sortOrder } = parseSortParams(url, ['created_at', 'product_name', 'source_date', 'product_type']);

  // Filter parameters
  const stationParam = url.searchParams.get('station');
  const platformParam = url.searchParams.get('platform');
  const typeParam = url.searchParams.get('type');
  const qualityParam = url.searchParams.get('quality');
  const levelParam = url.searchParams.get('level');
  const fromDate = url.searchParams.get('from_date');
  const toDate = url.searchParams.get('to_date');
  const statusParam = url.searchParams.get('status') || 'available';

  let whereConditions = [];
  let params = [];

  if (stationParam) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ? OR s.id = ?)');
    params.push(stationParam, stationParam, stationParam);
  }

  if (platformParam) {
    whereConditions.push('(pl.id = ? OR pl.normalized_name = ?)');
    params.push(platformParam, platformParam);
  }

  if (typeParam) {
    whereConditions.push('p.product_type = ?');
    params.push(typeParam);
  }

  if (qualityParam) {
    whereConditions.push('p.quality_flag = ?');
    params.push(qualityParam);
  }

  if (levelParam) {
    whereConditions.push('p.processing_level = ?');
    params.push(levelParam);
  }

  if (fromDate) {
    whereConditions.push('p.source_date >= ?');
    params.push(fromDate);
  }

  if (toDate) {
    whereConditions.push('p.source_date <= ?');
    params.push(toDate);
  }

  if (statusParam && statusParam !== 'all') {
    whereConditions.push('p.status = ?');
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
    FROM products p
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN platforms pl ON p.platform_id = pl.id
    ${whereClause}
  `;
  const countResult = await executeQueryFirst(env, countQuery, params, 'getProductsListCount');
  const totalCount = countResult?.total || 0;

  // Main query
  const query = `
    SELECT p.id, p.product_type, p.product_name, p.source_date,
           p.source_platform_type, p.resolution_m,
           p.center_lat, p.center_lon, p.bbox_json,
           p.file_format, p.file_size_bytes,
           p.quality_flag, p.cloud_cover_pct,
           p.processing_level, p.status,
           p.created_at,
           s.acronym as station_acronym, s.display_name as station_name,
           pl.display_name as platform_name, pl.platform_type,
           c.campaign_name
    FROM products p
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN platforms pl ON p.platform_id = pl.id
    LEFT JOIN acquisition_campaigns c ON p.campaign_id = c.id
    ${whereClause}
    ORDER BY p.${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, pagination.limit, pagination.offset];
  const result = await executeQuery(env, query, queryParams, 'getProductsListV3');
  const products = result?.results || [];

  const baseUrl = url.origin + url.pathname;
  return createSuccessResponse(createPaginatedResponse(products, totalCount, pagination, baseUrl));
}

/**
 * Get products by type
 */
async function getProductsByTypeV3(productType, user, request, env, url) {
  if (!PRODUCT_TYPES.includes(productType.toLowerCase())) {
    return createErrorResponse(`Unknown product type: ${productType}`, 400);
  }

  url.searchParams.set('type', productType);
  return await getProductsListV3(user, request, env, url);
}

/**
 * Get products by station
 */
async function getProductsByStationV3(stationId, user, request, env, url) {
  url.searchParams.set('station', stationId);
  return await getProductsListV3(user, request, env, url);
}

/**
 * Get products by platform
 */
async function getProductsByPlatformV3(platformId, user, request, env, url) {
  url.searchParams.set('platform', platformId);
  return await getProductsListV3(user, request, env, url);
}

/**
 * Get products by campaign
 */
async function getProductsByCampaignV3(campaignId, user, request, env, url) {
  const pagination = parsePaginationParams(url);

  let query = `
    SELECT p.id, p.product_type, p.product_name, p.source_date,
           p.resolution_m, p.quality_flag, p.processing_level,
           p.file_format, p.file_size_bytes,
           s.acronym as station_acronym
    FROM products p
    JOIN stations s ON p.station_id = s.id
    WHERE p.campaign_id = ?
  `;

  const params = [campaignId];

  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  query += ' ORDER BY p.source_date DESC LIMIT ? OFFSET ?';
  params.push(pagination.limit, pagination.offset);

  const result = await executeQuery(env, query, params, 'getProductsByCampaignV3');

  // Get count
  const countResult = await executeQueryFirst(env, `
    SELECT COUNT(*) as total FROM products WHERE campaign_id = ?
  `, [campaignId], 'getProductsByCampaignCount');

  const baseUrl = url.origin + url.pathname;
  return createSuccessResponse(createPaginatedResponse(
    result?.results || [],
    countResult?.total || 0,
    pagination,
    baseUrl
  ));
}

/**
 * Get products by date
 */
async function getProductsByDateV3(date, user, request, env, url) {
  url.searchParams.set('from_date', date);
  url.searchParams.set('to_date', date);
  return await getProductsListV3(user, request, env, url);
}

/**
 * Create a new product record
 */
async function createProductV3(user, request, env) {
  const permission = checkUserPermissions(user, 'platforms', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const productData = await request.json();

  // Validate required fields
  const errors = [];

  if (!productData.product_name || productData.product_name.trim().length < 3) {
    errors.push('Product name is required and must be at least 3 characters');
  }

  if (!productData.product_type) {
    errors.push('Product type is required');
  } else if (!PRODUCT_TYPES.includes(productData.product_type.toLowerCase())) {
    errors.push(`Invalid product type. Common types: ${PRODUCT_TYPES.slice(0, 10).join(', ')}...`);
  }

  if (!productData.station_id) {
    errors.push('Station ID is required');
  }

  if (productData.quality_flag && !QUALITY_FLAGS.includes(productData.quality_flag)) {
    errors.push(`Invalid quality flag. Valid flags: ${QUALITY_FLAGS.join(', ')}`);
  }

  if (productData.processing_level && !PROCESSING_LEVELS.includes(productData.processing_level)) {
    errors.push(`Invalid processing level. Valid levels: ${PROCESSING_LEVELS.join(', ')}`);
  }

  if (errors.length > 0) {
    return createValidationErrorResponse(errors);
  }

  // Verify station access
  const station = await executeQueryFirst(env,
    'SELECT id, normalized_name FROM stations WHERE id = ?',
    [productData.station_id], 'createProductV3-stationCheck'
  );

  if (!station) {
    return createErrorResponse('Station not found', 404);
  }

  if (user.role === 'station' && user.station_normalized_name !== station.normalized_name) {
    return createForbiddenResponse();
  }

  // Verify platform if provided
  if (productData.platform_id) {
    const platform = await executeQueryFirst(env,
      'SELECT id, station_id FROM platforms WHERE id = ?',
      [productData.platform_id], 'createProductV3-platformCheck'
    );

    if (!platform || platform.station_id !== productData.station_id) {
      return createErrorResponse('Platform not found or does not belong to station', 404);
    }
  }

  // Handle JSON fields
  const bboxJson = productData.bbox
    ? (typeof productData.bbox === 'string' ? productData.bbox : JSON.stringify(productData.bbox))
    : productData.bbox_json || null;

  const metadataJson = productData.metadata
    ? (typeof productData.metadata === 'string' ? productData.metadata : JSON.stringify(productData.metadata))
    : productData.metadata_json || null;

  const now = new Date().toISOString();

  const insertQuery = `
    INSERT INTO products (
      station_id, platform_id, campaign_id, aoi_id,
      product_type, product_name, description,
      source_platform_type, source_date, source_datetime,
      bbox_json, center_lat, center_lon, resolution_m, crs,
      file_path, file_format, file_size_bytes,
      min_value, max_value, mean_value, std_value, nodata_percent,
      quality_flag, cloud_cover_pct,
      processing_level, algorithm_version,
      status, metadata_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await executeQueryRun(env, insertQuery, [
    productData.station_id,
    productData.platform_id || null,
    productData.campaign_id || null,
    productData.aoi_id || null,
    productData.product_type.toLowerCase(),
    productData.product_name.trim(),
    productData.description || null,
    productData.source_platform_type || null,
    productData.source_date || null,
    productData.source_datetime || null,
    bboxJson,
    productData.center_lat || null,
    productData.center_lon || null,
    productData.resolution_m || null,
    productData.crs || 'EPSG:4326',
    productData.file_path || null,
    productData.file_format || null,
    productData.file_size_bytes || null,
    productData.min_value || null,
    productData.max_value || null,
    productData.mean_value || null,
    productData.std_value || null,
    productData.nodata_percent || null,
    productData.quality_flag || 'good',
    productData.cloud_cover_pct || null,
    productData.processing_level || 'L2',
    productData.algorithm_version || null,
    productData.status || 'available',
    metadataJson,
    now
  ], 'createProductV3');

  if (!result || !result.meta?.last_row_id) {
    return createErrorResponse('Failed to create product', 500);
  }

  // Log activity
  try {
    await executeQueryRun(env, `
      INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_name, created_at)
      VALUES (?, ?, 'create', 'product', ?, ?, ?)
    `, [user.id, user.username, result.meta.last_row_id, productData.product_name, now], 'createProductV3-log');
  } catch (e) {
    console.warn('Failed to log product creation:', e);
  }

  return createSuccessResponse({
    success: true,
    message: 'Product created successfully',
    id: result.meta.last_row_id,
    product_name: productData.product_name,
    product_type: productData.product_type
  }, 201);
}

/**
 * Update product
 */
async function updateProductV3(id, user, request, env) {
  const permission = checkUserPermissions(user, 'platforms', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const productData = await request.json();

  // Verify product exists
  const existing = await executeQueryFirst(env, `
    SELECT p.id, p.product_name, s.normalized_name as station_normalized_name
    FROM products p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `, [id], 'updateProductV3-check');

  if (!existing) {
    return createNotFoundResponse();
  }

  if (user.role === 'station' && user.station_normalized_name !== existing.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Build update query
  const allowedFields = [];
  const values = [];

  const editableFields = [
    'product_name', 'description',
    'source_date', 'source_datetime',
    'bbox_json', 'center_lat', 'center_lon', 'resolution_m', 'crs',
    'file_path', 'file_format', 'file_size_bytes',
    'min_value', 'max_value', 'mean_value', 'std_value', 'nodata_percent',
    'quality_flag', 'cloud_cover_pct',
    'processing_level', 'algorithm_version',
    'status', 'metadata_json'
  ];

  editableFields.forEach(field => {
    if (productData[field] !== undefined) {
      let value = productData[field];

      if ((field === 'bbox_json' || field === 'metadata_json') && typeof value !== 'string' && value !== null) {
        value = JSON.stringify(value);
      }

      // Handle bbox shortcut
      if (field === 'bbox_json' && productData.bbox && !productData.bbox_json) {
        value = typeof productData.bbox === 'string' ? productData.bbox : JSON.stringify(productData.bbox);
      }

      // Handle metadata shortcut
      if (field === 'metadata_json' && productData.metadata && !productData.metadata_json) {
        value = typeof productData.metadata === 'string' ? productData.metadata : JSON.stringify(productData.metadata);
      }

      allowedFields.push(`${field} = ?`);
      values.push(value);
    }
  });

  if (allowedFields.length === 0) {
    return createErrorResponse('No valid fields to update', 400);
  }

  values.push(id);

  const updateQuery = `UPDATE products SET ${allowedFields.join(', ')} WHERE id = ?`;
  const result = await executeQueryRun(env, updateQuery, values, 'updateProductV3');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update product', 500);
  }

  // Fetch and return the updated product
  const updated = await executeQueryFirst(env, `
    SELECT p.id, p.station_id, p.platform_id, p.campaign_id, p.aoi_id,
           p.product_type, p.product_name, p.description,
           p.source_platform_type, p.source_date, p.source_datetime,
           p.bbox_json, p.center_lat, p.center_lon, p.resolution_m, p.crs,
           p.file_path, p.file_format, p.file_size_bytes,
           p.min_value, p.max_value, p.mean_value, p.std_value, p.nodata_percent,
           p.quality_flag, p.cloud_cover_pct,
           p.processing_level, p.algorithm_version,
           p.status, p.metadata_json,
           p.created_at,
           s.acronym as station_acronym, s.display_name as station_name
    FROM products p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `, [id], 'updateProductV3-fetch');

  return createSuccessResponse(updated || {
    success: true,
    message: 'Product updated successfully',
    id: parseInt(id, 10)
  });
}

/**
 * Delete product
 */
async function deleteProductV3(id, user, env) {
  const permission = checkUserPermissions(user, 'platforms', 'delete');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // Verify product exists
  const existing = await executeQueryFirst(env, `
    SELECT p.id, p.product_name, s.normalized_name as station_normalized_name
    FROM products p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `, [id], 'deleteProductV3-check');

  if (!existing) {
    return createNotFoundResponse();
  }

  if (user.role === 'station' && user.station_normalized_name !== existing.station_normalized_name) {
    return createForbiddenResponse();
  }

  const result = await executeQueryRun(env, 'DELETE FROM products WHERE id = ?', [id], 'deleteProductV3');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to delete product', 500);
  }

  // Log activity
  try {
    await executeQueryRun(env, `
      INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_name, created_at)
      VALUES (?, ?, 'delete', 'product', ?, ?, ?)
    `, [user.id, user.username, id, existing.product_name, new Date().toISOString()], 'deleteProductV3-log');
  } catch (e) {
    console.warn('Failed to log product deletion:', e);
  }

  return createSuccessResponse({
    success: true,
    message: 'Product deleted successfully',
    id: parseInt(id, 10)
  });
}

/**
 * Get list of available product types
 */
async function getProductTypesV3(user, env) {
  const query = `
    SELECT DISTINCT product_type, COUNT(*) as count
    FROM products
    WHERE status = 'available'
    GROUP BY product_type
    ORDER BY count DESC
  `;

  const result = await executeQuery(env, query, [], 'getProductTypesV3');
  const usedTypes = result?.results || [];

  // Return both the complete list and types with products
  return createSuccessResponse(
    PRODUCT_TYPES.map(type => {
      const used = usedTypes.find(u => u.product_type === type);
      return {
        type,
        count: used?.count || 0,
        hasProducts: !!used
      };
    })
  );
}

/**
 * Get product statistics
 */
async function getProductStatsV3(user, request, env, url) {
  const stationParam = url.searchParams.get('station');

  let whereConditions = [];
  let params = [];

  if (stationParam) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ?)');
    params.push(stationParam, stationParam);
  }

  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // Total products
  const totalQuery = `
    SELECT COUNT(*) as total_products
    FROM products p
    JOIN stations s ON p.station_id = s.id
    ${whereClause}
  `;
  const totalResult = await executeQueryFirst(env, totalQuery, params, 'getProductStatsV3-total');

  // By type
  const typeQuery = `
    SELECT product_type, COUNT(*) as count
    FROM products p
    JOIN stations s ON p.station_id = s.id
    ${whereClause}
    GROUP BY product_type
    ORDER BY count DESC
  `;
  const typeResult = await executeQuery(env, typeQuery, params, 'getProductStatsV3-byType');

  // By platform type
  const platformQuery = `
    SELECT source_platform_type, COUNT(*) as count
    FROM products p
    JOIN stations s ON p.station_id = s.id
    ${whereClause}
    GROUP BY source_platform_type
    ORDER BY count DESC
  `;
  const platformResult = await executeQuery(env, platformQuery, params, 'getProductStatsV3-byPlatform');

  // By quality flag
  const qualityQuery = `
    SELECT quality_flag, COUNT(*) as count
    FROM products p
    JOIN stations s ON p.station_id = s.id
    ${whereClause}
    GROUP BY quality_flag
    ORDER BY count DESC
  `;
  const qualityResult = await executeQuery(env, qualityQuery, params, 'getProductStatsV3-byQuality');

  // By processing level
  const levelQuery = `
    SELECT processing_level, COUNT(*) as count
    FROM products p
    JOIN stations s ON p.station_id = s.id
    ${whereClause}
    GROUP BY processing_level
    ORDER BY count DESC
  `;
  const levelResult = await executeQuery(env, levelQuery, params, 'getProductStatsV3-byLevel');

  return createSuccessResponse({
    total_products: totalResult?.total_products || 0,
    by_type: typeResult?.results || [],
    by_platform_type: platformResult?.results || [],
    by_quality: qualityResult?.results || [],
    by_processing_level: levelResult?.results || [],
    filters: {
      station: stationParam
    }
  });
}

/**
 * Get products in timeline format
 */
async function getProductsTimelineV3(user, request, env, url) {
  const stationParam = url.searchParams.get('station');
  const typeParam = url.searchParams.get('type');
  const year = url.searchParams.get('year') || new Date().getFullYear().toString();

  let whereConditions = [`strftime('%Y', p.source_date) = ?`];
  let params = [year];

  if (stationParam) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ?)');
    params.push(stationParam, stationParam);
  }

  if (typeParam) {
    whereConditions.push('p.product_type = ?');
    params.push(typeParam);
  }

  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  const whereClause = 'WHERE ' + whereConditions.join(' AND ');

  // Get products grouped by month
  const monthlyQuery = `
    SELECT
      strftime('%Y-%m', p.source_date) as month,
      COUNT(*) as count,
      GROUP_CONCAT(DISTINCT p.product_type) as types
    FROM products p
    JOIN stations s ON p.station_id = s.id
    ${whereClause}
    GROUP BY month
    ORDER BY month
  `;

  const monthlyResult = await executeQuery(env, monthlyQuery, params, 'getProductsTimelineV3-monthly');

  // Get recent products list
  const recentQuery = `
    SELECT p.id, p.product_type, p.product_name, p.source_date,
           p.quality_flag, s.acronym as station_acronym
    FROM products p
    JOIN stations s ON p.station_id = s.id
    ${whereClause}
    ORDER BY p.source_date DESC
    LIMIT 20
  `;

  const recentResult = await executeQuery(env, recentQuery, params, 'getProductsTimelineV3-recent');

  return createSuccessResponse({
    year: parseInt(year, 10),
    timeline: monthlyResult?.results || [],
    recent_products: recentResult?.results || [],
    filters: {
      station: stationParam,
      type: typeParam
    }
  });
}

/**
 * Archive a product
 */
async function archiveProductV3(id, user, request, env) {
  const permission = checkUserPermissions(user, 'platforms', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // Verify product exists
  const existing = await executeQueryFirst(env, `
    SELECT p.id, p.product_name, p.status, s.normalized_name as station_normalized_name
    FROM products p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `, [id], 'archiveProductV3-check');

  if (!existing) {
    return createNotFoundResponse();
  }

  if (user.role === 'station' && user.station_normalized_name !== existing.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Update status to archived
  const result = await executeQueryRun(env,
    `UPDATE products SET status = 'archived' WHERE id = ?`,
    [id], 'archiveProductV3');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to archive product', 500);
  }

  // Log activity
  try {
    await executeQueryRun(env, `
      INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_name, created_at)
      VALUES (?, ?, 'archive', 'product', ?, ?, ?)
    `, [user.id, user.username, id, existing.product_name, new Date().toISOString()], 'archiveProductV3-log');
  } catch (e) {
    console.warn('Failed to log product archive:', e);
  }

  return createSuccessResponse({
    success: true,
    message: 'Product archived successfully',
    id: parseInt(id, 10),
    status: 'archived'
  });
}
