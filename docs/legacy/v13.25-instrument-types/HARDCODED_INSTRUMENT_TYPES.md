# Archived: Hardcoded Instrument Types (v13.25.0 and earlier)

> **Archive Date**: 2025-12-29
> **Replaced In**: v13.26.0
> **Replacement**: YAML configuration with build-time code generation

## Overview

Prior to v13.26.0, instrument type definitions were hardcoded directly in `InstrumentTypeRegistry.js`. This document preserves the original implementation for historical reference.

## Original Implementation

### Location

```
src/domain/instrument/InstrumentTypeRegistry.js
```

### Hardcoded DEFAULT_INSTRUMENT_TYPES

```javascript
const DEFAULT_INSTRUMENT_TYPES = {
  phenocam: {
    name: 'Phenocam',
    description: 'Digital camera for repeat photography and phenology monitoring',
    icon: 'camera',
    color: '#3b82f6',
    code: 'PHE',
    category: 'imaging',
    platforms: ['fixed', 'uav'],
    fieldSchema: {
      camera_brand: { type: 'string', required: false },
      camera_model: { type: 'string', required: false },
      resolution: { type: 'string', required: false },
      interval_minutes: { type: 'number', required: false, min: 1, max: 1440 }
    }
  },
  multispectral: {
    name: 'Multispectral Sensor',
    description: 'Sensor capturing discrete spectral bands',
    icon: 'layer-group',
    color: '#8b5cf6',
    code: 'MS',
    category: 'spectral',
    platforms: ['fixed', 'uav', 'satellite'],
    fieldSchema: {
      number_of_channels: { type: 'number', required: false, min: 2, max: 50 },
      spectral_range: { type: 'string', required: false },
      orientation: { type: 'string', required: false }
    }
  },
  // ... 8 more types hardcoded inline
};

const CATEGORIES = {
  imaging: { name: 'Imaging', icon: 'image', color: '#3b82f6' },
  spectral: { name: 'Spectral', icon: 'rainbow', color: '#8b5cf6' },
  radiation: { name: 'Radiation', icon: 'sun', color: '#f59e0b' },
  thermal: { name: 'Thermal', icon: 'fire', color: '#ef4444' },
  structural: { name: 'Structural', icon: 'cubes', color: '#14b8a6' },
  microwave: { name: 'Microwave', icon: 'broadcast-tower', color: '#6366f1' }
};
```

## Problems with Hardcoded Approach

1. **No Single Source of Truth**: Instrument types defined in both JS code and separate YAML files
2. **Manual Sync Required**: Changes needed in multiple locations
3. **~140 Lines of Inline Config**: Large constant block in source file
4. **Inconsistent with Platform Types**: Platform types already used YAML configuration

## New Approach (v13.26.0+)

See the main documentation for the current config-driven approach:

- **Source of Truth**: `yamls/instruments/instrument-types.yaml`
- **Build-Time Generation**: `scripts/build.js` generates JS module
- **Generated Module**: `src/domain/instrument/instrument-types.generated.js`
- **Registry Import**: `InstrumentTypeRegistry.js` imports from generated module

## Migration Notes

- No database changes required
- No API changes required
- Registry interface unchanged (backward compatible)
- All 653 tests pass after migration

## Related Files (Archived State)

| File | Lines of Hardcoded Config |
|------|---------------------------|
| `InstrumentTypeRegistry.js` | ~140 lines (types + categories) |

## See Also

- [[../CHANGELOG_V11_AND_EARLIER|Legacy Changelog]]
- [v13.26.0 CHANGELOG entry](../../CHANGELOG.md#13260---2025-12-29)
