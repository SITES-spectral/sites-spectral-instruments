# SITES Spectral - Map System v8.0

Modular, production-ready map implementation with error handling, GeoJSON support, and Swedish coordinate validation.

## Architecture

```
map/
├── map-controller.js      # Main orchestrator
├── tile-layers.js         # Tile layer management with error handling
├── markers.js             # Station/platform/instrument markers
├── geojson-layer.js       # GeoJSON polygon rendering (AOI/ROI)
├── map-integration.js     # Backward compatibility layer
└── README.md              # This file

core/
└── map-config.js          # Centralized configuration
```

## Features

### 1. Error Handling
- CORS-enabled tile layers (`crossOrigin: 'anonymous'`)
- Graceful fallback for failed tiles
- Error tile rendering
- Console logging with spam prevention
- User-friendly error messages

### 2. GeoJSON Support
- AOI polygon rendering
- ROI boundary visualization
- Custom styling per layer
- Popup and tooltip support
- Layer toggling

### 3. Marker Management
- Station markers (green broadcast tower)
- Platform markers (blue building)
- Instrument type-specific markers:
  - Phenocam (orange camera)
  - Multispectral (purple satellite dish)
  - PAR Sensor (orange sun)
  - NDVI Sensor (green leaf)
  - PRI Sensor (cyan microscope)
  - Hyperspectral (pink rainbow)
- Marker clustering support (optional)

### 4. Swedish Coordinate System
- SWEREF 99 TM support
- Coordinate validation (Sweden bounds)
- Web Mercator projection for Leaflet compatibility

### 5. Configuration-Driven
- No hardcoded URLs
- Centralized settings in `map-config.js`
- Environment-based configuration
- Easy customization

## Usage

### Basic Initialization

```javascript
// Load required files in order:
<script src="/js/core/map-config.js"></script>
<script src="/js/map/tile-layers.js"></script>
<script src="/js/map/markers.js"></script>
<script src="/js/map/geojson-layer.js"></script>
<script src="/js/map/map-controller.js"></script>
<script src="/js/map/map-integration.js"></script>

// Initialize map
const mapController = new MapController('map-container');
await mapController.initialize({
    center: [59.8586, 17.6389], // Uppsala, Sweden
    zoom: 8,
    defaultLayer: 'osm' // or 'satellite', 'topographic'
});
```

### Add Station Marker

```javascript
mapController.addStationMarker(64.256, 19.775, {
    id: 'svb',
    acronym: 'SVB',
    display_name: 'Svartberget',
    description: 'Forest research station in northern Sweden',
    latitude: 64.256,
    longitude: 19.775
});
```

### Add Platform Markers

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
    // ... more platforms
];

mapController.addPlatformMarkers(platforms, {
    cluster: true // Enable marker clustering
});
```

### Add GeoJSON Layer (AOI)

```javascript
// From GeoJSON object
const aoiData = {
    type: 'Feature',
    geometry: {
        type: 'Polygon',
        coordinates: [[
            [19.7, 64.2],
            [19.9, 64.2],
            [19.9, 64.3],
            [19.7, 64.3],
            [19.7, 64.2]
        ]]
    },
    properties: {
        name: 'Svartberget AOI',
        description: 'Area of Interest for Svartberget station'
    }
};

mapController.addGeoJSONLayer(aoiData, {
    styleType: 'aoi',
    highlightOnHover: true
});

// From URL
await mapController.loadGeoJSON('/data/aoi/svartberget.geojson', {
    styleType: 'aoi',
    showTooltip: true
});
```

### Add ROI Layers

```javascript
const rois = [
    {
        roi_name: 'ROI_01',
        polygon_points: JSON.stringify([
            [64.255, 19.770],
            [64.255, 19.780],
            [64.260, 19.785],
            [64.260, 19.765]
        ]),
        color: '#059669',
        description: 'Forest canopy ROI'
    }
    // ... more ROIs
];

mapController.addROILayers(rois, {
    highlightOnHover: true,
    showTooltip: true
});
```

### Switch Base Layer

```javascript
// Available layers: 'osm', 'satellite', 'topographic'
mapController.switchBaseLayer('satellite');
```

### Center Map

```javascript
// Center without zoom change
mapController.centerOn(64.256, 19.775);

// Center with zoom
mapController.centerOn(64.256, 19.775, 14);
```

### Fit to Markers

```javascript
// Fit to all platform markers
mapController.fitToMarkers('platform', {
    padding: [50, 50]
});

// Fit to bounds
mapController.fitToBounds([
    [64.2, 19.7], // Southwest
    [64.3, 19.9]  // Northeast
]);
```

### Clear Layers

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

### Event Handling

```javascript
// Listen to map events
mapController.on('zoom', (data) => {
    console.log('Zoom level:', data.zoom);
});

