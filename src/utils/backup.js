// Backup Utilities
// Deletion backup functionality for data recovery

/**
 * Generate comprehensive backup for resource deletion
 * @param {string} resourceType - Type of resource (station, platform, instrument, roi)
 * @param {number} resourceId - ID of the resource to backup
 * @param {Object} env - Environment variables and bindings
 * @param {Object} user - User performing the deletion
 * @returns {Object} Comprehensive backup data
 */
export async function generateComprehensiveBackup(resourceType, resourceId, env, user) {
  const backup = {
    backup_metadata: {
      timestamp: new Date().toISOString(),
      backup_type: `${resourceType}_deletion`,
      resource_id: resourceId,
      created_by: user.username,
      sites_spectral_version: '5.0.0'
    }
  };

  try {
    switch (resourceType) {
      case 'station':
        await generateStationBackup(backup, resourceId, env);
        break;
      case 'platform':
        await generatePlatformBackup(backup, resourceId, env);
        break;
      case 'instrument':
        await generateInstrumentBackup(backup, resourceId, env);
        break;
      case 'roi':
        await generateROIBackup(backup, resourceId, env);
        break;
      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }

    return backup;
  } catch (error) {
    console.error('Backup generation failed:', error);
    throw new Error(`Failed to generate backup for ${resourceType} ${resourceId}: ${error.message}`);
  }
}

/**
 * Generate complete station hierarchy backup
 * @param {Object} backup - Backup object to populate
 * @param {number} stationId - Station ID
 * @param {Object} env - Environment variables and bindings
 */
async function generateStationBackup(backup, stationId, env) {
  // Get complete station hierarchy
  const stationQuery = `SELECT * FROM stations WHERE id = ?`;
  const platformsQuery = `SELECT * FROM platforms WHERE station_id = ?`;
  const instrumentsQuery = `
    SELECT i.* FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    WHERE p.station_id = ?
  `;
  const roisQuery = `
    SELECT r.* FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    WHERE p.station_id = ?
  `;

  const [station, platforms, instruments, rois] = await Promise.all([
    env.DB.prepare(stationQuery).bind(stationId).first(),
    env.DB.prepare(platformsQuery).bind(stationId).all(),
    env.DB.prepare(instrumentsQuery).bind(stationId).all(),
    env.DB.prepare(roisQuery).bind(stationId).all()
  ]);

  backup.station = station;
  backup.platforms = platforms?.results || [];
  backup.instruments = instruments?.results || [];
  backup.rois = rois?.results || [];
}

/**
 * Generate platform backup with dependent instruments and ROIs
 * @param {Object} backup - Backup object to populate
 * @param {number} platformId - Platform ID
 * @param {Object} env - Environment variables and bindings
 */
async function generatePlatformBackup(backup, platformId, env) {
  const platformQuery = `SELECT * FROM platforms WHERE id = ?`;
  const instrumentsQuery = `SELECT * FROM instruments WHERE platform_id = ?`;
  const roisQuery = `
    SELECT r.* FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    WHERE i.platform_id = ?
  `;

  const [platform, instruments, rois] = await Promise.all([
    env.DB.prepare(platformQuery).bind(platformId).first(),
    env.DB.prepare(instrumentsQuery).bind(platformId).all(),
    env.DB.prepare(roisQuery).bind(platformId).all()
  ]);

  backup.platform = platform;
  backup.instruments = instruments?.results || [];
  backup.rois = rois?.results || [];
}

/**
 * Generate instrument backup with dependent ROIs
 * @param {Object} backup - Backup object to populate
 * @param {number} instrumentId - Instrument ID
 * @param {Object} env - Environment variables and bindings
 */
async function generateInstrumentBackup(backup, instrumentId, env) {
  const instrumentQuery = `SELECT * FROM instruments WHERE id = ?`;
  const roisQuery = `SELECT * FROM instrument_rois WHERE instrument_id = ?`;

  const [instrument, rois] = await Promise.all([
    env.DB.prepare(instrumentQuery).bind(instrumentId).first(),
    env.DB.prepare(roisQuery).bind(instrumentId).all()
  ]);

  backup.instrument = instrument;
  backup.rois = rois?.results || [];
}

/**
 * Generate ROI backup
 * @param {Object} backup - Backup object to populate
 * @param {number} roiId - ROI ID
 * @param {Object} env - Environment variables and bindings
 */
