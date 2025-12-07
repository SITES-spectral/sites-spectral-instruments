/**
 * Role Management Composable
 *
 * Provides role-based access control utilities.
 * v10.0.0-alpha.17: Added ROI edit permissions for Legacy System
 *
 * Role Hierarchy:
 * - admin, spectral-admin, sites-admin, sites-spectral-admin: Full system access
 * - station-admin (e.g., abisko-admin): Full access to their station
 * - station (e.g., abisko): Limited edit access to their station
 * - readonly: View-only access
 *
 * ROI Edit Permissions:
 * - Super admins can directly edit ROIs (with timeseries_broken warning)
 * - Station users must create new ROI (old marked as legacy)
 *
 * @module composables/useRoles
 */

import { computed } from 'vue';
import { useAuthStore, ADMIN_ROLES, ADMIN_USERNAMES } from '@stores/auth';

/**
 * Super admin roles that can directly edit ROIs
 * These roles can override the legacy system with a warning
 */
export const SUPER_ADMIN_ROLES = ['admin', 'spectral-admin', 'sites-admin', 'sites-spectral-admin'];

/**
 * Station names for the SITES network
 */
export const STATION_NAMES = [
  'abisko',
  'asa',
  'grimsoe',
  'lonnstorp',
  'robacksdalen',
  'skogaryd',
  'svartberget'
];

/**
 * Role definitions with metadata
 */
export const ROLE_DEFINITIONS = {
  admin: {
    name: 'Administrator',
    description: 'Full system access across all stations',
    level: 100,
    icon: 'fa-shield-halved',
    color: 'error'
  },
  'spectral-admin': {
    name: 'Spectral Administrator',
    description: 'Full access for SITES Spectral management',
    level: 100,
    icon: 'fa-sun',
    color: 'error'
  },
  'sites-admin': {
    name: 'SITES Administrator',
    description: 'Full access for SITES infrastructure management',
    level: 100,
    icon: 'fa-building',
    color: 'error'
  },
  'sites-spectral-admin': {
    name: 'SITES Spectral Administrator',
    description: 'Full access for combined SITES Spectral management',
    level: 100,
    icon: 'fa-star',
    color: 'error'
  },
  'station-admin': {
    name: 'Station Administrator',
    description: 'Full access to manage a specific station',
    level: 75,
    icon: 'fa-user-gear',
    color: 'warning'
  },
  station: {
    name: 'Station User',
    description: 'Limited edit access for a specific station',
    level: 50,
    icon: 'fa-user',
    color: 'info'
  },
  readonly: {
    name: 'Read Only',
    description: 'View-only access to all data',
    level: 10,
    icon: 'fa-eye',
    color: 'neutral'
  }
};

/**
 * Role management composable
 * @returns {Object} Role utilities
 */
