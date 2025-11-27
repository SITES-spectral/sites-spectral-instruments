# Map System Migration Guide - v7.x to v8.0

## Overview

SITES Spectral v8.0 introduces a completely refactored map system with modular architecture, enhanced error handling, GeoJSON support, and improved performance. This guide helps you migrate from the v7.x monolithic map system to the new modular v8.0 system.

## What's New in v8.0

### 1. Modular Architecture
- **Separated Concerns**: Map functionality split into focused modules
- **Configuration-Driven**: Centralized settings in `map-config.js`
- **Easier Testing**: Each module can be tested independently
- **Better Maintainability**: Changes to one module don't affect others

### 2. Enhanced Error Handling
- **CORS Support**: All tile layers have `crossOrigin: 'anonymous'`
- **Error Tile Fallback**: Failed tiles show gray error tiles instead of broken images
- **Graceful Degradation**: Map continues functioning even if some tiles fail
- **User-Friendly Messages**: Clear error messages in console and UI

### 3. GeoJSON Support
- **AOI Rendering**: Area of Interest polygon visualization
- **ROI Boundaries**: Region of Interest polygon support
- **Custom Styling**: Per-layer style configuration
- **Interactive Features**: Hover highlighting, popups, tooltips
- **Layer Management**: Toggle, add, remove GeoJSON layers dynamically

### 4. Improved Marker System
- **Type-Specific Icons**: Different icons for each instrument type
- **Clustering Support**: Optional marker clustering for dense datasets
- **Better Popups**: Enhanced popup content with status badges
- **Performance**: Efficient rendering for large marker sets

### 5. Swedish Coordinate System
- **SWEREF 99 TM**: Built-in support for Swedish coordinate systems
- **Validation**: Automatic coordinate validation against Sweden bounds
- **Web Mercator Compatibility**: Seamless integration with Leaflet

## File Structure Changes

### Old Structure (v7.x)
```
public/js/
└── interactive-map.js  (15KB monolithic file)
```

### New Structure (v8.0)
```
public/js/
├── core/
│   └── map-config.js           # Configuration
└── map/
    ├── map-controller.js       # Main orchestrator
    ├── tile-layers.js          # Tile layer management
    ├── markers.js              # Marker management
    ├── geojson-layer.js        # GeoJSON rendering
    ├── map-integration.js      # Backward compatibility
    └── README.md               # Documentation
```

## Migration Steps

### Step 1: Update HTML Includes

**Old (v7.x):**
```html
<script src="/js/interactive-map.js"></script>
```

**New (v8.0):**
```html
<!-- Map System v8.0 -->
<script src="/js/core/map-config.js"></script>
<script src="/js/map/tile-layers.js"></script>
<script src="/js/map/markers.js"></script>
<script src="/js/map/geojson-layer.js"></script>
<script src="/js/map/map-controller.js"></script>
<script src="/js/map/map-integration.js"></script>
```

### Step 2: Update Initialization Code

**Option A: Keep Old API (Backward Compatible)**

No code changes needed! The old API still works:

```javascript
// This still works in v8.0
const map = initializeMap('map-container', { zoom: 8 });
addStationMarker(map, 64.256, 19.775, stationData);
addPlatformMarkers(map, platforms, stationCoords);
```

**Option B: Use New API (Recommended)**

Migrate to the new modular API for better features:

```javascript
// Create map controller
const mapController = new MapController('map-container');

// Initialize map
await mapController.initialize({
    center: [64.256, 19.775],
    zoom: 8,
    defaultLayer: 'osm'
});

// Add markers
mapController.addStationMarker(64.256, 19.775, stationData);
mapController.addPlatformMarkers(platforms);
```

### Step 3: Update Marker Management

**Old API:**
```javascript
// Add platforms with station fallback
addPlatformMarkers(map, platforms, { lat: 64.256, lng: 19.775 });

// Clear platforms
clearPlatformMarkers(map);
```

**New API:**
```javascript
// Add platforms (handles missing coordinates automatically)
mapController.addPlatformMarkers(platforms, {
    cluster: true  // Optional clustering
});

// Clear specific marker type
mapController.clearMarkers('platform');

// Clear all markers
mapController.clearAllMarkers();
```

