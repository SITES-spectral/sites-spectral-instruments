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
            console.log('InteractiveMap: Map initialized');
            
            this.addStationsToMap();
            console.log('InteractiveMap: Stations added to map');
            
            this.setupControls();
            console.log('InteractiveMap: Controls setup complete');
            
            this.hideLoading();
            console.log('InteractiveMap: Initialization complete');
        } catch (error) {
            console.error('Failed to initialize interactive map:', error);
            this.showError('Failed to load map data: ' + error.message);
        }
    }
    
    async loadStationsData() {
        try {
            // Load stations data
            const stationsResponse = await fetch('/api/stations');
            const stationsResult = await stationsResponse.json();
            this.stationsData = stationsResult.stations || [];
            
            // Load platforms data
            const platformsResponse = await fetch('/api/platforms');
            const platformsResult = await platformsResponse.json();
            this.platformsData = platformsResult.platforms || [];
            
        } catch (error) {
            console.error('Failed to load map data:', error);
            throw error;
        }
    }
    
    initializeMap() {
        // Initialize map centered on Sweden
        this.map = L.map(this.containerId, {
            center: [62.0, 15.0], // Approximate center of Sweden
            zoom: 6,
            zoomControl: true
        });
        
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
        // Clear existing markers
        this.markersGroup.clearLayers();
        
        // Add station markers
        this.stationsData.forEach(station => {
            if (station.latitude && station.longitude) {
                const stationMarker = this.createStationMarker(station);
                this.markersGroup.addLayer(stationMarker);
                
                // Add platform markers for this station
                const stationPlatforms = this.platformsData.filter(p => p.station_id === station.id);
                stationPlatforms.forEach(platform => {
                    if (platform.latitude && platform.longitude) {
                        const platformMarker = this.createPlatformMarker(platform, station);
                        this.markersGroup.addLayer(platformMarker);
                    }
                });
            }
        });
        
        // Auto-fit bounds if we have stations
        if (this.stationsData.length > 0) {
            const bounds = this.markersGroup.getBounds();
            if (bounds.isValid()) {
                this.map.fitBounds(bounds, { padding: [20, 20] });
            }
        }
    }
    
    createStationMarker(station) {
        // Custom station icon
        const stationIcon = L.divIcon({
            className: 'custom-station-marker',
            html: `
                <div class="marker-icon station-icon">
                    <i class="fas fa-broadcast-tower"></i>
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
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
            ground: 'fas fa-circle'
        };
        
        const platformIcon = L.divIcon({
            className: 'custom-platform-marker',
            html: `
                <div class="marker-icon platform-icon ${platform.type}">
                    <i class="${typeIcons[platform.type] || 'fas fa-circle'}"></i>
                </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        const marker = L.marker([platform.latitude, platform.longitude], {
            icon: platformIcon
        });
        
        // Create popup content
        const popupContent = `
            <div class="map-popup platform-popup">
                <h4>${platform.name}</h4>
                <p><strong>Station:</strong> ${station.display_name}</p>
                <p><strong>Platform ID:</strong> ${platform.platform_id}</p>
                <p><strong>Type:</strong> ${platform.type}</p>
                <p><strong>Height:</strong> ${platform.platform_height_m ? platform.platform_height_m + 'm' : 'N/A'}</p>
                <p><strong>Program:</strong> 
                    <span class="program-badge ${(platform.thematic_program || '').toLowerCase().replace('_', '-')}">
                        ${platform.thematic_program || 'SITES_Spectral'}
                    </span>
                </p>
                <div class="popup-actions">
                    <button onclick="window.location.href='/station/dashboard.html?station=${station.id}&platform=${platform.id}'" class="btn btn-secondary btn-sm">
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
        new InteractiveMap('stations-map');
    }
});