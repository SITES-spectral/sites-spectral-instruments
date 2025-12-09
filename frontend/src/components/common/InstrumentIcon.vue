<script setup>
/**
 * Instrument Icon Component
 *
 * Renders instrument type icons using Lucide icons.
 * Maps Font Awesome style icon names to Lucide components.
 *
 * Ancient Symbolism Inspiration:
 * - camera: Egyptian Eye of Horus (observation, watching seasonal change)
 * - layer-group: Aztec pyramid levels (stacked spectral data processing)
 * - sun: Egyptian Ra (solar radiation, photosynthetically active radiation)
 * - leaf: Celtic Tree of Life (vegetation indices, ecosystem health)
 * - microscope: Greek scientific precision (detailed spectral analysis)
 * - rainbow: Norse Bifrost (spectral bridge, continuous wavelengths)
 * - temperature-high: Greek thermometer precision (thermal imaging)
 * - wave-square: Chinese water patterns (continuous LiDAR waves)
 * - satellite-dish: Modern technology (radar, synthetic aperture)
 *
 * @module components/common/InstrumentIcon
 */
import {
  Camera,
  Layers,
  Sun,
  Leaf,
  Microscope,
  Rainbow,
  Thermometer,
  Waves,
  Radar
} from 'lucide-vue-next';

const props = defineProps({
  /** Icon name (Font Awesome style: 'camera', 'layer-group', etc.) */
  icon: {
    type: String,
    required: true
  },
  /** Icon size in pixels */
  size: {
    type: Number,
    default: 20
  },
  /** Stroke width (1-3, default 2 for consistency) */
  strokeWidth: {
    type: Number,
    default: 2
  },
  /** Icon color (CSS color value) */
  color: {
    type: String,
    default: 'currentColor'
  }
});

// Icon name mapping to Lucide components
const iconComponents = {
  camera: Camera,
  'layer-group': Layers,
  sun: Sun,
  leaf: Leaf,
  microscope: Microscope,
  rainbow: Rainbow,
  'temperature-high': Thermometer,
  'wave-square': Waves,
  'satellite-dish': Radar
};

// Get the component for the icon name, fallback to Camera if not found
const IconComponent = iconComponents[props.icon] || Camera;
</script>

<template>
  <component
    :is="IconComponent"
    :size="size"
    :stroke-width="strokeWidth"
    :style="{ color }"
    class="inline-block flex-shrink-0"
  />
</template>

<style scoped>
/* Ensure icons align properly with text */
svg {
  vertical-align: middle;
}
</style>
