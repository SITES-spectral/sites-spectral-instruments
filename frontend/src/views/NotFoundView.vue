<script setup>
/**
 * 404 Not Found View
 */
import { useRouter } from 'vue-router';

const router = useRouter();

function goHome() {
  router.push('/');
}
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-primary/20">404</h1>
      <h2 class="text-2xl font-bold mt-4">Page Not Found</h2>
      <p class="text-base-content/60 mt-2">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button @click="goHome" class="btn btn-primary mt-6">
        Go to Dashboard
      </button>
    </div>
  </div>
</template>
