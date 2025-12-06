/**
 * Platform Form Components
 *
 * Type-specific form field components for platform creation/editing.
 * Each component shows ONLY the fields relevant to that platform type,
 * following SOLID principles (Open/Closed - extend by adding new types).
 *
 * @module components/forms/platform
 */

export { default as FixedPlatformFields } from './FixedPlatformFields.vue';
export { default as UAVPlatformFields } from './UAVPlatformFields.vue';
export { default as SatellitePlatformFields } from './SatellitePlatformFields.vue';

/**
 * Get the appropriate fields component for a platform type
 * @param {string} platformType - The platform type (fixed, uav, satellite)
 * @returns {Component} The Vue component for that platform type's fields
 */
export function getPlatformFieldsComponent(platformType) {
  const componentMap = {
    fixed: () => import('./FixedPlatformFields.vue'),
    uav: () => import('./UAVPlatformFields.vue'),
    satellite: () => import('./SatellitePlatformFields.vue')
  };

  return componentMap[platformType] || componentMap.fixed;
}
