# Location Map Reuse Guide

This guide explains how to reuse the interactive location map from the contact.html page in other projects.

## Overview

The location map is implemented using Leaflet.js and displays two locations in Lund, Sweden:
- **IDEON Science Park** (Scheelevägen 15, Alfa 3, 223 70 Lund)
- **LU Innovation X-lab** (Ole Römers väg 1, 223 63 Lund)

## Dependencies

### CSS
```html
<!-- Leaflet Map CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
      crossorigin="" />
```

### JavaScript
```html
<!-- Leaflet Map JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" 
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" 
        crossorigin=""></script>
```

## HTML Structure

### Basic Map Container
```html
<!-- Map container with styling -->
<div class="bg-gray-800 rounded-lg overflow-hidden" style="position: relative; z-index: 1;">
    <div id="map" class="w-full h-96"></div>
</div>
```

### Z-index Fix for Modal Compatibility
```html
<style>
    .leaflet-container {
        z-index: 1 !important;
    }
    .leaflet-control {
        z-index: 2 !important;
    }
    .leaflet-pane {
        z-index: 1 !important;
    }
    .leaflet-top,
    .leaflet-bottom {
        z-index: 2 !important;
    }
    /* Ensure modal is always on top */
    #pilot-modal {
        z-index: 9999 !important;
    }
</style>
```

## JavaScript Implementation

### Complete Map Initialization Code
```javascript
document.addEventListener('DOMContentLoaded', function() {
    // IDEON Science Park coordinates - Agora building
    const ideonLat = 55.7113235;
    const ideonLng = 13.2149735;
    
    // LU Innovation X-lab coordinates - Ole Römers väg 1
    const xlabLat = 55.7099297;
    const xlabLng = 13.2108534;
    
    // Initialize the map - center between both locations
    const centerLat = (ideonLat + xlabLat) / 2;
    const centerLng = (ideonLng + xlabLng) / 2;
    const map = L.map('map').setView([centerLat, centerLng], 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add marker for IDEON Science Park
    const ideonMarker = L.marker([ideonLat, ideonLng]).addTo(map);
    
    // Add popup with address information for IDEON
    ideonMarker.bindPopup(`
        <div class="text-center">
            <h3 class="font-bold text-gray-900 mb-2">Flights for Biodiversity Sweden</h3>
            <p class="text-gray-700 mb-1"><strong>IDEON Agora Alfa 3</strong></p>
            <p class="text-gray-700 mb-1">Scheelevägen 15</p>
            <p class="text-gray-700">223 70 Lund, Sweden</p>
        </div>
    `).openPopup();
    
    // Add marker for LU Innovation X-lab
    const xlabMarker = L.marker([xlabLat, xlabLng]).addTo(map);
    
    // Add popup with address information for X-lab
    xlabMarker.bindPopup(`
        <div class="text-center">
            <h3 class="font-bold text-gray-900 mb-2">LU Innovation</h3>
            <p class="text-gray-700 mb-1"><strong>X-lab Building</strong></p>
            <p class="text-gray-700 mb-1">Ole Römers väg 1</p>
            <p class="text-gray-700">223 63 Lund, Sweden</p>
        </div>
    `);
    
    // Fit map to show both markers
    const group = new L.featureGroup([ideonMarker, xlabMarker]);
    map.fitBounds(group.getBounds().pad(0.1));
});
```

## Customization Options

### Single Location Map
For a single location, use this simplified version:
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const lat = 55.7113235;  // Your latitude
    const lng = 13.2149735;  // Your longitude
    
    const map = L.map('map').setView([lat, lng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`
        <div class="text-center">
            <h3 class="font-bold text-gray-900 mb-2">Your Company Name</h3>
            <p class="text-gray-700 mb-1">Your Address</p>
            <p class="text-gray-700">City, Postal Code, Country</p>
        </div>
    `).openPopup();
});
```

### Different Map Providers
Replace the tile layer with alternatives:
```javascript
// Satellite imagery (requires API key)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri'
}).addTo(map);

// Dark theme
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CartoDB'
}).addTo(map);
```

### Custom Marker Icons
```javascript
const customIcon = L.icon({
    iconUrl: 'path/to/your/marker-icon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

const marker = L.marker([lat, lng], {icon: customIcon}).addTo(map);
```

## Integration Steps

1. **Add Dependencies**: Include Leaflet CSS and JS files in your HTML head
2. **Add HTML Container**: Create a div with id="map" and appropriate styling
3. **Add CSS Fixes**: Include the z-index styles if using with modals
4. **Initialize Map**: Add the JavaScript code within DOMContentLoaded event
5. **Customize**: Update coordinates, popup content, and styling as needed

## Styling Notes

- The map uses Tailwind CSS classes (`bg-gray-800`, `rounded-lg`, etc.)
- Height is set to `h-96` (24rem/384px)
- The container has `position: relative; z-index: 1;` for modal compatibility
- Popup content uses Tailwind typography classes for consistent styling

## Coordinates Reference

- **IDEON Science Park**: 55.7113235, 13.2149735
- **LU Innovation X-lab**: 55.7099297, 13.2108534
- **Lund Center**: ~55.7058, 13.1930

To find coordinates for new locations, use tools like:
- [LatLong.net](https://www.latlong.net/)
- Google Maps (right-click → coordinates)
- OpenStreetMap (right-click → show address)