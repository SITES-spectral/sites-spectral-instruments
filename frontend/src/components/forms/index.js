/**
 * Form Components
 *
 * Registry-driven form components for platform and instrument CRUD.
 *
 * Architecture:
 * - PlatformForm uses Strategy pattern (type-specific field components)
 * - InstrumentForm uses Registry pattern (dynamic field generation)
 *
 * SOLID Compliance:
 * - Open/Closed: Add types by creating new components or updating registry
 * - Single Responsibility: Each component handles one concern
 * - Dependency Inversion: Forms depend on TypeRegistry abstraction
 *
 * @module components/forms
 */

// Main form components
export { default as StationForm } from './StationForm.vue';
export { default as PlatformForm } from './PlatformForm.vue';
export { default as InstrumentForm } from './InstrumentForm.vue';

// Type-specific platform field components
export {
  FixedPlatformFields,
  UAVPlatformFields,
  SatellitePlatformFields,
  getPlatformFieldsComponent
} from './platform';

// Dynamic field components
export {
  DynamicField,
  DynamicFieldGroup
} from './fields';
