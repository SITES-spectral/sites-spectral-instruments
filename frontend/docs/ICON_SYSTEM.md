# SITES Spectral Icon System

**Powered by Lucide Icons** - MIT-licensed, Vue-native icon library with ancient symbolism inspiration.

---

## Overview

The SITES Spectral frontend uses **Lucide Icons** (`lucide-vue-next`) for all instrument type iconography. Lucide provides clean, consistent stroke-based icons that integrate seamlessly with Vue 3, Tailwind CSS, and DaisyUI.

### Why Lucide?

| Feature | Benefit |
|---------|---------|
| **License** | ISC (MIT-compatible, commercial-friendly) |
| **Bundle Size** | ~14KB for 10 icons (tree-shaken) |
| **Vue Integration** | Official Vue 3 package with full TypeScript support |
| **Design** | Clean, minimal strokes perfect for scientific applications |
| **Coverage** | 1400+ icons, all instrument types covered |
| **Maintenance** | Active development, no external CDN dependencies |

---

## Icon Mapping

### Instrument Type Icons

Each instrument type is represented by a Lucide icon inspired by ancient symbolic traditions:

| Type | Icon Name | Lucide Component | Ancient Inspiration |
|------|-----------|------------------|---------------------|
| **Phenocam** | `camera` | `Camera` | Egyptian Eye of Horus - observation and watching seasonal change |
| **Multispectral** | `layer-group` | `Layers` | Aztec stepped pyramid - layered spectral data processing (L0→L1→L2→L3) |
| **PAR Sensor** | `sun` | `Sun` | Egyptian Ra - solar radiation, photosynthetically active radiation |
| **NDVI Sensor** | `leaf` | `Leaf` | Celtic Tree of Life - vegetation indices, ecosystem health |
| **PRI Sensor** | `microscope` | `Microscope` | Greek scientific precision - detailed spectral analysis |
| **Hyperspectral** | `rainbow` | `Rainbow` | Norse Bifrost - spectral bridge connecting worlds, continuous wavelengths |
| **Thermal** | `temperature-high` | `Thermometer` | Greek geometric precision - thermal imaging accuracy |
| **LiDAR** | `wave-square` | `Waves` | Chinese water patterns - continuous flow, wave-based sensing |
| **Radar** | `satellite-dish` | `Radar` | Modern technology - synthetic aperture radar, all-weather observation |

---

## Usage

### Basic Component

Use the `InstrumentIcon` component anywhere in the application:

```vue
<script setup>
import { InstrumentIcon } from '@components/common';
</script>

<template>
  <!-- Default usage (20px, stroke-width 2, currentColor) -->
  <InstrumentIcon icon="camera" />

  <!-- Custom size and color -->
  <InstrumentIcon
    icon="leaf"
    :size="24"
    :stroke-width="2"
    color="#22c55e"
  />

  <!-- Using instrument type config -->
  <InstrumentIcon
    :icon="instrumentConfig.icon"
    :color="instrumentConfig.color"
  />
</template>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `String` | required | Icon name (Font Awesome style: 'camera', 'layer-group', etc.) |
| `size` | `Number` | `20` | Icon size in pixels |
| `strokeWidth` | `Number` | `2` | Stroke width (1-3, 2 recommended for consistency) |
| `color` | `String` | `'currentColor'` | Icon color (CSS color value or currentColor) |

### Direct Lucide Usage

For more control, import Lucide components directly:

```vue
<script setup>
import { Camera, Leaf, Sun } from 'lucide-vue-next';
</script>

<template>
  <Camera :size="20" :stroke-width="2" class="text-blue-500" />
  <Leaf :size="24" :stroke-width="1.5" class="text-green-600" />
  <Sun :size="18" stroke-width="2.5" color="#f59e0b" />
