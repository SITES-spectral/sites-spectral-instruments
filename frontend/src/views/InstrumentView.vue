<script setup>
/**
 * Instrument View
 *
 * Placeholder for instrument detail view.
 */
const props = defineProps({
  id: {
    type: Number,
    required: true
  }
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Instrument Details</h1>
    <p class="text-base-content/60">Instrument ID: {{ id }}</p>
    <div class="alert alert-info mt-4">
      <span>Instrument detail view coming soon...</span>
    </div>
  </div>
</template>
