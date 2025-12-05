<script setup>
/**
 * Platform View
 *
 * Placeholder for platform detail view.
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
    <h1 class="text-2xl font-bold mb-4">Platform Details</h1>
    <p class="text-base-content/60">Platform ID: {{ id }}</p>
    <div class="alert alert-info mt-4">
      <span>Platform detail view coming soon...</span>
    </div>
  </div>
</template>
