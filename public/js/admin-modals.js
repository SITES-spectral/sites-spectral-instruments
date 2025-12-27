// SITES Spectral v5.0.0 - Admin CRUD Modal Components
// Specialized modal components for admin station and platform management

// Admin Station Creation Modal
class AdminStationCreateModal extends FormModal {
    constructor(config = {}) {
        super({
            id: 'admin-create-station-modal',
            title: 'Create New Research Station',
            size: 'lg',
            type: 'admin',
            requiredPermissions: ['admin'],
            swedishContext: true,
            destroyOnClose: true,
            ...config,
            fields: [
                {
                    name: 'display_name',
                    type: 'text',
                    label: 'Station Display Name',
                    placeholder: 'e.g., New Research Station',
                    required: true,
                    hint: 'Official name as it appears in publications'
                },
                {
                    name: 'acronym',
                    type: 'text',
                    label: 'Station Acronym',
                    placeholder: 'e.g., NRS',
                    required: true,
                    hint: '2-5 character identifier for maps and data',
                    validation: (value) => {
                        if (!/^[A-Z]{2,5}$/.test(value)) {
                            return 'Acronym must be 2-5 uppercase letters';
                        }
                        return true;
                    }
                },
                {
                    name: 'normalized_name',
                    type: 'text',
                    label: 'Normalized Name',
                    placeholder: 'Auto-generated from display name',
                    required: true,
                    hint: 'System identifier (lowercase, no spaces)'
                },
                {
                    name: 'country',
                    type: 'text',
                    label: 'Country',
                    defaultValue: 'Sweden',
                    required: true
                },
                {
                    name: 'coordinates',
                    type: 'coordinate',
                    label: 'Station Coordinates',
                    required: false,
                    hint: 'SWEREF 99 coordinate system'
                },
                {
                    name: 'elevation_m',
                    type: 'number',
                    label: 'Elevation (meters)',
                    placeholder: 'e.g., 350',
                    required: false
                },
                {
                    name: 'description',
                    type: 'textarea',
                    label: 'Description',
                    placeholder: 'Brief description of the research station',
                    rows: 3,
                    required: false
                }
            ],
            onSubmit: (data) => this.handleStationCreation(data)
        });

        this.setupAutoNaming();
    }

    setupAutoNaming() {
        // Auto-generate normalized name from display name
        this.onOpen = () => {
            const displayNameInput = this.modal.querySelector('[name="display_name"]');
            const normalizedNameInput = this.modal.querySelector('[name="normalized_name"]');
            const acronymInput = this.modal.querySelector('[name="acronym"]');

            if (displayNameInput && normalizedNameInput) {
                displayNameInput.addEventListener('input', () => {
                    const displayName = displayNameInput.value.trim();
                    if (displayName) {
                        const normalized = displayName
                            .toLowerCase()
                            .replace(/[åä]/g, 'a')
                            .replace(/ö/g, 'o')
                            .replace(/[^a-z0-9]/g, '_')
                            .replace(/_+/g, '_')
                            .replace(/^_|_$/g, '');
                        normalizedNameInput.value = normalized;
                    }
                });
            }

            // Auto-uppercase acronym
            if (acronymInput) {
                acronymInput.addEventListener('input', () => {
                    acronymInput.value = acronymInput.value.toUpperCase();
                });
            }
        };
    }

    async handleStationCreation(data) {
        // Auth via httpOnly cookie

        // Prepare station data
        const stationData = {
            display_name: data.display_name,
            acronym: data.acronym,
            normalized_name: data.normalized_name,
            status: 'Active',
            country: data.country,
            latitude: data.coordinates?.latitude || null,
            longitude: data.coordinates?.longitude || null,
            elevation_m: data.elevation_m ? parseFloat(data.elevation_m) : null,
            description: data.description || ''
        };

        const response = await fetch('/api/admin/stations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stationData),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 409 && result.conflicts) {
                // Handle conflicts with suggestions
                let conflictMessage = 'Conflicts detected:\n';
                result.conflicts.forEach(conflict => {
                    conflictMessage += `- ${conflict.field}: "${conflict.value}" already exists\n`;
                });

                if (result.suggestions && result.suggestions.normalized_name) {
                    conflictMessage += `\nSuggested normalized name: ${result.suggestions.normalized_name}`;
                    const normalizedInput = this.modal.querySelector('[name="normalized_name"]');
                    if (normalizedInput) {
                        normalizedInput.value = result.suggestions.normalized_name;
                    }
                }

                throw new Error(conflictMessage);
            }
            throw new Error(result.error || 'Failed to create station');
        }

