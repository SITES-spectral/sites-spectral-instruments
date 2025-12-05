/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // SITES Spectral brand colors
        'sites-primary': '#1e40af',
        'sites-secondary': '#059669',
        'sites-accent': '#7c3aed',
        // Platform type colors
        'platform-fixed': '#3b82f6',
        'platform-uav': '#f59e0b',
        'platform-satellite': '#8b5cf6',
        // Ecosystem colors
        'eco-forest': '#22c55e',
        'eco-agriculture': '#eab308',
        'eco-grassland': '#84cc16',
        'eco-wetland': '#06b6d4'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        sites: {
          'primary': '#1e40af',
          'secondary': '#059669',
          'accent': '#7c3aed',
          'neutral': '#1f2937',
          'base-100': '#ffffff',
          'info': '#3b82f6',
          'success': '#22c55e',
          'warning': '#f59e0b',
          'error': '#ef4444'
        }
      },
      'light',
      'dark'
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    logs: false
  }
};
