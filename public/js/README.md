# SITES Spectral JavaScript Modules

**Version:** 8.0.0
**Architecture:** Modular, Configuration-Driven, Browser-Compatible

This directory contains the modular JavaScript architecture for SITES Spectral v8.0.0, implementing a clean separation of concerns with configuration-driven development.

## Directory Structure

```
public/js/
├── core/               # Core application modules
│   ├── config-loader.js    # YAML configuration loader
│   ├── error-messages.js   # Centralized error messages
│   ├── state.js            # Global state management
│   └── app.js              # Application controller
├── api/                # API communication
│   └── api-client.js       # Base API client
├── utils/              # Utility functions
│   ├── validators.js       # Field validators
│   └── toast.js            # Toast notifications
├── platforms/          # Platform management (to be created)
├── instruments/        # Instrument management (to be created)
├── map/                # Map components (to be created)
└── modals/             # Modal components (to be created)
    └── sections/           # Modal section components
```

## Core Modules

### 1. ConfigLoader (`core/config-loader.js`)

Loads YAML configuration files from `/yamls/` directory with caching.

**Features:**
- Async configuration loading
- In-memory caching
- Simple YAML parser (browser-compatible)
- Preloading support

**Usage:**
```javascript
// Load single config
const phenocamConfig = await ConfigLoader.get('instruments/phenocam');

// Preload multiple configs
await ConfigLoader.preload([
    'instruments/phenocam',
    'instruments/multispectral'
]);

// Check if loaded
if (ConfigLoader.isLoaded('instruments/phenocam')) {
    // Config is available
}
```

**YAML Structure Example:**
```yaml
# /yamls/instruments/phenocam.yaml
name: Phenocam
icon: 📷
fields:
  camera_brand:
    type: text
    label: Camera Brand
    required: true
  resolution:
    type: text
    label: Resolution
    pattern: '^\d+x\d+$'
```

### 2. Error Messages (`core/error-messages.js`)

Centralized message definitions for consistent user feedback.

**Message Types:**
- `ERROR_MESSAGES` - Error messages
- `SUCCESS_MESSAGES` - Success messages
- `WARNING_MESSAGES` - Warning messages
- `INFO_MESSAGES` - Info messages

**Usage:**
```javascript
// Use directly
Toast.error(ErrorMessages.NETWORK_ERROR);

// Format with parameters
const message = formatMessage(ErrorMessages.INVALID_RANGE, {
    min: 0,
    max: 100
});
Toast.error(message);
```

### 3. State Management (`core/state.js`)

Global application state with reactive updates.

**Features:**
- Get/set state values
- Event emitter pattern
- State history tracking
- Permissions checking

**Usage:**
```javascript
// Set state
AppState.set('currentStation', stationData);

// Get state
const station = AppState.get('currentStation');

// Listen to changes
AppState.on('change:currentStation', ({ value, oldValue }) => {
    console.log('Station changed:', value);
});

// Check permissions
if (AppState.isAdmin()) {
    // Admin actions
}
```

**State Structure:**
```javascript
{
    user: null,
    role: null,
    isAuthenticated: false,
    permissions: [],
    currentStation: null,
    platforms: [],
    instruments: [],
    selectedPlatform: null,
    selectedInstrument: null,
    activeModal: null,
    isLoading: false,
    filters: { ... },
    configs: Map()
}
```

### 4. API Client (`api/api-client.js`)

HTTP client with authentication and error handling.

**Features:**
- REST methods (GET, POST, PUT, PATCH, DELETE)
- JWT authentication
- Request/response/error interceptors
- Automatic error handling

**Usage:**
```javascript
// GET request
const stations = await APIClient.get('/api/stations');

// POST request
const newInstrument = await APIClient.post('/api/instruments', {
    name: 'New Phenocam',
    type: 'phenocam'
});

// PUT request
const updated = await APIClient.put('/api/instruments/123', data);

// DELETE request
await APIClient.delete('/api/instruments/123');

// Set auth token
APIClient.setAuthToken(token);
```

**Interceptors:**
```javascript
// Add request interceptor
APIClient.addRequestInterceptor(async (config) => {
    // Modify request
    config.headers['X-Custom'] = 'value';
    return config;
});

// Add response interceptor
APIClient.addResponseInterceptor(async (response) => {
    // Handle response
    return response;
});

// Add error interceptor
APIClient.addErrorInterceptor(async (error) => {
    // Handle error
    console.log('API Error:', error.message);
    return error;
});
```

### 5. Application Controller (`core/app.js`)

Main application initialization and lifecycle management.

**Features:**
- Auto-initialization
- Configuration preloading
- Authentication state management
- Global error handling
- Initialization callbacks

**Usage:**
```javascript
// App auto-initializes on DOM ready

// Register init callback
SitesApp.onInit(() => {
    console.log('App ready!');
});

// Get config
const config = await SitesApp.getConfig('instruments/phenocam');

// Check auth
if (SitesApp.isAuthenticated()) {
    // Authenticated actions
}

// Navigate
SitesApp.navigate('/station.html?station=SVB');

// Logout
await SitesApp.logout();
```

## Utility Modules

### 6. Validators (`utils/validators.js`)

Reusable field validation functions.

