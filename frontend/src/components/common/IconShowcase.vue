<script setup>
/**
 * Icon Showcase Component
 *
 * Demo component showing all instrument icons with their symbolism.
 * Use this for documentation and testing icon display.
 *
 * @module components/common/IconShowcase
 */
import { InstrumentIcon } from '@components/common';
import { INSTRUMENT_TYPE_REGISTRY } from '@composables/useTypeRegistry';

const instruments = Object.values(INSTRUMENT_TYPE_REGISTRY);
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="prose max-w-none">
      <h1>SITES Spectral Icon System</h1>
      <p class="text-base-content/70">
        Icons powered by Lucide, inspired by ancient symbolic traditions.
        Each icon tells a story about the instrument's purpose and connection to nature.
      </p>
    </div>

    <!-- Icon Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="instrument in instruments"
        :key="instrument.key"
        class="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow"
      >
        <div class="card-body p-4">
          <!-- Icon Display -->
          <div class="flex items-center gap-3 mb-3">
            <div
              class="flex items-center justify-center w-12 h-12 rounded-lg"
              :style="{ backgroundColor: instrument.color + '20' }"
            >
              <InstrumentIcon
                :icon="instrument.icon"
                :size="24"
                :stroke-width="2"
                :color="instrument.color"
              />
            </div>
            <div>
              <h3 class="font-semibold text-base">{{ instrument.name }}</h3>
              <span class="text-xs font-mono text-base-content/50">{{ instrument.code }}</span>
            </div>
          </div>

          <!-- Description -->
          <p class="text-sm text-base-content/70">
            {{ instrument.description }}
          </p>

          <!-- Platform Compatibility -->
          <div class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="platform in instrument.platforms"
              :key="platform"
              class="badge badge-sm"
            >
              {{ platform }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Size Examples -->
    <div class="card bg-base-100 shadow-sm border border-base-300">
      <div class="card-body">
        <h2 class="card-title">Icon Sizes</h2>
        <div class="flex items-center gap-6">
          <div class="text-center">
            <InstrumentIcon icon="camera" :size="12" />
            <p class="text-xs mt-1">12px (xs)</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="camera" :size="16" />
            <p class="text-xs mt-1">16px (sm)</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="camera" :size="20" />
            <p class="text-xs mt-1">20px (md)</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="camera" :size="24" />
            <p class="text-xs mt-1">24px (lg)</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="camera" :size="32" />
            <p class="text-xs mt-1">32px (xl)</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="camera" :size="48" />
            <p class="text-xs mt-1">48px (2xl)</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Stroke Width Examples -->
    <div class="card bg-base-100 shadow-sm border border-base-300">
      <div class="card-body">
        <h2 class="card-title">Stroke Widths</h2>
        <div class="flex items-center gap-6">
          <div class="text-center">
            <InstrumentIcon icon="leaf" :size="24" :stroke-width="1" />
            <p class="text-xs mt-1">1px (thin)</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="leaf" :size="24" :stroke-width="1.5" />
            <p class="text-xs mt-1">1.5px (light)</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="leaf" :size="24" :stroke-width="2" />
            <p class="text-xs mt-1">2px (default)</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="leaf" :size="24" :stroke-width="2.5" />
            <p class="text-xs mt-1">2.5px (bold)</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="leaf" :size="24" :stroke-width="3" />
            <p class="text-xs mt-1">3px (heavy)</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Color Examples -->
    <div class="card bg-base-100 shadow-sm border border-base-300">
      <div class="card-body">
        <h2 class="card-title">Scientific Color Palette</h2>
        <div class="flex flex-wrap gap-4">
          <div class="text-center">
            <InstrumentIcon icon="leaf" :size="24" color="#22c55e" />
            <p class="text-xs mt-1">Forest</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="sun" :size="24" color="#f59e0b" />
            <p class="text-xs mt-1">Solar</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="layer-group" :size="24" color="#06b6d4" />
            <p class="text-xs mt-1">Water</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="camera" :size="24" color="#3b82f6" />
            <p class="text-xs mt-1">Science</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="rainbow" :size="24" color="#8b5cf6" />
            <p class="text-xs mt-1">Advanced</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="temperature-high" :size="24" color="#ef4444" />
            <p class="text-xs mt-1">Thermal</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="wave-square" :size="24" color="#14b8a6" />
            <p class="text-xs mt-1">Structure</p>
          </div>
          <div class="text-center">
            <InstrumentIcon icon="satellite-dish" :size="24" color="#6366f1" />
            <p class="text-xs mt-1">Satellite</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
