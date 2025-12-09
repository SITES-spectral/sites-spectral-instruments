# Icon System Visual Guide

**Quick visual reference for the SITES Spectral icon transformation.**

---

## Before vs After

### Problem: Text Instead of Icons

**Before (v11.0.0-alpha.11 and earlier):**

```
InstrumentForm.vue line 235:

┌─────────────────────────────────────────┐
│ Instrument Type Selection               │
├─────────────────────────────────────────┤
│ ○ camera Phenocam                       │
│ ○ layer-group Multispectral Sensor      │
│ ○ sun PAR Sensor                        │
│ ○ leaf NDVI Sensor                      │
│ ○ microscope PRI Sensor                 │
│ ○ rainbow Hyperspectral Sensor          │
│ ○ temperature-high Thermal Camera       │
│ ○ wave-square LiDAR                     │
│ ○ satellite-dish Radar (SAR)            │
└─────────────────────────────────────────┘
```

**Issue**: Icon names displayed as raw text, not visual icons.

---

### Solution: Lucide Icons

**After (v11.0.0-alpha.12):**

```
InstrumentForm.vue with Lucide:

┌─────────────────────────────────────────┐
│ Instrument Type Selection               │
├─────────────────────────────────────────┤
│ ○ 📷 Phenocam                            │
│ ○ 📊 Multispectral Sensor               │
│ ○ ☀️ PAR Sensor                          │
│ ○ 🌿 NDVI Sensor                         │
│ ○ 🔬 PRI Sensor                          │
│ ○ 🌈 Hyperspectral Sensor               │
│ ○ 🌡️ Thermal Camera                      │
│ ○ 〰️ LiDAR                               │
│ ○ 📡 Radar (SAR)                         │
└─────────────────────────────────────────┘
```

**Improvement**: Clean, professional stroke-based SVG icons with type-specific colors.

---

## Icon Mapping

### Instrument Type Icons

| Type | Old (Text) | New (Icon) | Color | Ancient Inspiration |
|------|------------|------------|-------|---------------------|
| **Phenocam** | `camera` | 📷 | `#3b82f6` | Egyptian Eye of Horus |
| **Multispectral** | `layer-group` | 📊 | `#8b5cf6` | Aztec Stepped Pyramid |
| **PAR Sensor** | `sun` | ☀️ | `#f59e0b` | Egyptian Ra (sun god) |
| **NDVI Sensor** | `leaf` | 🌿 | `#22c55e` | Celtic Tree of Life |
| **PRI Sensor** | `microscope` | 🔬 | `#06b6d4` | Greek Scientific Precision |
| **Hyperspectral** | `rainbow` | 🌈 | `#ec4899` | Norse Bifrost |
| **Thermal** | `temperature-high` | 🌡️ | `#ef4444` | Greek Thermometer |
| **LiDAR** | `wave-square` | 〰️ | `#14b8a6` | Chinese Water Patterns |
| **Radar** | `satellite-dish` | 📡 | `#6366f1` | Modern Technology |

---

## Component Comparison

### Before: Text Display

```vue
<!-- InstrumentForm.vue (old) -->
<template>
  <label class="flex items-center gap-2">
    <input type="radio" v-model="selectedType" />
    <span>{{ type.icon }}</span>  ← displays "camera" as text
    <span>{{ type.label }}</span>
  </label>
</template>
```

**Output:**
```
○ camera Phenocam
```

---

### After: Icon Component

```vue
<!-- InstrumentForm.vue (new) -->
<script setup>
import { InstrumentIcon } from '@components/common';
</script>

<template>
  <label class="flex items-center gap-2">
    <input type="radio" v-model="selectedType" />
    <InstrumentIcon
      :icon="type.icon"
      :size="18"
      :stroke-width="2"
      :color="type.color"
    />
    <span>{{ type.label }}</span>
  </label>
</template>
```

**Output:**
```
○ 📷 Phenocam  (with proper blue color from registry)
```

---

## Size Comparison

### Icon Sizes (Visual Reference)

```
xs (12px):  📷  - Inline with small text, badges
sm (16px):  📷  - Inline with body text, table cells
md (20px):  📷  - Default, buttons, navigation
lg (24px):  📷  - Section headers, cards
xl (32px):  📷  - Feature highlights, empty states
2xl (48px): 📷  - Hero sections, large displays
```

**InstrumentForm uses**: 18px (compact form layout)

---

## Stroke Width Comparison

### Visual Weight (all 24px size)

```
1.0px:  🌿  - Thin, delicate
1.5px:  🌿  - Light weight
2.0px:  🌿  - Default (recommended)
2.5px:  🌿  - Bold, emphasized
3.0px:  🌿  - Heavy, strong emphasis
```

**InstrumentForm uses**: 2px (consistent default)

---

## Color Palette Visual

### Scientific Color System

```
Forest (#22c55e):     🌿  - Vegetation, ecosystem health
Solar (#f59e0b):      ☀️  - Solar radiation, PAR
Water (#06b6d4):      〰️  - Aquatic, spectral water
Science (#3b82f6):    📷  - Precision, observation
Advanced (#8b5cf6):   🌈  - Hyperspectral, advanced
Thermal (#ef4444):    🌡️  - Heat, temperature
Structure (#14b8a6):  📊  - 3D data, LiDAR
Satellite (#6366f1):  📡  - Radar, remote sensing
```

---

## Code Example: Full Usage