</template>
```

---

## Icon Design Standards

### Size System

Use consistent sizes across the application:

| Size | Pixels | Use Case |
|------|--------|----------|
| **xs** | 12px | Inline with small text, badges |
| **sm** | 16px | Inline with body text, table cells |
| **md** | 20px | Default, buttons, navigation |
| **lg** | 24px | Section headers, cards |
| **xl** | 32px | Feature highlights, empty states |
| **2xl** | 48px | Hero sections, large empty states |

### Stroke Width

Maintain consistent stroke weight for visual harmony:

- **1.5px**: Light weight (delicate, detailed)
- **2px**: Default (recommended for consistency)
- **2.5px**: Bold (emphasis, primary actions)

Match stroke width to context:
- Body text (400 weight): 1.5-2px stroke
- Semibold headings (600 weight): 2-2.5px stroke

### Color Guidelines

#### Scientific Color Palette

Based on ecosystem monitoring context:

```css
/* Vegetation / Forest */
--sites-forest-500: #22c55e;   /* Phenocam, NDVI */

/* Spectral / Water */
--sites-water-500: #06b6d4;    /* PRI, Multispectral */

/* Solar / Energy */
--sites-solar-500: #f59e0b;    /* PAR, Thermal */

/* Precision / Scientific */
--sites-science-500: #3b82f6;  /* Phenocam, Lab instruments */

/* Advanced / Hyperspectral */
--sites-advanced-500: #8b5cf6; /* Hyperspectral, Rainbow */

/* Thermal / Heat */
--sites-thermal-500: #ef4444;  /* Thermal cameras */

/* Structural / LiDAR */
--sites-structure-500: #14b8a6; /* LiDAR, 3D data */

/* Satellite / Radar */
--sites-satellite-500: #6366f1; /* Radar, SAR */
```

#### Semantic Colors

Use DaisyUI semantic classes for status:

- **Primary**: `text-primary` - Main instrument type color
- **Success**: `text-success` - Active, operational
- **Warning**: `text-warning` - Calibration due, maintenance needed
- **Error**: `text-error` - Inactive, error state
- **Info**: `text-info` - Informational, documentation

---

## Ancient Symbolism References

### Egyptian: Eye of Horus (Camera)
```
𓂀
The Eye of Horus represents observation, protection, and restoration.
In phenocam context: Continuous observation of seasonal change.
Design: Profile view, maximum recognition, single glance understanding.
```

### Aztec: Stepped Pyramid (Layers)
```
Teotihuacan pyramid levels represent ascension and data refinement.
In multispectral context: L0 (raw) → L1 (calibrated) → L2 (derived) → L3 (aggregated).
Design: Interlocking elements showing relationships between processing levels.
```

### Egyptian: Ra (Sun)
```
𓇳
Ra, the sun god, represents solar energy and life-giving radiation.
In PAR sensor context: Photosynthetically Active Radiation (400-700 nm).
Design: Radial symmetry, power emanating from center.
```

### Celtic: Tree of Life (Leaf)
```
Interconnected branches and roots represent ecosystem health.
In NDVI context: Vegetation indices tracking ecosystem vitality.
Design: Organic flow, growth patterns, seasonal cycles.
```

### Greek: Scientific Precision (Microscope)
```
Greek philosophy of observation and measurement.
In PRI context: Photochemical Reflectance Index for stress detection.
Design: Geometric perfection, mathematical precision.
```

### Norse: Bifrost (Rainbow)
```
The rainbow bridge connecting worlds represents spectral continuity.
In hyperspectral context: Continuous spectral bands across wavelengths.
Design: Flowing gradient, seamless transition between domains.
```

### Chinese: Water Patterns (Waves)
```
雲 水 山
Flowing water represents continuous, cyclical processes.
In LiDAR context: Wave-based sensing, continuous point cloud data.
Design: Rhythmic patterns, eternal flow, yin-yang balance.
```

---

## Adding New Icons

### 1. Choose Lucide Icon

Browse available icons: https://lucide.dev/icons

```bash
# Check icon availability
npm search lucide-vue-next
```

### 2. Update InstrumentIcon.vue

Add the new icon to the mapping:

```javascript
// src/components/common/InstrumentIcon.vue
import { Camera, Layers, NewIcon } from 'lucide-vue-next';

