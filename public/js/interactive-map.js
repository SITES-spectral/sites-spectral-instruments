/**
 * Interactive Map for SITES Spectral Stations
 * Uses Leaflet.js with satellite and topographic tiles
 */

class InteractiveMap {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.stationsData = [];
        this.platformsData = [];
        this.currentLayer = null;
        this.markersGroup = L.layerGroup();
        
        // Map layer definitions
        this.mapLayers = {
            satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
                maxZoom: 18
            }),
            topographic: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), (c) OpenStreetMap contributors, and the GIS User Community',
                maxZoom: 18
            }),
            openstreetmap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            })
        };
        
        this.init();
    }
    
    async init() {
        try {
            console.log('InteractiveMap: Starting initialization...');
            await this.loadStationsData();
            console.log(`InteractiveMap: Loaded ${this.stationsData.length} stations and ${this.platformsData.length} platforms`);
            
            this.initializeMap();
            console.log('InteractiveMap: Map initialization started');
            
        } catch (error) {
            console.error('Failed to initialize interactive map:', error);
            this.showError('Failed to load map data: ' + error.message);
        }
    }
    
    finishInitialization() {
        try {
            this.addStationsToMap();
            console.log('InteractiveMap: Stations added to map');
            
            this.setupControls();
            console.log('InteractiveMap: Controls setup complete');
            
            this.hideLoading();
            console.log('InteractiveMap: Initialization complete');
        } catch (error) {
            console.error('InteractiveMap: Failed to complete initialization:', error);
            this.showError('Failed to complete map setup: ' + error.message);
        }
    }
    
    async loadStationsData() {
        try {
            // Load GeoJSON data for both stations and platforms
            console.log('InteractiveMap: Fetching GeoJSON data from /api/geojson/all...');
            const geoJsonResponse = await fetch('/api/geojson/all?include_instruments=true');
            
            if (!geoJsonResponse.ok) {
                throw new Error(`API request failed: ${geoJsonResponse.status} ${geoJsonResponse.statusText}`);
            }
            
            const geoJsonData = await geoJsonResponse.json();
            console.log('InteractiveMap: Received GeoJSON data:', geoJsonData);
            
            // Separate stations and platforms from GeoJSON features
            this.stationsData = [];
            this.platformsData = [];
            
            if (geoJsonData.features) {
                geoJsonData.features.forEach(feature => {
                    if (feature.properties.type === 'station') {
                        this.stationsData.push({
                            id: feature.properties.id,
                            display_name: feature.properties.name,
                            normalized_name: feature.properties.normalized_name,
                            acronym: feature.properties.acronym,
                            latitude: feature.geometry.coordinates[1],
                            longitude: feature.geometry.coordinates[0],
                            elevation_m: feature.properties.elevation_m,
                            ecosystem: feature.properties.ecosystem,
                            station_type: feature.properties.station_type,
                            instrument_count: feature.properties.instrument_count,
                            active_instruments: feature.properties.active_instruments,
                            ...feature.properties
                        });
                    } else if (feature.properties.type === 'platform') {
                        this.platformsData.push({
                            id: feature.properties.id,
                            platform_id: feature.properties.platform_id,
                            name: feature.properties.name,
                            type: feature.properties.platform_type,
                            latitude: feature.geometry.coordinates[1],
                            longitude: feature.geometry.coordinates[0],
                            platform_height_m: feature.properties.platform_height_m,
                            station_id: feature.properties.station_id,
                            thematic_program: feature.properties.thematic_program,
                            status: feature.properties.status,
                            ...feature.properties
                        });
                    }
                });
            }
            
        } catch (error) {
            console.error('Failed to load map data:', error);
            throw error;
        }
    }
    
    initializeMap() {
        // Check if map is already initialized
        if (this.map) {
            console.log('InteractiveMap: Map already initialized, skipping...');
            return;
        }
        
        // Check if container already has a Leaflet map
        const container = document.getElementById(this.containerId);
        if (!container) {
            throw new Error(`Map container '${this.containerId}' not found`);
        }
        
        // Remove any existing Leaflet map instance from the container
        if (container._leaflet_id) {
            console.log('InteractiveMap: Clearing existing Leaflet instance...');
            // Remove the existing map instance if it exists
            if (window[this.containerId + '_map']) {
                window[this.containerId + '_map'].remove();
                delete window[this.containerId + '_map'];
            }
            delete container._leaflet_id;
            container.innerHTML = '';
        }
        
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
            try {
                console.log('InteractiveMap: Creating new Leaflet map instance...');
                this.map = L.map(this.containerId, {
                    center: [62.0, 15.0], // Approximate center of Sweden
                    zoom: 6,
                    zoomControl: true
                });
                
                // Store map reference to prevent duplicate initialization
                window[this.containerId + '_map'] = this.map;
                
                // Continue with the rest of initialization
                this.completeMapSetup();
                this.finishInitialization();
            } catch (error) {
                console.error('InteractiveMap: Failed to initialize map:', error);
                this.showError('Failed to initialize map: ' + error.message);
            }
        }, 100);
    }
    
    completeMapSetup() {
        // Add default satellite layer
        this.currentLayer = this.mapLayers.satellite;
        this.currentLayer.addTo(this.map);
        
        // Add markers group to map
        this.markersGroup.addTo(this.map);
        
        // Add scale control
        L.control.scale({
            metric: true,
            imperial: false,
            position: 'bottomright'
        }).addTo(this.map);
    }
    
    addStationsToMap() {
        console.log(`InteractiveMap: Adding ${this.stationsData.length} stations and ${this.platformsData.length} platforms to map`);
        
        // Clear existing markers
        this.markersGroup.clearLayers();
        
        let stationMarkersAdded = 0;
        let platformMarkersAdded = 0;
        
        // Add station markers
        this.stationsData.forEach(station => {
            console.log(`InteractiveMap: Processing station ${station.display_name} at ${station.latitude}, ${station.longitude}`);
            if (station.latitude && station.longitude) {
                const stationMarker = this.createStationMarker(station);
                this.markersGroup.addLayer(stationMarker);
                stationMarkersAdded++;
                
                // Add platform markers for this station
                const stationPlatforms = this.platformsData.filter(p => p.station_id === station.id);
                console.log(`InteractiveMap: Found ${stationPlatforms.length} platforms for station ${station.display_name}`);
                stationPlatforms.forEach(platform => {
                    if (platform.latitude && platform.longitude) {
                        const platformMarker = this.createPlatformMarker(platform, station);
                        this.markersGroup.addLayer(platformMarker);
                        platformMarkersAdded++;
                    }
                });
            }
        });
        
        console.log(`InteractiveMap: Added ${stationMarkersAdded} station markers and ${platformMarkersAdded} platform markers`);
        
        // Auto-fit bounds if we have stations
        if (this.stationsData.length > 0 && stationMarkersAdded > 0) {
            try {
                const bounds = this.markersGroup.getBounds();
                console.log(`InteractiveMap: Marker bounds:`, bounds);
                if (bounds.isValid()) {
                    console.log(`InteractiveMap: Fitting map to bounds`);
                    this.map.fitBounds(bounds, { padding: [20, 20] });
                } else {
                    console.warn('InteractiveMap: Bounds are not valid');
                }
            } catch (error) {
                console.warn('InteractiveMap: Could not get bounds from markers group:', error);
                // Fallback: center on Sweden
                this.map.setView([62.0, 15.0], 6);
            }
        }
    }
    
    createStationMarker(station) {
        // Google Maps style station icon with red color
        const stationIcon = L.divIcon({
            className: 'google-maps-marker station-marker',
            html: `
                <div class="google-marker-content">
                    <div class="google-marker-pin station-pin">
                        <i class="fas fa-broadcast-tower"></i>
                    </div>
                    <div class="google-marker-shadow"></div>
                </div>
            `,
            iconSize: [32, 45],
            iconAnchor: [16, 45]
        });
        
        const marker = L.marker([station.latitude, station.longitude], {
            icon: stationIcon
        });
        
        // Create popup content
        const popupContent = `
            <div class="map-popup station-popup">
                <h3>${station.display_name}</h3>
                <p><strong>Acronym:</strong> ${station.acronym}</p>
                <p><strong>Type:</strong> ${station.station_type || 'Research Station'}</p>
                <p><strong>Ecosystem:</strong> ${station.ecosystem || 'N/A'}</p>
                <p><strong>Elevation:</strong> ${station.elevation_m ? station.elevation_m + 'm' : 'N/A'}</p>
                <div class="popup-actions">
                    <button onclick="window.location.href='/station/dashboard.html?station=${station.id}'" class="btn btn-primary btn-sm">
                        <i class="fas fa-cog"></i> Manage Station
                    </button>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
        });
        
        return marker;
    }
    
    createPlatformMarker(platform, station) {
        // Platform type icons
        const typeIcons = {
            tower: 'fas fa-tower-broadcast',
            mast: 'fas fa-radio',
            building: 'fas fa-building',
            ground: 'fas fa-circle',
            phenocam: 'fas fa-camera',
            mspectral_sensor: 'fas fa-eye',
            multispectral_sensor: 'fas fa-eye'
        };
        
        // Google Maps style platform icon with blue color
        const platformIcon = L.divIcon({
            className: 'google-maps-marker platform-marker',
            html: `
                <div class="google-marker-content">
                    <div class="google-marker-pin platform-pin">
                        <i class="${typeIcons[platform.type] || 'fas fa-circle'}"></i>
                    </div>
                    <div class="google-marker-shadow"></div>
                </div>
            `,
            iconSize: [28, 40],
            iconAnchor: [14, 40]
        });
        
        const marker = L.marker([platform.latitude, platform.longitude], {
            icon: platformIcon
        });
        
        // Create popup content
        const popupContent = `
            <div class="map-popup platform-popup">
                <h4>${platform.name}</h4>
                <p><strong>Station:</strong> ${platform.station_name || station?.display_name || 'Unknown'}</p>
                <p><strong>Platform ID:</strong> ${platform.platform_id}</p>
                <p><strong>Type:</strong> ${platform.type}</p>
                <p><strong>Height:</strong> ${platform.platform_height_m ? platform.platform_height_m + 'm' : 'N/A'}</p>
                <p><strong>Status:</strong> 
                    <span class="status-badge ${(platform.status || '').toLowerCase()}">
                        ${platform.status || 'Unknown'}
                    </span>
                </p>
                <p><strong>Program:</strong> 
                    <span class="program-badge ${(platform.thematic_program || '').toLowerCase().replace('_', '-')}">
                        ${platform.thematic_program || 'SITES_Spectral'}
                    </span>
                </p>
                <div class="popup-actions">
                    <button onclick="window.location.href='/station/dashboard.html?station=${platform.station_id}&platform=${platform.id}'" class="btn btn-secondary btn-sm">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
        });
        
        return marker;
    }
    
    setupControls() {
        // Layer control
        const layerControls = document.querySelectorAll('input[name="map-layer"]');
        layerControls.forEach(control => {
            control.addEventListener('change', (e) => {
                this.switchLayer(e.target.value);
            });
        });
    }
    
    switchLayer(layerName) {
        if (this.currentLayer) {
            this.map.removeLayer(this.currentLayer);
        }
        
        this.currentLayer = this.mapLayers[layerName];
        this.currentLayer.addTo(this.map);
    }
    
    hideLoading() {
        const loadingDiv = document.querySelector('.map-loading');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }
    
    showError(message) {
        const mapContainer = document.getElementById(this.containerId);
        mapContainer.innerHTML = `
            <div class="map-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('stations-map')) {
        // Check if this is the main dashboard page (which has dashboard.js)
        const isDashboardPage = document.querySelector('#stations-grid') !== null;
        if (!isDashboardPage) {
            console.log('InteractiveMap: Standalone initialization (not dashboard page)');
            new InteractiveMap('stations-map');
        } else {
            console.log('InteractiveMap: Dashboard page detected, skipping standalone init');
        }
    }
});