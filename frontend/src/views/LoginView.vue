<script setup>
/**
 * Login View
 *
 * Authentication page with login form.
 */
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Form state
const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

// Handle login
async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = 'Please enter username and password';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const success = await authStore.login(username.value, password.value);

    if (success) {
      const redirectPath = authStore.getRedirectPath();
      router.push(redirectPath);
    } else {
      error.value = 'Invalid username or password';
    }
  } catch (err) {
    error.value = err.message || 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
    <div class="card w-full max-w-md bg-base-100 shadow-2xl">
      <div class="card-body">
        <!-- Logo and title -->
        <div class="text-center mb-6">
          <div class="flex justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-16 w-16 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
          </div>
          <h1 class="text-2xl font-bold">SITES Spectral</h1>
          <p class="text-base-content/60 text-sm mt-1">
            Instrument Management System
          </p>
        </div>

        <!-- Error alert -->
        <div v-if="error" class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ error }}</span>
        </div>

        <!-- Login form -->
        <form @submit.prevent="handleLogin">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Username</span>
            </label>
            <input
              v-model="username"
              type="text"
              placeholder="Enter your username"
              class="input input-bordered"
              :disabled="loading"
              autocomplete="username"
            />
          </div>

          <div class="form-control mt-4">
            <label class="label">
              <span class="label-text">Password</span>
            </label>
            <input
              v-model="password"
              type="password"
              placeholder="Enter your password"
              class="input input-bordered"
              :disabled="loading"
              autocomplete="current-password"
            />
          </div>

          <div class="form-control mt-6">
            <button
              type="submit"
              class="btn btn-primary"
              :class="{ 'loading': loading }"
              :disabled="loading"
            >
              <span v-if="!loading">Sign In</span>
              <span v-else>Signing in...</span>
            </button>
          </div>
        </form>

        <!-- Footer -->
        <div class="text-center mt-6 text-sm text-base-content/50">
          <p>SITES Spectral v10.0.0</p>
        </div>
      </div>
    </div>
  </div>
</template>
