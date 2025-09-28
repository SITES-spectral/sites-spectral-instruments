// Camera Specifications Validation Utility
// Validates camera fields against lookup table and scientific standards

import { executeQuery, executeQueryFirst } from './database.js';

/**
 * Validate camera specifications against database lookup table
 * @param {Object} cameraData - Camera specification data
 * @param {Object} env - Environment variables and bindings
 * @returns {Object} Validation result with errors and warnings
 */
export async function validateCameraSpecifications(cameraData, env) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // Skip validation if no camera data provided
  if (!cameraData || (!cameraData.camera_brand && !cameraData.camera_model)) {
    return validation;
  }

  try {
    // Validate against camera specifications lookup table
    if (cameraData.camera_brand && cameraData.camera_model) {
      const specQuery = `
        SELECT * FROM camera_specifications
        WHERE LOWER(brand) = LOWER(?) AND LOWER(model) = LOWER(?)
      `;
      const spec = await executeQueryFirst(env, specQuery, [cameraData.camera_brand, cameraData.camera_model], 'validateCameraSpecs');

      if (spec) {
        // Validate megapixels
        if (cameraData.camera_mega_pixels) {
          const megapixels = parseFloat(cameraData.camera_mega_pixels);
          if (!isNaN(megapixels)) {
            if (megapixels < spec.megapixels_min || megapixels > spec.megapixels_max) {
              validation.errors.push(
                `Megapixels ${megapixels} is outside expected range ${spec.megapixels_min}-${spec.megapixels_max} for ${spec.brand} ${spec.model}`
              );
              validation.isValid = false;
            }
          }
        }

        // Validate ISO range
        if (cameraData.camera_iso) {
          const iso = parseInt(cameraData.camera_iso, 10);
          if (!isNaN(iso)) {
            if (iso < spec.iso_range_min || iso > spec.iso_range_max) {
              validation.warnings.push(
                `ISO ${iso} is outside typical range ${spec.iso_range_min}-${spec.iso_range_max} for ${spec.brand} ${spec.model}`
              );
            }
          }
        }

        // Validate focal length
        if (cameraData.camera_focal_length_mm) {
          const focalLength = parseFloat(cameraData.camera_focal_length_mm);
          if (!isNaN(focalLength)) {
            if (focalLength < spec.focal_length_min_mm || focalLength > spec.focal_length_max_mm) {
              validation.warnings.push(
                `Focal length ${focalLength}mm is outside typical range ${spec.focal_length_min_mm}-${spec.focal_length_max_mm}mm for ${spec.brand} ${spec.model}`
              );
            }
          }
        }

        // Validate aperture
        if (cameraData.camera_aperture && spec.supported_apertures) {
          try {
            const supportedApertures = JSON.parse(spec.supported_apertures);
            if (!supportedApertures.includes(cameraData.camera_aperture)) {
              validation.warnings.push(
                `Aperture ${cameraData.camera_aperture} is not in typical range for ${spec.brand} ${spec.model}. Supported: ${supportedApertures.join(', ')}`
              );
              validation.suggestions.push(`Try one of: ${supportedApertures.slice(0, 3).join(', ')}`);
            }
          } catch (e) {
            // Ignore JSON parsing errors for apertures
          }
        }
      } else {
        // Camera model not in database - add informational warning
        validation.warnings.push(
          `Camera model ${cameraData.camera_brand} ${cameraData.camera_model} is not in the validation database. Specifications cannot be automatically verified.`
        );

        // Get suggestions for similar cameras
        const similarQuery = `
          SELECT brand, model FROM camera_specifications
          WHERE LOWER(brand) LIKE LOWER(?) OR LOWER(model) LIKE LOWER(?)
          LIMIT 3
        `;
        const similar = await executeQuery(env, similarQuery, [`%${cameraData.camera_brand}%`, `%${cameraData.camera_model}%`], 'findSimilarCameras');
        if (similar?.results?.length > 0) {
          validation.suggestions.push(
            `Similar cameras in database: ${similar.results.map(c => `${c.brand} ${c.model}`).join(', ')}`
          );
        }
      }
    }

    // Validate field formats and ranges
    validateCameraFieldFormats(cameraData, validation);

    return validation;

  } catch (error) {
    console.error('Camera validation error:', error);
    validation.warnings.push('Camera validation temporarily unavailable');
    return validation;
  }
}

/**
 * Validate camera field formats and scientific ranges
 * @param {Object} cameraData - Camera specification data
 * @param {Object} validation - Validation object to modify
 */