### Step 4: Add GeoJSON Support (New Feature)

```javascript
// Add AOI polygon
const aoiData = {
    type: 'Feature',
    geometry: {
        type: 'Polygon',
        coordinates: [[ /* coordinates */ ]]
    },
    properties: {
        name: 'Station AOI',
        description: 'Area of Interest'
    }
};

mapController.addGeoJSONLayer(aoiData, {
    styleType: 'aoi',
    highlightOnHover: true
});

// Add ROI layers from database
mapController.addROILayers(rois, {
    highlightOnHover: true,
    showTooltip: true
});
```

### Step 5: Update Event Handling

**Old API:**
```javascript
map.on('zoomend', function() {
    console.log('Zoom changed');
});
```

**New API:**
```javascript
// Use controller events
mapController.on('zoom', (data) => {
    console.log('Zoom changed to:', data.zoom);
});

// Or use global events
window.addEventListener('map:zoom', (e) => {
    console.log('Zoom:', e.detail.zoom);
});
```

## API Comparison

### Map Initialization

| Old API (v7.x) | New API (v8.0) | Notes |
|----------------|----------------|-------|
| `initializeMap(id, opts)` | `new MapController(id).initialize(opts)` | Returns Promise |
| `window.sitesMap` | `mapController` | Instance-based |

### Marker Management

| Old API (v7.x) | New API (v8.0) | Notes |
|----------------|----------------|-------|
| `addStationMarker(map, lat, lng, data)` | `addStationMarker(lat, lng, data)` | No map parameter |
| `addPlatformMarkers(map, platforms, coords)` | `addPlatformMarkers(platforms, opts)` | Options object |
| `clearPlatformMarkers(map)` | `clearMarkers('platform')` | Type-based |
| `addInstrumentMarkers(map, instruments)` | `addInstrumentMarkers(instruments, opts)` | Options support |

### Map Control

| Old API (v7.x) | New API (v8.0) | Notes |
|----------------|----------------|-------|
| `centerMapOnCoordinates(map, lat, lng, z)` | `centerOn(lat, lng, z)` | Shorter name |
| `fitToMarkers(map, markers)` | `fitToMarkers(type, opts)` | Type-based |
| `invalidateSize(id)` | `invalidateSize()` | No ID needed |

### New Features (v8.0 Only)

| Feature | API | Description |
|---------|-----|-------------|
| GeoJSON | `addGeoJSONLayer(data, opts)` | Add GeoJSON polygons |
| ROI | `addROILayers(rois, opts)` | Add ROI boundaries |
| Layer Switch | `switchBaseLayer(key)` | Change base layer |
| Clustering | `addMarkers(items, type, cluster=true)` | Enable clustering |
| Events | `on(event, callback)` | Event listeners |

## Configuration Changes

### Old Configuration (v7.x)

Configuration was hardcoded in `interactive-map.js`:
```javascript
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
});
```

### New Configuration (v8.0)

Centralized in `map-config.js`:
```javascript
// Edit map-config.js to customize
this.tileLayers = {
    osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            crossOrigin: 'anonymous',
            errorTileUrl: this.getErrorTileUrl()
        }
    }
};
```

## Breaking Changes

### 1. Async Initialization

Map initialization is now async:

**Old:**
```javascript
const map = initializeMap('map-container');
// Use map immediately
```

**New:**
```javascript
const controller = new MapController('map-container');
const map = await controller.initialize();
// Or use callbacks
controller.initialize().then(map => {
    // Use map here
});
```

### 2. Method Signatures

Some methods have simplified signatures:

**Old:**
```javascript
centerMapOnCoordinates(map, lat, lng, zoom);
```

**New:**
```javascript
mapController.centerOn(lat, lng, zoom);
```

### 3. Marker Storage

Markers are now managed by the controller:

**Old:**
```javascript
const marker = createStationMarker(lat, lng, data);
marker.addTo(map);
// Manually track marker
```

**New:**
```javascript
const marker = mapController.addStationMarker(lat, lng, data);
// Controller tracks marker automatically
```

## Benefits of Migration

### 1. Better Performance
- Efficient marker clustering
- Lazy loading of GeoJSON
- Optimized tile loading with error handling

