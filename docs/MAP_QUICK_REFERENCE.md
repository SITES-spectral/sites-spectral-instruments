# Map System v8.0 - Quick Reference Card

## Load Order (Required)

```html
<!-- 1. Leaflet -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- 2. Font Awesome (for icons) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

<!-- 3. Map System v8.0 -->
<script src="/js/core/map-config.js"></script>
<script src="/js/map/tile-layers.js"></script>
<script src="/js/map/markers.js"></script>
<script src="/js/map/geojson-layer.js"></script>
<script src="/js/map/map-controller.js"></script>
<script src="/js/map/map-integration.js"></script>

<!-- 4. Optional: Marker Clustering -->
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
```

## Initialize Map

```javascript
// Create controller
const mapController = new MapController('map-container');

// Initialize (async)
await mapController.initialize({
    center: [64.256, 19.775],  // [lat, lng]
    zoom: 10,
    defaultLayer: 'osm'  // 'osm', 'satellite', 'topographic'
});
```

## Add Markers

### Station
```javascript
mapController.addStationMarker(64.256, 19.775, {
    id: 'svb',
    acronym: 'SVB',
    display_name: 'Svartberget',
    description: 'Forest research station',
    latitude: 64.256,
    longitude: 19.775
});
```

### Platforms
```javascript
const platforms = [
    {
        id: 'svb-for-pl01',
        normalized_name: 'SVB_FOR_PL01',
        display_name: 'Svartberget Forest Platform 01',
        ecosystem_code: 'FOR',
        latitude: 64.256,
        longitude: 19.775,
        instrument_count: 5
    }
];

mapController.addPlatformMarkers(platforms, {
    cluster: true  // Enable clustering
});
```

### Instruments
```javascript
const instruments = [
    {
        id: 1,
        normalized_name: 'SVB_FOR_PL01_PHE01',
        instrument_type: 'phenocam',  // phenocam, multispectral, par, ndvi, pri, hyperspectral
        status: 'active',
        latitude: 64.256,
        longitude: 19.775
    }
];

mapController.addInstrumentMarkers(instruments);
```

## GeoJSON Layers

### Add AOI Polygon
```javascript
const aoiData = {
    type: 'Feature',
    geometry: {
        type: 'Polygon',
        coordinates: [[
            [19.70, 64.20],  // [lng, lat] - NOTE: GeoJSON order!
            [19.85, 64.20],
            [19.85, 64.30],
            [19.70, 64.30],
            [19.70, 64.20]
        ]]
    },
    properties: {
        name: 'Svartberget AOI',
        description: 'Area of Interest'
    }
};

mapController.addGeoJSONLayer(aoiData, {
    styleType: 'aoi',
    highlightOnHover: true,
    showTooltip: true
});
```

### Add ROI Layers
```javascript
const rois = [
    {
        roi_name: 'ROI_01',
        polygon_points: JSON.stringify([
            [64.255, 19.770],  // [lat, lng] - NOTE: ROI uses [lat, lng]
            [64.255, 19.780],
            [64.260, 19.785],
            [64.260, 19.765]
        ]),
        color: '#059669',
        description: 'Forest canopy ROI'
    }
];

mapController.addROILayers(rois, {
    highlightOnHover: true,
    showTooltip: true
});
```

### Load from URL
```javascript
await mapController.loadGeoJSON('/data/aoi.geojson', {
    styleType: 'aoi',
    addToMap: true
});
```

## Map Control

```javascript
// Center map
mapController.centerOn(64.256, 19.775, 12);  // lat, lng, zoom

// Fit to markers
mapController.fitToMarkers('platform', { padding: [50, 50] });

// Fit to bounds
mapController.fitToBounds([
    [64.20, 19.70],  // Southwest [lat, lng]
    [64.30, 19.85]   // Northeast [lat, lng]
]);

// Switch base layer
mapController.switchBaseLayer('satellite');  // 'osm', 'satellite', 'topographic'

// Invalidate size (after resize)
mapController.invalidateSize();
```

## Clear Layers