function validateCameraFieldFormats(cameraData, validation) {
  // Validate megapixels format and range
  if (cameraData.camera_mega_pixels) {
    const megapixels = parseFloat(cameraData.camera_mega_pixels);
    if (isNaN(megapixels)) {
      validation.errors.push('Camera megapixels must be a number');
      validation.isValid = false;
    } else if (megapixels < 0.1 || megapixels > 200) {
      validation.errors.push('Camera megapixels must be between 0.1 and 200');
      validation.isValid = false;
    }
  }

  // Validate ISO format and range
  if (cameraData.camera_iso) {
    const iso = parseInt(cameraData.camera_iso, 10);
    if (isNaN(iso)) {
      validation.errors.push('Camera ISO must be a number');
      validation.isValid = false;
    } else if (iso < 50 || iso > 409600) {
      validation.warnings.push('Camera ISO outside typical range (50-409600)');
    }
  }

  // Validate focal length format and range
  if (cameraData.camera_focal_length_mm) {
    const focalLength = parseFloat(cameraData.camera_focal_length_mm);
    if (isNaN(focalLength)) {
      validation.errors.push('Camera focal length must be a number');
      validation.isValid = false;
    } else if (focalLength < 1 || focalLength > 2000) {
      validation.warnings.push('Focal length outside typical range (1-2000mm)');
    }
  }

  // Validate aperture format (f/x.x or fx.x)
  if (cameraData.camera_aperture) {
    const aperturePattern = /^f?\/?(\d+\.?\d*)$/i;
    if (!aperturePattern.test(cameraData.camera_aperture)) {
      validation.errors.push('Camera aperture format should be f/x.x (e.g., f/2.8, f/5.6)');
      validation.isValid = false;
    } else {
      const apertureValue = parseFloat(cameraData.camera_aperture.replace(/[f\/]/gi, ''));
      if (apertureValue < 0.5 || apertureValue > 64) {
        validation.warnings.push('Aperture value outside typical range (f/0.5 - f/64)');
      }
    }
  }

  // Validate exposure time format
  if (cameraData.camera_exposure_time) {
    const exposurePattern = /^(\d+\/\d+|\d+\.?\d*|\d+\.?\d*s?)$/i;
    if (!exposurePattern.test(cameraData.camera_exposure_time)) {
      validation.warnings.push('Exposure time format unclear. Examples: 1/60, 0.5s, 30s');
    }
  }

  // Validate white balance options
  if (cameraData.camera_white_balance) {
    const validWhiteBalance = [
      'Auto', 'Daylight', 'Cloudy', 'Shade', 'Tungsten', 'Fluorescent',
      'Flash', 'Custom', 'Manual', 'Kelvin', 'Sunny', 'Incandescent'
    ];
    const wb = cameraData.camera_white_balance;
    const isValidWB = validWhiteBalance.some(valid =>
      wb.toLowerCase().includes(valid.toLowerCase()) ||
      valid.toLowerCase().includes(wb.toLowerCase())
    );

    if (!isValidWB && !/^\d{3,4}K?$/i.test(wb)) {
      validation.warnings.push(
        `White balance "${wb}" may not be standard. Common values: ${validWhiteBalance.slice(0, 5).join(', ')}, or Kelvin temperature (e.g., 5600K)`
      );
    }
  }
}

/**
 * Get camera specifications for a given brand and model
 * @param {string} brand - Camera brand
 * @param {string} model - Camera model
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} Camera specifications or null if not found
 */
export async function getCameraSpecifications(brand, model, env) {
  if (!brand || !model) {
    return null;
  }

  try {
    const query = `
      SELECT * FROM camera_specifications
      WHERE LOWER(brand) = LOWER(?) AND LOWER(model) = LOWER(?)
    `;
    return await executeQueryFirst(env, query, [brand, model], 'getCameraSpecifications');
  } catch (error) {
    console.error('Error fetching camera specifications:', error);
    return null;
  }
}

/**
 * Get list of all camera brands and models for autocomplete
 * @param {Object} env - Environment variables and bindings
 * @returns {Object} Camera brands and models data
 */
export async function getCameraBrandsAndModels(env) {
  try {
    const query = `
      SELECT DISTINCT brand, model, megapixels_min, megapixels_max
      FROM camera_specifications
      ORDER BY brand, model
    `;
    const result = await executeQuery(env, query, [], 'getCameraBrandsAndModels');

    // Group by brand
    const brands = {};
    (result?.results || []).forEach(camera => {
      if (!brands[camera.brand]) {
        brands[camera.brand] = [];
      }
      brands[camera.brand].push({
        model: camera.model,
        megapixels_range: `${camera.megapixels_min}-${camera.megapixels_max}MP`
      });
    });

    return {
      brands: Object.keys(brands).sort(),
      models_by_brand: brands,
      total_cameras: result?.results?.length || 0
    };
  } catch (error) {
    console.error('Error fetching camera brands and models:', error);
    return { brands: [], models_by_brand: {}, total_cameras: 0 };
  }
}