**Usage:**
```javascript
// Validate single field
const result = Validators.required(value, 'Station Name');
if (!result.valid) {
    showError(result.error);
}

// Validate number
const numResult = Validators.number(value, {
    min: 0,
    max: 100,
    fieldName: 'Height'
});

// Validate coordinates
const latResult = Validators.latitude(64.256);
const lonResult = Validators.longitude(19.775);

// Validate email
const emailResult = Validators.email('user@example.com');

// Validate pattern
const idResult = Validators.instrumentId('SVB_FOR_PL01_PHE01');

// Validate form
const formResult = Validators.validateForm({
    name: {
        value: nameInput.value,
        validators: [
            (v) => Validators.required(v, 'Name'),
            (v) => Validators.minLength(v, 3, 'Name')
        ]
    },
    height: {
        value: heightInput.value,
        validators: [
            (v) => Validators.number(v, { min: 0, max: 50 })
        ]
    }
});

if (!formResult.valid) {
    // Show errors: formResult.errors
}
```

**Available Validators:**
- `required()` - Required field
- `number()` - Number validation with range
- `latitude()` - Latitude (-90 to 90)
- `longitude()` - Longitude (-180 to 180)
- `email()` - Email format
- `url()` - URL format
- `date()` - Date validation
- `pattern()` - Regex pattern
- `minLength()` - Minimum string length
- `maxLength()` - Maximum string length
- `wavelength()` - Wavelength (280-2500 nm)
- `resolution()` - Resolution format (e.g., 1920x1080)
- `roiName()` - ROI name format (ROI_XX)
- `instrumentId()` - Instrument ID format
- `platformId()` - Platform ID format

### 7. Toast Notifications (`utils/toast.js`)

User feedback notification system.

**Usage:**
```javascript
// Success notification
Toast.success('Instrument saved successfully!');

// Error notification (doesn't auto-dismiss)
Toast.error('Failed to save instrument.');

// Warning notification
Toast.warning('This action cannot be undone.');

// Info notification
Toast.info('Processing your request...');

// With title
Toast.success('Changes saved', {
    title: 'Success'
});

// Custom duration
Toast.info('Processing...', {
    duration: 10000 // 10 seconds
});

// Configure globally
Toast.configure({
    position: 'top-right',
    duration: 5000,
    maxToasts: 5
});

// Clear all toasts
Toast.clearAll();
```

## Design Principles

### 1. Configuration-Driven Development

**All configuration should be in YAML files, not hardcoded:**

❌ Bad:
```javascript
const fieldConfig = {
    camera_brand: { type: 'text', label: 'Camera Brand', required: true }
};
```

✅ Good:
```javascript
const config = await ConfigLoader.get('instruments/phenocam');
const fieldConfig = config.fields.camera_brand;
```

### 2. Centralized Messages

**All user-facing messages in error-messages.js:**

❌ Bad:
```javascript
alert('Please enter a valid number between 0 and 100');
```

✅ Good:
```javascript
Toast.error(formatMessage(ErrorMessages.INVALID_RANGE, { min: 0, max: 100 }));
```

### 3. Reactive State Management

**Use AppState for global state:**

❌ Bad:
```javascript
let currentStation = null;
```

✅ Good:
```javascript
AppState.set('currentStation', stationData);
AppState.on('change:currentStation', updateUI);
```

### 4. API Abstraction

**Use APIClient, not raw fetch:**

❌ Bad:
```javascript
const response = await fetch('/api/stations', {
    headers: { 'Authorization': `Bearer ${token}` }
});
```

✅ Good:
```javascript
const stations = await APIClient.get('/api/stations');
```

### 5. Browser Compatibility

All modules use IIFE pattern for browser compatibility while supporting ES6 module exports:

```javascript
(function(global) {
    'use strict';

    class MyModule { }

    const instance = new MyModule();

    // ES6 export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }

    // Browser global
    global.MyModule = instance;

})(typeof window !== 'undefined' ? window : global);
```

## Loading Order

Include scripts in this order in HTML:

```html
<!-- Core modules -->
<script src="/js/core/error-messages.js"></script>
<script src="/js/core/state.js"></script>
<script src="/js/core/config-loader.js"></script>
<script src="/js/api/api-client.js"></script>

<!-- Utilities -->
<script src="/js/utils/validators.js"></script>
<script src="/js/utils/toast.js"></script>

<!-- Core app (initializes everything) -->
<script src="/js/core/app.js"></script>

<!-- Feature modules (load after app) -->
<script src="/js/platforms/platform-manager.js"></script>
<script src="/js/instruments/instrument-manager.js"></script>
<!-- etc -->
```

## Next Steps

### Phase 1: Map Fix & Foundation (Current)
- ✅ Core module structure
- ⏳ Create YAML configuration files
- ⏳ Fix map initialization
- ⏳ Test core modules

### Phase 2: API Layer
- Create API service modules for each entity
- Implement data loading patterns
- Add error handling

### Phase 3: UI Components
- Modal builders
- Form handlers
- Data tables
- Map components

### Phase 4: Integration
- Refactor station.html to use new modules
- Remove hardcoded configurations
- Migrate to configuration-driven modals

## Development Guidelines

1. **Never hardcode values** - Use ConfigLoader
2. **Use state management** - AppState for global state
3. **Validate all inputs** - Use Validators module
4. **Show user feedback** - Use Toast notifications
5. **Handle errors gracefully** - Use centralized messages
6. **Document code** - JSDoc comments
7. **Test in browser** - All modules are browser-compatible

## Testing

Test modules in browser console:

```javascript
// Test config loader
await ConfigLoader.get('instruments/phenocam');

// Test state
AppState.set('test', 'value');
console.log(AppState.get('test'));

// Test API
await APIClient.get('/api/stations');

// Test validators
Validators.latitude(64.256);

// Test toast
Toast.success('Test message');
```

## Migration Strategy

1. Create YAML configs for all entities
2. Build new modules alongside existing code
3. Test each module independently
4. Refactor pages incrementally
5. Remove old code once migrated

---

**Last Updated:** 2025-11-27
**Version:** 8.0.0
**Status:** Phase 1 - Foundation Complete