### 2. Enhanced Features
- GeoJSON polygon support
- ROI visualization
- Multiple base layer options
- Event system

### 3. Easier Maintenance
- Modular code structure
- Centralized configuration
- Better error messages
- Comprehensive documentation

### 4. Future-Proof
- Plugin architecture ready
- Easy to add new features
- Better testing support
- TypeScript migration ready

## Testing Your Migration

### 1. Visual Testing

Test these scenarios:
- [ ] Map loads with default layer
- [ ] Station markers appear correctly
- [ ] Platform markers render with proper icons
- [ ] Instrument markers show type-specific icons
- [ ] Popups display correct information
- [ ] Base layer switching works
- [ ] Zoom and pan function smoothly

### 2. Error Handling Testing

Test error scenarios:
- [ ] Network disconnection (tiles fail gracefully)
- [ ] Invalid coordinates (warning but no crash)
- [ ] Missing container (error message shown)
- [ ] Malformed GeoJSON (error logged)

### 3. Performance Testing

Test with realistic data:
- [ ] 100+ markers render smoothly
- [ ] Clustering works for dense areas
- [ ] Large GeoJSON polygons render
- [ ] Layer switching is responsive
- [ ] Map resizing works correctly

## Rollback Plan

If you encounter issues, you can rollback:

1. **Restore old file:**
   ```bash
   git checkout v7.x -- public/js/interactive-map.js
   ```

2. **Update HTML:**
   ```html
   <script src="/js/interactive-map.js"></script>
   ```

3. **Report issue with:**
   - Browser console errors
   - Network tab (failed requests)
   - Steps to reproduce

## Support Resources

- **Demo Page**: `/map-demo.html`
- **Documentation**: `/js/map/README.md`
- **API Reference**: JSDoc comments in source files
- **Example Code**: See `map-demo.html` for working examples

## Common Migration Issues

### Issue: Map not showing

**Symptoms:** Blank container, no errors

**Solution:**
```javascript
// Ensure container has height
#map { height: 600px; }

// Check initialization
mapController.initialize().then(() => {
    console.log('Map initialized');
}).catch(err => {
    console.error('Init failed:', err);
});
```

### Issue: Tiles not loading

**Symptoms:** Gray error tiles, CORS errors

**Solution:**
- Check network connectivity
- Verify tile server is accessible
- CORS is now handled automatically in v8.0

### Issue: Markers not appearing

**Symptoms:** No markers visible, no errors

**Solution:**
```javascript
// Verify coordinates are valid
console.log('Valid?', mapConfig.isValidSwedishCoordinate(lat, lng));

// Check map is initialized
if (mapController.isInitialized()) {
    mapController.addStationMarker(lat, lng, data);
}
```

### Issue: GeoJSON not rendering

**Symptoms:** No polygons visible

**Solution:**
```javascript
// Validate GeoJSON format
console.log('GeoJSON:', JSON.stringify(data, null, 2));

// Check coordinate order (GeoJSON uses [lng, lat])
const geojson = {
    type: 'Feature',
    geometry: {
        type: 'Polygon',
        coordinates: [[
            [lng1, lat1], // Correct: [lng, lat]
            [lng2, lat2],
            [lng3, lat3]
        ]]
    }
};
```

## Gradual Migration Strategy

You don't have to migrate everything at once:

### Phase 1: Install New System (Week 1)
- Add new script files
- Keep old API usage
- Test basic functionality

### Phase 2: Migrate Map Initialization (Week 2)
- Update map creation code
- Migrate to `MapController`
- Test all existing features

### Phase 3: Add New Features (Week 3)
- Implement GeoJSON support
- Add ROI visualization
- Enable marker clustering

### Phase 4: Cleanup (Week 4)
- Remove backward compatibility layer
- Update documentation
- Remove old code references

## Conclusion

The v8.0 map system provides significant improvements in functionality, performance, and maintainability. While migration requires some code changes, the backward compatibility layer allows for gradual migration with minimal disruption.

For questions or issues, consult the documentation in `/js/map/README.md` or contact the SITES Spectral development team.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**Author:** SITES Spectral Team
