/**
 * SITES Spectral v10.0.0
 * Vue 3 Application Entry Point
 *
 * @module main
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/main.css';

// Create Vue application
const app = createApp(App);

// Install plugins
app.use(createPinia());
app.use(router);

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err);
  console.error('Component:', instance);
  console.error('Info:', info);
};

// Mount application
app.mount('#app');