const iconComponents = {
  camera: Camera,
  'layer-group': Layers,
  'new-icon-name': NewIcon  // Add your icon
};
```

### 3. Update Type Registry

Add the icon name to the instrument type config:

```javascript
// src/composables/useTypeRegistry.js
export const INSTRUMENT_TYPE_REGISTRY = {
  new_instrument: {
    key: 'new_instrument',
    name: 'New Instrument Type',
    code: 'NEW',
    icon: 'new-icon-name',  // Use Font Awesome style name
    color: '#3b82f6',
    // ... other fields
  }
};
```

### 4. Document Ancient Inspiration

Add the symbolic meaning to this documentation:

```markdown
### New Icon Symbolism
- **Icon**: new-icon-name
- **Lucide Component**: NewIcon
- **Ancient Inspiration**: [Choose from: Egyptian, Norse, Celtic, Greek, Mayan, Chinese, etc.]
- **Meaning**: Why this symbol represents the instrument type
- **Design Principles**: Key visual characteristics
```

---

## Best Practices

### 1. Icon Consistency

✅ **DO:**
- Use consistent stroke width (2px default)
- Apply semantic colors from palette
- Match icon size to text size
- Use `InstrumentIcon` component for type icons

❌ **DON'T:**
- Mix different icon styles (Font Awesome + Lucide)
- Use random colors without semantic meaning
- Create custom SVG icons without ancient inspiration
- Hardcode icon sizes throughout the codebase

### 2. Accessibility

✅ **DO:**
- Use `aria-label` for icon-only buttons
- Provide text labels alongside icons
- Ensure sufficient color contrast (4.5:1 minimum)
- Test with screen readers

```vue
<!-- Good: Icon with text label -->
<button class="btn">
  <InstrumentIcon icon="camera" />
  <span>Add Phenocam</span>
</button>

<!-- Good: Icon-only with aria-label -->
<button aria-label="Add Phenocam" class="btn btn-icon">
  <InstrumentIcon icon="camera" />
</button>
```

### 3. Performance

✅ **DO:**
- Import only icons you use
- Use tree-shaking (Vite does this automatically)
- Reuse `InstrumentIcon` component
- Cache icon components

❌ **DON'T:**
- Import entire icon library (`import * from 'lucide-vue-next'`)
- Create duplicate icon components
- Use CDN for icons (adds external dependency)

---

## Migration from Font Awesome

If migrating legacy code from Font Awesome to Lucide:

### Find Font Awesome Usage

```bash
# Find all Font Awesome icon classes
grep -r "fa-solid\|fa-regular\|fas\|far" frontend/src
```

### Replace with InstrumentIcon

```vue
<!-- Before: Font Awesome -->
<i class="fas fa-camera"></i>

<!-- After: Lucide via InstrumentIcon -->
<InstrumentIcon icon="camera" />
```

### Update Class-based Icons

```vue
<!-- Before: Class-based -->
<div :class="getTypeIcon(type)"></div>

<!-- After: Component-based -->
<InstrumentIcon :icon="getTypeIconName(type)" />
```

---

## Resources

- **Lucide Documentation**: https://lucide.dev/guide/
- **Lucide Vue Package**: https://www.npmjs.com/package/lucide-vue-next
- **Icon Browser**: https://lucide.dev/icons
- **License**: https://lucide.dev/license (ISC)
- **GitHub**: https://github.com/lucide-icons/lucide

---

## License Compliance

**Lucide Icons**: ISC License (MIT-compatible)
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ✅ No attribution required (but appreciated)

**SITES Spectral**: Uses Lucide with full license compliance.