```vue
<script setup>
import { InstrumentIcon } from '@components/common';

const instrument = {
  type: {
    icon: 'camera',
    color: '#3b82f6',
    name: 'Phenocam'
  }
};
</script>

<template>
  <!-- Button with icon -->
  <button class="btn btn-primary">
    <InstrumentIcon
      icon="camera"
      :size="20"
      :stroke-width="2"
      color="#3b82f6"
    />
    Add Phenocam
  </button>

  <!-- Card header with dynamic icon -->
  <div class="card">
    <div class="card-body">
      <h3 class="card-title">
        <InstrumentIcon
          :icon="instrument.type.icon"
          :size="24"
          :color="instrument.type.color"
        />
        {{ instrument.type.name }}
      </h3>
    </div>
  </div>

  <!-- List with multiple icons -->
  <ul class="menu">
    <li>
      <InstrumentIcon icon="camera" :size="16" />
      Phenocam
    </li>
    <li>
      <InstrumentIcon icon="leaf" :size="16" />
      NDVI Sensor
    </li>
    <li>
      <InstrumentIcon icon="sun" :size="16" />
      PAR Sensor
    </li>
  </ul>
</template>
```

---

## Ancient Symbolism Icons

### Egyptian Eye of Horus → Camera (Phenocam)

```
     𓂀
Ancient:     Modern:
   ___          📷
  |• •|      [Camera]
  |___|
   Eye         Icon

Meaning: Observation, watching seasonal change
Design: Clean outline, recognizable profile view
```

### Aztec Pyramid → Layers (Multispectral)

```
Ancient:     Modern:
    △          ≡≡≡
   ▽▽▽        ═══
  ▽▽▽▽▽       ═══
 Pyramid     Layers

Meaning: Data processing levels (L0→L1→L2→L3)
Design: Stacked elements showing hierarchy
```

### Egyptian Ra → Sun (PAR Sensor)

```
Ancient:     Modern:
    𓇳           ☀️
  .-'''-.      ☀️
 /   ☀   \    [Sun]
 \_______/

Meaning: Solar radiation, life-giving energy
Design: Radial symmetry, emanating rays
```

### Celtic Tree → Leaf (NDVI Sensor)

```
Ancient:     Modern:
    ╭─╮          🌿
   ╭┴─┴╮       [Leaf]
  ╭┴───┴╮
 Tree of Life

Meaning: Ecosystem health, seasonal cycles
Design: Organic curves, natural flow
```

---

## Bundle Size Impact

### Before Lucide

```
Total Bundle:  ~450 KB (minified)
Vendor:        ~103 KB
```

### After Lucide

```
Total Bundle:  ~453 KB (minified)  [+3 KB]
Vendor:        ~106 KB             [+3 KB]
InstrumentIcon: 2.86 KB            [new]

Icons imported: 9 (Camera, Layers, Sun, Leaf, Microscope,
                   Rainbow, Thermometer, Waves, Radar)
Tree-shaking: ✅ Only used icons bundled (~330 bytes/icon)
```

**Impact**: Minimal (+0.6% total bundle size)

---

## Browser Compatibility

### Supported Browsers

✅ Chrome/Edge 88+
✅ Firefox 85+
✅ Safari 14+
✅ iOS Safari 14+
✅ Chrome Android 90+

**Technology**: SVG icons (universal browser support)

---

## Accessibility

### ARIA Attributes

Icons automatically include proper attributes:

```vue
<InstrumentIcon icon="camera" />

<!-- Renders as: -->
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  aria-hidden="true"
  class="inline-block flex-shrink-0"
>
  <!-- SVG paths -->
</svg>
```

**Best Practice**: Always include text labels alongside icons.

```vue
<!-- Good: Icon + Text -->
<button>
  <InstrumentIcon icon="camera" />
  <span>Add Phenocam</span>
</button>

<!-- Good: Icon-only with aria-label -->
<button aria-label="Add Phenocam">
  <InstrumentIcon icon="camera" />
</button>
```

---

## Quick Reference Card

### InstrumentIcon Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | String | required | Icon name ('camera', 'leaf', etc.) |
| `size` | Number | 20 | Size in pixels |
| `strokeWidth` | Number | 2 | Stroke width (1-3) |
| `color` | String | 'currentColor' | CSS color value |

### Common Sizes

| Context | Size | Stroke |
|---------|------|--------|
| Small text | 12px | 1.5px |
| Body text | 16px | 2px |
| Form controls | 18px | 2px |
| Buttons | 20px | 2px |
| Headers | 24px | 2px |
| Features | 32px | 2.5px |

### Color Tokens

```javascript
// From useTypeRegistry.js
const colors = {
  phenocam: '#3b82f6',      // Science blue
  multispectral: '#8b5cf6', // Advanced purple
  par_sensor: '#f59e0b',    // Solar amber
  ndvi_sensor: '#22c55e',   // Forest green
  pri_sensor: '#06b6d4',    // Water cyan
  hyperspectral: '#ec4899', // Rainbow pink
  thermal: '#ef4444',       // Thermal red
  lidar: '#14b8a6',         // Structure teal
  radar: '#6366f1'          // Satellite indigo
};
```

---

## Summary

| Metric | Value |
|--------|-------|
| **Package** | lucide-vue-next v0.556.0 |
| **License** | ISC (MIT-compatible) |
| **Bundle Impact** | +3KB (~0.6% increase) |
| **Icons Included** | 9 instrument types |
| **Components Created** | 3 (InstrumentIcon, IconShowcase, index) |
| **Documentation** | 3 files (25KB total) |
| **Build Status** | ✅ Passes (4.79s) |
| **Browser Support** | ✅ All modern browsers |
| **Accessibility** | ✅ ARIA attributes included |

**Status**: ✅ Production-ready