        showSuccess(`Station "${data.display_name}" created successfully!`);

        // Refresh the dashboard if we're on it
        if (typeof refreshStationGrid === 'function') {
            refreshStationGrid();
        }

        return result;
    }

    getSubmitButtonText() {
        return 'Create Station';
    }
}

// Admin Platform Creation Modal
class AdminPlatformCreateModal extends FormModal {
    constructor(config = {}) {
        super({
            id: 'admin-create-platform-modal',
            title: 'Create New Research Platform',
            size: 'lg',
            type: 'admin',
            requiredPermissions: ['admin'],
            swedishContext: true,
            destroyOnClose: true,
            ...config,
            fields: [
                {
                    name: 'station_id',
                    type: 'select',
                    label: 'Research Station',
                    required: true,
                    options: [] // Will be populated dynamically
                },
                {
                    name: 'display_name',
                    type: 'text',
                    label: 'Platform Display Name',
                    placeholder: 'e.g., Tower Platform 01',
                    required: true
                },
                {
                    name: 'location_code',
                    type: 'text',
                    label: 'Location Code',
                    placeholder: 'e.g., PL01',
                    required: true,
                    hint: 'Unique code within the station (e.g., PL01, PL02)'
                },
                {
                    name: 'ecosystem_code',
                    type: 'select',
                    label: 'Ecosystem Type',
                    required: true,
                    options: [
                        { value: 'HEA', label: 'HEA - Heathland' },
                        { value: 'AGR', label: 'AGR - Arable Land' },
                        { value: 'MIR', label: 'MIR - Mires' },
                        { value: 'LAK', label: 'LAK - Lake' },
                        { value: 'WET', label: 'WET - Wetland' },
                        { value: 'GRA', label: 'GRA - Grassland' },
                        { value: 'FOR', label: 'FOR - Forest' },
                        { value: 'ALP', label: 'ALP - Alpine Forest' },
                        { value: 'CON', label: 'CON - Coniferous Forest' },
                        { value: 'DEC', label: 'DEC - Deciduous Forest' },
                        { value: 'MAR', label: 'MAR - Marshland' },
                        { value: 'PEA', label: 'PEA - Peatland' }
                    ]
                },
                {
                    name: 'mounting_structure',
                    type: 'select',
                    label: 'Mounting Structure',
                    required: false,
                    options: [
                        { value: 'Tower', label: 'Tower' },
                        { value: 'Mast', label: 'Mast' },
                        { value: 'Building RoofTop', label: 'Building RoofTop' },
                        { value: 'Building Wall', label: 'Building Wall' },
                        { value: 'Flagpole and Tower', label: 'Flagpole and Tower' },
                        { value: 'Ground Mount', label: 'Ground Mount' }
                    ]
                },
                {
                    name: 'platform_height_m',
                    type: 'number',
                    label: 'Platform Height (meters)',
                    placeholder: 'e.g., 15.5',
                    required: false
                },
                {
                    name: 'coordinates',
                    type: 'coordinate',
                    label: 'Platform Coordinates',
                    required: false,
                    hint: 'SWEREF 99 coordinate system'
                },
                {
                    name: 'description',
                    type: 'textarea',
                    label: 'Description',
                    placeholder: 'Brief description of the platform setup',
                    rows: 3,
                    required: false
                }
            ],
            onSubmit: (data) => this.handlePlatformCreation(data)
        });

        this.stationId = config.stationId || null;
        this.setupAutoNaming();
    }

    async open() {
        // Load stations for the dropdown
        await this.loadStations();
        return super.open();
    }