async function generateROIBackup(backup, roiId, env) {
  const roiQuery = `SELECT * FROM instrument_rois WHERE id = ?`;
  const roi = await env.DB.prepare(roiQuery).bind(roiId).first();

  backup.roi = roi;
}

/**
 * Analyze dependencies before deletion
 * @param {string} resourceType - Type of resource
 * @param {number} resourceId - ID of the resource
 * @param {Object} env - Environment variables and bindings
 * @returns {Object} Dependency analysis result
 */
export async function analyzeDependencies(resourceType, resourceId, env) {
  const dependencies = {
    hasDependendencies: false,
    summary: {},
    cascade_preview: []
  };

  try {
    switch (resourceType) {
      case 'station':
        await analyzeStationDependencies(dependencies, resourceId, env);
        break;
      case 'platform':
        await analyzePlatformDependencies(dependencies, resourceId, env);
        break;
      case 'instrument':
        await analyzeInstrumentDependencies(dependencies, resourceId, env);
        break;
      case 'roi':
        // ROIs typically have no dependencies
        dependencies.summary.rois = 0;
        break;
      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }

    return dependencies;
  } catch (error) {
    console.error('Dependency analysis failed:', error);
    throw new Error(`Failed to analyze dependencies for ${resourceType} ${resourceId}: ${error.message}`);
  }
}

/**
 * Analyze station dependencies
 * @param {Object} dependencies - Dependencies object to populate
 * @param {number} stationId - Station ID
 * @param {Object} env - Environment variables and bindings
 */
async function analyzeStationDependencies(dependencies, stationId, env) {
  const platformCount = await env.DB.prepare('SELECT COUNT(*) as count FROM platforms WHERE station_id = ?').bind(stationId).first();
  const instrumentCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    WHERE p.station_id = ?
  `).bind(stationId).first();
  const roiCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    WHERE p.station_id = ?
  `).bind(stationId).first();

  dependencies.summary.platforms = platformCount?.count || 0;
  dependencies.summary.instruments = instrumentCount?.count || 0;
  dependencies.summary.rois = roiCount?.count || 0;
  dependencies.hasDependendencies = dependencies.summary.platforms > 0;

  if (dependencies.hasDependendencies) {
    dependencies.cascade_preview = [
      `${dependencies.summary.platforms} platform(s) will be deleted`,
      `${dependencies.summary.instruments} instrument(s) will be deleted`,
      `${dependencies.summary.rois} ROI(s) will be deleted`
    ];
  }
}

/**
 * Analyze platform dependencies
 * @param {Object} dependencies - Dependencies object to populate
 * @param {number} platformId - Platform ID
 * @param {Object} env - Environment variables and bindings
 */
async function analyzePlatformDependencies(dependencies, platformId, env) {
  const instrumentCount = await env.DB.prepare('SELECT COUNT(*) as count FROM instruments WHERE platform_id = ?').bind(platformId).first();
  const roiCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    WHERE i.platform_id = ?
  `).bind(platformId).first();

  dependencies.summary.instruments = instrumentCount?.count || 0;
  dependencies.summary.rois = roiCount?.count || 0;
  dependencies.hasDependendencies = dependencies.summary.instruments > 0;

  if (dependencies.hasDependendencies) {
    dependencies.cascade_preview = [
      `${dependencies.summary.instruments} instrument(s) will be deleted`,
      `${dependencies.summary.rois} ROI(s) will be deleted`
    ];
  }
}

/**
 * Analyze instrument dependencies
 * @param {Object} dependencies - Dependencies object to populate
 * @param {number} instrumentId - Instrument ID
 * @param {Object} env - Environment variables and bindings
 */
async function analyzeInstrumentDependencies(dependencies, instrumentId, env) {
  const roiCount = await env.DB.prepare('SELECT COUNT(*) as count FROM instrument_rois WHERE instrument_id = ?').bind(instrumentId).first();

  dependencies.summary.rois = roiCount?.count || 0;
  dependencies.hasDependendencies = dependencies.summary.rois > 0;

  if (dependencies.hasDependendencies) {
    dependencies.cascade_preview = [
      `${dependencies.summary.rois} ROI(s) will be deleted`
    ];
  }
}