```javascript
// Clear specific marker type
mapController.clearMarkers('platform');

// Clear all markers
mapController.clearAllMarkers();

// Clear GeoJSON layers
mapController.clearGeoJSONLayers();

// Clear specific GeoJSON group
mapController.clearGeoJSONLayers('rois');
```

## Events

```javascript
// Listen to events
mapController.on('zoom', (data) => {
    console.log('Zoom level:', data.zoom);
});

mapController.on('click', (data) => {
    console.log('Clicked at:', data.latlng);
});

mapController.on('layerchange', (data) => {
    console.log('Base layer:', data.layer);
});

// Global events
window.addEventListener('map:initialized', (e) => {
    console.log('Map ready:', e.detail);
});
```

## State Access

```javascript
const bounds = mapController.getBounds();
const center = mapController.getCenter();
const zoom = mapController.getZoom();
const map = mapController.getMap();  // Get raw Leaflet map
const ready = mapController.isInitialized();
```

## Backward Compatibility

```javascript
// Old API still works
const map = initializeMap('map-container');
addStationMarker(map, 64.256, 19.775, data);
addPlatformMarkers(map, platforms, stationCoords);
clearPlatformMarkers(map);
```

## Configuration

Edit `/js/core/map-config.js`:

```javascript
// Default center and zoom
this.defaults = {
    center: [59.8586, 17.6389],  // Uppsala
    zoom: 8,
    minZoom: 3,
    maxZoom: 18
};

// Tile layers
this.tileLayers = {
    osm: { url: '...', options: {...} }
};

// Marker colors
this.markerIcons = {
    station: { color: '#059669', icon: 'broadcast-tower' }
};

// GeoJSON styles
this.geojsonStyles = {
    aoi: { color: '#059669', weight: 2 }
};
```

## Common Patterns

### Station with Platforms
```javascript
// 1. Initialize map
await mapController.initialize({ center: [64.256, 19.775], zoom: 10 });

// 2. Add station marker
mapController.addStationMarker(64.256, 19.775, stationData);

// 3. Add platform markers
mapController.addPlatformMarkers(platforms);

// 4. Fit to show all
mapController.fitToMarkers('platform');
```

### AOI with ROIs
```javascript
// 1. Add AOI polygon
mapController.addGeoJSONLayer(aoiData, { styleType: 'aoi' });

// 2. Add ROI layers
mapController.addROILayers(rois, { highlightOnHover: true });

// 3. Fit to AOI bounds
mapController.fitToBounds(aoiBounds);
```

### All Instruments at Station
```javascript
// Add all instrument types
const instruments = await fetchInstruments(stationId);
mapController.addInstrumentMarkers(instruments);

// Fit to show all instruments
mapController.fitToMarkers('instrument', { padding: [100, 100] });

// Switch to satellite for better view
mapController.switchBaseLayer('satellite');
```

## Troubleshooting

### Map not showing
```javascript
// Check container has height
#map { height: 600px; }

// Verify initialization
mapController.isInitialized();  // Should be true
```

### Tiles not loading
```javascript
// Check network tab in DevTools
// CORS is handled automatically with crossOrigin: 'anonymous'
```

### Markers not appearing
```javascript
// Verify coordinates
console.log(mapConfig.isValidSwedishCoordinate(lat, lng));

// Check data structure
console.log(JSON.stringify(markerData, null, 2));
```

### GeoJSON not rendering
```javascript
// Validate GeoJSON at https://geojson.io
// Remember: GeoJSON uses [lng, lat], not [lat, lng]
```

## Resources

- **Demo:** `/map-demo.html`
- **Documentation:** `/js/map/README.md`
- **Migration Guide:** `/docs/MAP_MIGRATION_V8.md`
- **Summary:** `/docs/MAP_SYSTEM_V8_SUMMARY.md`

## Support

For issues, check:
1. Browser console for errors
2. Network tab for failed requests
3. Documentation in `/js/map/README.md`
4. Demo page at `/map-demo.html`

---

**Version:** 8.0.0
**Last Updated:** 2025-11-27
**Author:** SITES Spectral Team