    async loadStations() {
        try {
            // Auth via httpOnly cookie
            const response = await fetch('/api/stations', {
                credentials: 'include'
            });

            if (response.ok) {
                const stations = await response.json();
                const stationField = this.fields.find(f => f.name === 'station_id');
                if (stationField) {
                    stationField.options = stations.map(station => ({
                        value: station.id,
                        label: `${station.display_name} (${station.acronym})`
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to load stations:', error);
        }
    }

    setupAutoNaming() {
        this.onOpen = () => {
            const stationSelect = this.modal.querySelector('[name="station_id"]');
            const ecosystemSelect = this.modal.querySelector('[name="ecosystem_code"]');
            const locationInput = this.modal.querySelector('[name="location_code"]');
            const displayNameInput = this.modal.querySelector('[name="display_name"]');

            // Pre-select station if provided
            if (this.stationId && stationSelect) {
                stationSelect.value = this.stationId;
            }

            // Auto-generate display name from selections
            const updateDisplayName = () => {
                const stationOption = stationSelect?.selectedOptions[0];
                const ecosystem = ecosystemSelect?.value;
                const location = locationInput?.value;

                if (stationOption && ecosystem && location) {
                    const stationName = stationOption.textContent.split(' (')[0];
                    const ecosystemName = ecosystemSelect.selectedOptions[0].textContent.split(' - ')[1];
                    displayNameInput.value = `${stationName} ${ecosystemName} Platform ${location}`;
                }
            };

            [stationSelect, ecosystemSelect, locationInput].forEach(element => {
                if (element) {
                    element.addEventListener('change', updateDisplayName);
                    element.addEventListener('input', updateDisplayName);
                }
            });
        };
    }

    async handlePlatformCreation(data) {
        // Auth via httpOnly cookie

        // Get station acronym for normalized name generation
        const stationSelect = this.modal.querySelector('[name="station_id"]');
        const selectedStation = stationSelect?.selectedOptions[0];
        const stationAcronym = selectedStation ? selectedStation.textContent.match(/\(([^)]+)\)/)?.[1] : '';

        // Generate normalized name: STATION_ECOSYSTEM_LOCATION
        const normalizedName = `${stationAcronym}_${data.ecosystem_code}_${data.location_code}`;

        const platformData = {
            station_id: parseInt(data.station_id),
            display_name: data.display_name,
            normalized_name: normalizedName,
            location_code: data.location_code,
            mounting_structure: data.mounting_structure || '',
            platform_height_m: data.platform_height_m ? parseFloat(data.platform_height_m) : null,
            status: 'Active',
            latitude: data.coordinates?.latitude || null,
            longitude: data.coordinates?.longitude || null,
            description: data.description || '',
            operation_programs: JSON.stringify(['SITES']) // Default to SITES
        };

        const response = await fetch('/api/admin/platforms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(platformData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to create platform');
        }

        showSuccess(`Platform "${data.display_name}" created successfully!`);

        // Refresh the station view if we're on it
        if (typeof refreshPlatforms === 'function') {
            refreshPlatforms();
        }

        return result;
    }

    getSubmitButtonText() {
        return 'Create Platform';
    }
}

// Admin Station Deletion Modal
class AdminStationDeleteModal extends BaseModal {
    constructor(config = {}) {
        super({
            id: 'admin-delete-station-modal',
            title: 'Delete Research Station',
            size: 'lg',
            type: 'danger',
            requiredPermissions: ['admin'],
            destroyOnClose: true,
            ...config
        });

        this.stationId = config.stationId;
        this.stationName = config.stationName;
        this.dependencyData = null;
    }

    async open() {
        if (!this.stationId) {
            showError('Station ID is required for deletion');
            return false;
        }

        // Load dependency data before opening
        await this.loadDependencyData();
        return super.open();
    }

    async loadDependencyData() {
        this.showLoading('Analyzing station dependencies...');

        try {
            // Auth via httpOnly cookie

            // Get platforms for this station
            const platformsResponse = await fetch(`/api/platforms?station=${this.stationId}`, {
                credentials: 'include'
            });

            if (platformsResponse.ok) {
                const platforms = await platformsResponse.json();

                // Get instruments count for each platform
                let totalInstruments = 0;
                let totalROIs = 0;

                for (const platform of platforms) {
                    const instrumentsResponse = await fetch(`/api/instruments?platform=${platform.id}`, {
                        credentials: 'include'
                    });

                    if (instrumentsResponse.ok) {
                        const instruments = await instrumentsResponse.json();
                        totalInstruments += instruments.length;

                        // Count ROIs for each instrument
                        for (const instrument of instruments) {
                            const roisResponse = await fetch(`/api/rois?instrument=${instrument.id}`, {
                                credentials: 'include'
                            });

                            if (roisResponse.ok) {
                                const rois = await roisResponse.json();
                                totalROIs += rois.length;
                            }
                        }
                    }
                }

                this.dependencyData = {
                    platforms: platforms.length,
                    instruments: totalInstruments,
                    rois: totalROIs
                };
            }
        } catch (error) {
            console.error('Failed to load dependency data:', error);
            this.dependencyData = { platforms: 0, instruments: 0, rois: 0 };
        }
    }

    getBodyContent() {
        if (!this.dependencyData) {
            return '<div class="loading">Loading dependency analysis...</div>';
        }

        return `
            <div class="danger-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Warning: This action cannot be undone</h4>
                <p>Deleting station "${this.stationName}" will also delete all associated data:</p>
            </div>

            <div class="dependency-analysis">
                <h4>Impact Analysis</h4>
                <div class="dependency-tree">
                    <div class="dependency-item station-item">
                        <i class="fas fa-map-marked-alt"></i>
                        <span class="item-name">${this.stationName}</span>
                        <span class="item-action">Will be deleted</span>
                    </div>

                    ${this.dependencyData.platforms > 0 ? `
                    <div class="dependency-children">
                        <div class="dependency-item platform-item">
                            <i class="fas fa-tower-broadcast"></i>
                            <span class="item-name">${this.dependencyData.platforms} Platform${this.dependencyData.platforms !== 1 ? 's' : ''}</span>
                            <span class="item-action">Will be cascade deleted</span>
                        </div>

                        ${this.dependencyData.instruments > 0 ? `
                        <div class="dependency-item instrument-item">
                            <i class="fas fa-camera"></i>
                            <span class="item-name">${this.dependencyData.instruments} Instrument${this.dependencyData.instruments !== 1 ? 's' : ''}</span>
                            <span class="item-action">Will be cascade deleted</span>
                        </div>
                        ` : ''}

                        ${this.dependencyData.rois > 0 ? `
                        <div class="dependency-item roi-item">
                            <i class="fas fa-crop-alt"></i>
                            <span class="item-name">${this.dependencyData.rois} ROI Definition${this.dependencyData.rois !== 1 ? 's' : ''}</span>
                            <span class="item-action">Will be cascade deleted</span>
                        </div>
                        ` : ''}
                    </div>
                    ` : '<p class="no-dependencies">No dependent platforms found.</p>'}
                </div>
            </div>

            <div class="backup-options">
                <h4>Data Preservation</h4>
                <label class="backup-option">
                    <input type="checkbox" id="generate-backup" checked>
                    <span class="option-text">
                        <strong>Create Complete Backup</strong>
                        <small>Generate JSON export with all dependent data before deletion</small>
                    </span>
                </label>
            </div>
        `;
    }

    getFooterContent() {
        return `
            <button type="button" class="btn btn-secondary" onclick="this.closest('.sites-modal').modalInstance.close()">
                Cancel
            </button>
            <button type="button" class="btn btn-danger" onclick="this.closest('.sites-modal').modalInstance.handleDeletion()">
                <i class="fas fa-trash"></i> Delete Station
            </button>
        `;
    }

    async handleDeletion() {
        const generateBackup = this.modal.querySelector('#generate-backup')?.checked || false;
        const deleteBtn = this.modal.querySelector('.btn-danger');

        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

        try {
            // Auth via httpOnly cookie
            const url = `/api/admin/stations/${this.stationId}?force_cascade=true${generateBackup ? '&backup=true' : ''}`;

            const response = await fetch(url, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete station');
            }

            if (generateBackup && result.backup) {
                // Download backup file
                const blob = new Blob([JSON.stringify(result.backup, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `station_${this.stationName}_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }

            showSuccess(`Station "${this.stationName}" deleted successfully`);
            this.close();

            // Refresh the dashboard if we're on it
            if (typeof refreshStationGrid === 'function') {
                refreshStationGrid();
            }

        } catch (error) {
            console.error('Station deletion failed:', error);
            showError('Failed to delete station: ' + error.message);
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Station';
        }
    }
}

// Global convenience functions for admin modals
window.openAdminStationCreateModal = () => {
    return window.modalManager.open('admin-create-station', {});
};

window.openAdminPlatformCreateModal = (stationId = null) => {
    return window.modalManager.open('admin-create-platform', { stationId });
};

window.openAdminStationDeleteModal = (stationId, stationName) => {
    return window.modalManager.open('admin-delete-station', { stationId, stationName });
};

// Register modal types with the modal manager
if (window.modalManager) {
    window.modalManager.createModal = function(modalId, config) {
        switch (modalId) {
            case 'admin-create-station':
                return new AdminStationCreateModal(config);
            case 'admin-create-platform':
                return new AdminPlatformCreateModal(config);
            case 'admin-delete-station':
                return new AdminStationDeleteModal(config);
            default:
                return new BaseModal({ id: modalId, title: 'Modal', ...config });
        }
    };
}