export function useRoles() {
  const authStore = useAuthStore();

  /**
   * Get role definition for a role key
   */
  function getRoleDefinition(roleKey) {
    return ROLE_DEFINITIONS[roleKey] || ROLE_DEFINITIONS.readonly;
  }

  /**
   * Get display name for current user's role
   */
  const currentRoleDisplay = computed(() => {
    const role = authStore.userRole;
    return getRoleDefinition(role).name;
  });

  /**
   * Get role badge color class
   */
  const roleBadgeClass = computed(() => {
    const role = authStore.userRole;
    const def = getRoleDefinition(role);
    return `badge-${def.color}`;
  });

  /**
   * Get role icon class
   */
  const roleIconClass = computed(() => {
    const role = authStore.userRole;
    const def = getRoleDefinition(role);
    return `fa-solid ${def.icon}`;
  });

  /**
   * Check if current user can manage users
   */
  const canManageUsers = computed(() => {
    return authStore.isAdmin;
  });

  /**
   * Check if current user can manage stations
   */
  const canManageStations = computed(() => {
    return authStore.isAdmin;
  });

  /**
   * Check if current user can manage system settings
   */
  const canManageSettings = computed(() => {
    return authStore.isAdmin;
  });

  /**
   * Check if user can create platforms
   */
  const canCreatePlatforms = computed(() => {
    return authStore.isAdmin || authStore.isStationAdmin || authStore.isStationUser;
  });

  /**
   * Check if user can delete platforms
   */
  const canDeletePlatforms = computed(() => {
    return authStore.isAdmin || authStore.isStationAdmin;
  });

  // ============================================================================
  // ROI Edit Permissions (v10.0.0-alpha.17 - Legacy ROI System)
  // ============================================================================

  /**
   * Check if user can directly edit ROIs (super admin only)
   * Super admins can modify ROIs directly but will get a warning about
   * breaking time series data, and timeseries_broken flag will be set.
   */
  const canDirectEditROI = computed(() => {
    return SUPER_ADMIN_ROLES.includes(authStore.userRole);
  });

  /**
   * Check if user can edit ROIs (through legacy system or direct)
   * Station users must create new ROI (old marked as legacy)
   * Super admins can edit directly with warning
   */
  const canEditROI = computed(() => {
    return authStore.isAdmin || authStore.isStationAdmin || authStore.isStationUser;
  });

  /**
   * Check if user can create new ROIs
   */
  const canCreateROI = computed(() => {
    return authStore.isAdmin || authStore.isStationAdmin || authStore.isStationUser;
  });

  /**
   * Check if user can delete ROIs
   */
  const canDeleteROI = computed(() => {
    return authStore.isAdmin || authStore.isStationAdmin;
  });

  /**
   * Check if user can view legacy ROIs
   */
  const canViewLegacyROIs = computed(() => {
    return authStore.isAuthenticated;
  });

  /**
   * Get list of stations user can access
   */
  const accessibleStations = computed(() => {
    if (authStore.isAdmin) {
      return STATION_NAMES;
    }
    if (authStore.isStationAdmin || authStore.isStationUser) {
      const station = authStore.userStationFromUsername;
      return station ? [station] : [];
    }
    return STATION_NAMES; // readonly can view all
  });

  /**
   * Check if a specific permission is granted
   */
  function hasPermission(permission) {
    const permissions = {
      'users.manage': canManageUsers.value,
      'stations.manage': canManageStations.value,
      'settings.manage': canManageSettings.value,
      'platforms.create': canCreatePlatforms.value,
      'platforms.delete': canDeletePlatforms.value,
      'instruments.create': authStore.isAdmin || authStore.isStationAdmin || authStore.isStationUser,
      'instruments.delete': authStore.isAdmin || authStore.isStationAdmin,
      'rois.create': canCreateROI.value,
      'rois.edit': canEditROI.value,
      'rois.edit.direct': canDirectEditROI.value,
      'rois.delete': canDeleteROI.value,
      'rois.legacy.view': canViewLegacyROIs.value,
      'export.full': authStore.isAdmin
    };
    return permissions[permission] ?? false;
  }

  /**
   * Get all permissions for current user
   */
  const currentPermissions = computed(() => {
    return {
      'users.manage': canManageUsers.value,
      'stations.manage': canManageStations.value,
      'settings.manage': canManageSettings.value,
      'platforms.create': canCreatePlatforms.value,
      'platforms.delete': canDeletePlatforms.value,
      'instruments.create': authStore.isAdmin || authStore.isStationAdmin || authStore.isStationUser,
      'instruments.delete': authStore.isAdmin || authStore.isStationAdmin,
      'rois.create': canCreateROI.value,
      'rois.edit': canEditROI.value,
      'rois.edit.direct': canDirectEditROI.value,
      'rois.delete': canDeleteROI.value,
      'rois.legacy.view': canViewLegacyROIs.value,
      'export.full': authStore.isAdmin
    };
  });

  return {
    // Constants
    STATION_NAMES,
    ROLE_DEFINITIONS,
    ADMIN_ROLES,
    ADMIN_USERNAMES,
    SUPER_ADMIN_ROLES,

    // Computed - General
    currentRoleDisplay,
    roleBadgeClass,
    roleIconClass,
    canManageUsers,
    canManageStations,
    canManageSettings,
    canCreatePlatforms,
    canDeletePlatforms,
    accessibleStations,
    currentPermissions,

    // Computed - ROI Permissions (v10.0.0-alpha.17)
    canDirectEditROI,
    canEditROI,
    canCreateROI,
    canDeleteROI,
    canViewLegacyROIs,

    // Methods
    getRoleDefinition,
    hasPermission
  };
}