mapController.on('click', (data) => {
    console.log('Clicked at:', data.latlng);
});

mapController.on('layerchange', (data) => {
    console.log('Base layer changed to:', data.layer);
});

// Global events
window.addEventListener('map:initialized', (e) => {
    console.log('Map initialized:', e.detail);
});

window.addEventListener('tileLayer:loading', (e) => {
    console.log('Tiles loading:', e.detail.layerKey);
});
```

## Backward Compatibility

The system provides full backward compatibility with the original `interactive-map.js` API:

```javascript
// Old API (still works)
const map = initializeMap('map-container', { zoom: 8 });
addStationMarker(map, 64.256, 19.775, stationData);
addPlatformMarkers(map, platforms, stationCoords);
clearPlatformMarkers(map);
centerMapOnCoordinates(map, 64.256, 19.775, 10);

// Or use global instance
window.sitesMapV2.initializeMap('map-container');
window.sitesMapV2.addStation(map, lat, lng, data);
```

## Configuration

Edit `/js/core/map-config.js` to customize:

### Tile Layers

```javascript
this.tileLayers = {
    osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
            attribution: '...',
            maxZoom: 19,
            crossOrigin: 'anonymous',
            errorTileUrl: this.getErrorTileUrl()
        }
    }
    // Add more layers...
};
```

### Marker Icons

```javascript
this.markerIcons = {
    station: {
        size: [32, 40],
        anchor: [16, 40],
        popupAnchor: [0, -40],
        color: '#059669',
        icon: 'broadcast-tower'
    }
    // Customize other marker types...
};
```

### GeoJSON Styles

```javascript
this.geojsonStyles = {
    aoi: {
        color: '#059669',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.1
    }
    // Add more styles...
};
```

### Sweden Bounds

```javascript
this.swedenBounds = [10.03, 55.36, 24.17, 69.07]; // [W, S, E, N]
```

## Clustering

Enable marker clustering for dense point datasets:

```javascript
// Requires Leaflet.markercluster plugin
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>

// Then enable clustering
mapController.addPlatformMarkers(platforms, { cluster: true });
```

## Error Handling

The system handles errors gracefully:

1. **Tile Load Errors**: Failed tiles replaced with gray error tiles
2. **CORS Issues**: All tile layers have `crossOrigin: 'anonymous'`
3. **Missing Container**: Shows error message in console
4. **Invalid Coordinates**: Warns but doesn't fail
5. **Network Errors**: Logged with user-friendly messages

## Performance Tips

1. **Use Clustering**: For 50+ markers, enable clustering
2. **Lazy Loading**: Load GeoJSON only when needed
3. **Layer Toggle**: Hide unused layers to improve rendering
4. **Simplify Polygons**: Use simplified GeoJSON for large AOIs
5. **Debounce Events**: Throttle zoom/move event handlers

## Dependencies

- **Leaflet**: v1.9.4+
- **Font Awesome**: v6.0+ (for marker icons)
- **Leaflet.markercluster**: v1.5.3+ (optional, for clustering)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Tiles Not Loading

1. Check CORS: Tile servers must allow cross-origin requests
2. Check network: Use browser DevTools Network tab
3. Check error console: Look for specific error messages

### Markers Not Showing

1. Verify coordinates are valid (within Sweden bounds)
2. Check map is initialized: `mapController.isInitialized()`
3. Verify data has `latitude` and `longitude` properties

### GeoJSON Not Rendering

1. Validate GeoJSON: Use https://geojson.io
2. Check coordinate order: GeoJSON uses [lng, lat], not [lat, lng]
3. Verify layer is added to map: Check browser console

### Map Not Responsive

1. Call `invalidateSize()` after container resize
2. Check container has explicit height in CSS
3. Ensure Leaflet CSS is loaded

## Migration from v7.x

Replace script includes:

```html
<!-- Old -->
<script src="/js/interactive-map.js"></script>

<!-- New -->
<script src="/js/core/map-config.js"></script>
<script src="/js/map/tile-layers.js"></script>
<script src="/js/map/markers.js"></script>
<script src="/js/map/geojson-layer.js"></script>
<script src="/js/map/map-controller.js"></script>
<script src="/js/map/map-integration.js"></script>
```

Update code (optional, backward compatible):

```javascript
// Old API still works
const map = initializeMap('map-container');

// New API recommended
const controller = new MapController('map-container');
await controller.initialize();
```

## License

MIT License - SITES Spectral Team

## Support

For issues, contact the SITES Spectral development team or file an issue in the project repository.
