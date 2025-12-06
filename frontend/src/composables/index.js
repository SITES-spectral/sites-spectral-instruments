/**
 * Composables Index
 *
 * Re-exports all composable functions.
 *
 * @module composables
 */

export { useApi } from './useApi';
export { useAuth } from './useAuth';
export { useNotifications } from './useNotifications';

// Simple type styling (colors, badges)
export {
  useTypes,
  getMountType,
  getPlatformType,
  getInstrumentType,
  getStatus,
  getMeasurementStatus,
  MOUNT_TYPES,
  PLATFORM_TYPES,
  INSTRUMENT_TYPES,
  STATUS_TYPES,
  MEASUREMENT_STATUS
} from './useTypes';

// Full type registry with field schemas (for forms and detail views)
export {
  useTypeRegistry,
  // Platform type strategies
  PLATFORM_TYPE_STRATEGIES,
  getPlatformTypeStrategy,
  getPlatformFields,
  getPlatformExcludedFields,
  isFieldValidForPlatform,
  // Instrument type registry
  INSTRUMENT_TYPE_REGISTRY,
  getInstrumentTypeConfig,
  getInstrumentFields,
  getInstrumentSummaryFields,
  isInstrumentCompatibleWithPlatform,
  getCompatibleInstrumentTypes,
  // Reference data
  MOUNT_TYPE_CODES,
  ECOSYSTEM_CODES,
  getMountTypeInfo,
  getEcosystemInfo,
  formatFieldValue
} from './useTypeRegistry';
