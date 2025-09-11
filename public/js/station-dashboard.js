// Station Dashboard JavaScript with Dynamic Instrument Tables
class StationDashboard {
    constructor() {
        this.user = null;
        this.station = null;
        this.phenocams = [];
        this.sensors = [];
        this.currentTab = 'phenocams';
        this.selectedItems = new Set();
        
        this.init();
    }
    
    async init() {
        try {
            // Check authentication
            this.user = await this.verifyAuthentication();
            if (!this.user) return;
            
            // Load station data
            await this.loadStationData();
            await this.loadInstrumentData();
            
            // Setup UI
            this.setupEventListeners();
            this.updateUI();
            
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            Utils.showToast('Failed to load dashboard data', 'error');
        }
    }
    
    async verifyAuthentication() {
        const token = localStorage.getItem('sites_spectral_token');
        const user = JSON.parse(localStorage.getItem('sites_spectral_user') || '{}');
        
        if (!token || !user.id) {
            window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
            return null;
        }
        
        try {
            const response = await fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Token invalid');
            
            const data = await response.json();
            if (!data.valid) throw new Error('Token invalid');
            
            // Check if user has station access
            if (user.role === 'station' && !user.station_id) {
                Utils.showToast('No station assigned to your account', 'error');
                return null;
            }
            
            return user;
            
        } catch (error) {
            localStorage.removeItem('sites_spectral_token');
            localStorage.removeItem('sites_spectral_user');
            window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
            return null;
        }
    }
    
    async loadStationData() {
        if (this.user.role === 'admin') {
            // For admin users, get station from URL parameter
            const params = new URLSearchParams(window.location.search);
            const stationId = params.get('station');
            if (!stationId) {
                Utils.showToast('Please select a station to manage', 'error');
                window.location.href = '/admin/stations.html';
                return;
            }
            this.station = await API.getStation(stationId);
        } else {
            // For station users, use their assigned station
            this.station = await API.getStation(this.user.station_id);
        }
        
        if (!this.station) {
            throw new Error('Station not found');
        }
    }
    
    async loadInstrumentData() {
        try {
            const [phenocamsData, sensorsData] = await Promise.all([
                this.loadPhenocams(),
                this.loadSensors()
            ]);
            
            this.phenocams = phenocamsData;
            this.sensors = sensorsData;
            
        } catch (error) {
            console.error('Failed to load instrument data:', error);
            throw error;
        }
    }
    
    async loadPhenocams() {
        try {
            const response = await this.authenticatedFetch('/api/phenocams');
            const data = await response.json();
            
            // Filter by user's station if not admin
            let phenocams = data.phenocams || [];
            if (this.user.role !== 'admin') {
                phenocams = phenocams.filter(p => p.station_id === this.user.station_id);
            } else if (this.station) {
                phenocams = phenocams.filter(p => p.station_id === this.station.id);
            }
            
            return phenocams;
        } catch (error) {
            console.error('Failed to load phenocams:', error);
            return [];
        }
    }
    
    async loadSensors() {
        try {
            const response = await this.authenticatedFetch('/api/mspectral');
            const data = await response.json();
            
            // Filter by user's station if not admin
            let sensors = data.mspectral_sensors || [];
            if (this.user.role !== 'admin') {
                sensors = sensors.filter(s => s.station_id === this.user.station_id);
            } else if (this.station) {
                sensors = sensors.filter(s => s.station_id === this.station.id);
            }
            
            return sensors;
        } catch (error) {
            console.error('Failed to load sensors:', error);
            return [];
        }
    }
    
    async authenticatedFetch(url, options = {}) {
        const token = localStorage.getItem('sites_spectral_token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        return fetch(url, { ...options, headers });
    }
    
    updateUI() {
        // Update station header
        document.getElementById('station-name').textContent = this.station.display_name || 'Unknown Station';
        document.getElementById('station-meta').textContent = `${this.station.acronym} • ${this.user.role === 'admin' ? 'Admin View' : 'Station Manager'}`;
        document.getElementById('user-name').textContent = this.user.full_name || this.user.username;
        
        // Update statistics
        const totalInstruments = this.phenocams.length + this.sensors.length;
        const activeInstruments = [...this.phenocams, ...this.sensors].filter(i => i.status === 'Active').length;
        
        document.getElementById('total-instruments').textContent = totalInstruments;
        document.getElementById('active-instruments').textContent = activeInstruments;
        document.getElementById('phenocam-count').textContent = this.phenocams.length;
        document.getElementById('sensor-count').textContent = this.sensors.length;
        
        // Render current tab
        this.renderCurrentTab();
    }
    
    setupEventListeners() {
        // Tab switching
        window.switchTab = (tab) => this.switchTab(tab);
        
        // Search and filter
        document.getElementById('phenocams-search').addEventListener('input', 
            Utils.debounce((e) => this.filterTable('phenocams', e.target.value), 300));
        document.getElementById('sensors-search').addEventListener('input',
            Utils.debounce((e) => this.filterTable('sensors', e.target.value), 300));
            
        document.getElementById('phenocams-filter').addEventListener('change',
            (e) => this.filterTable('phenocams', document.getElementById('phenocams-search').value, e.target.value));
        document.getElementById('sensors-filter').addEventListener('change',
            (e) => this.filterTable('sensors', document.getElementById('sensors-search').value, e.target.value));
        
        // Program filters
        document.getElementById('phenocams-program-filter').addEventListener('change',
            (e) => this.filterTable('phenocams'));
        document.getElementById('sensors-program-filter').addEventListener('change',
            (e) => this.filterTable('sensors'));
        
        // Bulk selection
        document.getElementById('phenocams-select-all').addEventListener('change', 
            (e) => this.toggleSelectAll('phenocams', e.target.checked));
        document.getElementById('sensors-select-all').addEventListener('change',
            (e) => this.toggleSelectAll('sensors', e.target.checked));
        
        // Global functions
        window.logout = () => this.logout();
        window.addInstrument = (type) => this.addInstrument(type);
        window.bulkUpdateStatus = (type) => this.bulkUpdateStatus(type);
        window.bulkExport = (type) => this.bulkExport(type);
    }
    
    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');
        
        this.currentTab = tab;
        this.renderCurrentTab();
    }
    
    renderCurrentTab() {
        switch (this.currentTab) {
            case 'phenocams':
                this.renderPhenocamsTable();
                break;
            case 'sensors':
                this.renderSensorsTable();
                break;
            case 'platforms':
                // Platform management coming soon
                break;
        }
    }
    
    renderPhenocamsTable(filteredData = null) {
        const data = filteredData || this.phenocams;
        const tbody = document.getElementById('phenocams-tbody');
        
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-camera" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>No phenocams found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = data.map(phenocam => `
            <tr data-id="${phenocam.id}" data-type="phenocam">
                <td><input type="checkbox" class="row-select" value="${phenocam.id}"></td>
                <td class="editable-cell" data-field="thematic_program">
                    <span class="program-badge ${(phenocam.thematic_program || '').toLowerCase().replace('_', '-')}">${phenocam.thematic_program || 'SITES_Spectral'}</span>
                </td>
                <td class="editable-cell" data-field="canonical_id">${phenocam.canonical_id || '-'}</td>
                <td class="editable-cell" data-field="legacy_acronym">${phenocam.legacy_acronym || '-'}</td>
                <td class="editable-cell" data-field="ecosystem">${phenocam.ecosystem || '-'}</td>
                <td class="editable-cell" data-field="location">${phenocam.location || '-'}</td>
                <td class="editable-cell" data-field="status">
                    <span class="status-badge ${phenocam.status?.toLowerCase() || 'unknown'}">
                        ${phenocam.status || 'Unknown'}
                    </span>
                </td>
                <td class="coordinates">
                    ${phenocam.latitude && phenocam.longitude 
                        ? `${phenocam.latitude.toFixed(4)}, ${phenocam.longitude.toFixed(4)}`
                        : '-'
                    }
                </td>
                <td class="roi-data">
                    ${phenocam.rois_data ? `<i class="fas fa-eye" title="Has ROI data"></i>` : '-'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="editInstrument('${phenocam.id}', 'phenocam')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="viewROI('${phenocam.id}')" title="View ROI" ${!phenocam.rois_data ? 'disabled' : ''}>
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon text-danger" onclick="deleteInstrument('${phenocam.id}', 'phenocam')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        this.setupInlineEditing('phenocams');
        this.setupRowSelection('phenocams');
    }
    
    renderSensorsTable(filteredData = null) {
        const data = filteredData || this.sensors;
        const tbody = document.getElementById('sensors-tbody');
        
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-microscope" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>No sensors found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = data.map(sensor => `
            <tr data-id="${sensor.id}" data-type="sensor">
                <td><input type="checkbox" class="row-select" value="${sensor.id}"></td>
                <td class="editable-cell" data-field="thematic_program">
                    <span class="program-badge ${(sensor.thematic_program || '').toLowerCase().replace('_', '-')}">${sensor.thematic_program || 'SITES_Spectral'}</span>
                </td>
                <td class="editable-cell" data-field="canonical_id">${sensor.canonical_id || '-'}</td>
                <td class="editable-cell" data-field="legacy_name">${sensor.legacy_name || '-'}</td>
                <td class="editable-cell" data-field="ecosystem">${sensor.ecosystem || '-'}</td>
                <td class="editable-cell" data-field="location">${sensor.location || '-'}</td>
                <td class="editable-cell" data-field="status">
                    <span class="status-badge ${sensor.status?.toLowerCase() || 'unknown'}">
                        ${sensor.status || 'Unknown'}
                    </span>
                </td>
                <td class="editable-cell" data-field="center_wavelength_nm">${sensor.center_wavelength_nm || '-'}</td>
                <td class="editable-cell" data-field="usage_type">${sensor.usage_type || '-'}</td>
                <td>${sensor.brand || '-'}${sensor.model ? ' ' + sensor.model : ''}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="editInstrument('${sensor.id}', 'sensor')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="viewTechnicalSpecs('${sensor.id}')" title="Technical Specs">
                            <i class="fas fa-cogs"></i>
                        </button>
                        <button class="btn-icon text-danger" onclick="deleteInstrument('${sensor.id}', 'sensor')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        this.setupInlineEditing('sensors');
        this.setupRowSelection('sensors');
    }
    
    setupInlineEditing(tableType) {
        const table = document.getElementById(`${tableType}-table`);
        
        table.querySelectorAll('.editable-cell').forEach(cell => {
            cell.addEventListener('dblclick', (e) => {
                this.startEditing(cell, tableType);
            });
        });
    }
    
    startEditing(cell, tableType) {
        if (cell.classList.contains('editing')) return;
        
        const field = cell.dataset.field;
        const row = cell.closest('tr');
        const id = row.dataset.id;
        const currentValue = this.getCurrentCellValue(cell);
        
        cell.classList.add('editing');
        
        let input;
        if (field === 'status') {
            input = document.createElement('select');
            input.className = 'edit-input';
            input.innerHTML = `
                <option value="Active" ${currentValue === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Inactive" ${currentValue === 'Inactive' ? 'selected' : ''}>Inactive</option>
                <option value="Maintenance" ${currentValue === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
            `;
        } else if (field === 'thematic_program') {
            input = document.createElement('select');
            input.className = 'edit-input';
            input.innerHTML = `
                <option value="SITES_Spectral" ${currentValue === 'SITES_Spectral' ? 'selected' : ''}>SITES Spectral</option>
                <option value="ICOS" ${currentValue === 'ICOS' ? 'selected' : ''}>ICOS</option>
                <option value="Other" ${currentValue === 'Other' ? 'selected' : ''}>Other</option>
            `;
        } else {
            input = document.createElement('input');
            input.className = 'edit-input';
            input.value = currentValue;
            input.type = field.includes('wavelength') ? 'number' : 'text';
        }
        
        input.addEventListener('blur', () => {
            this.finishEditing(cell, input, id, field, tableType);
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            } else if (e.key === 'Escape') {
                this.cancelEditing(cell, currentValue);
            }
        });
        
        cell.innerHTML = '';
        cell.appendChild(input);
        input.focus();
    }
    
    getCurrentCellValue(cell) {
        if (cell.dataset.field === 'status') {
            const badge = cell.querySelector('.status-badge');
            return badge ? badge.textContent.trim() : '';
        } else if (cell.dataset.field === 'thematic_program') {
            const badge = cell.querySelector('.program-badge');
            return badge ? badge.textContent.trim() : '';
        }
        return cell.textContent.trim();
    }
    
    async finishEditing(cell, input, id, field, tableType) {
        const newValue = input.value.trim();
        const oldValue = this.getCurrentCellValue(cell);
        
        if (newValue === oldValue) {
            this.cancelEditing(cell, oldValue);
            return;
        }
        
        try {
            // Show loading state
            cell.innerHTML = '<div class="spinner" style="width: 16px; height: 16px;"></div>';
            
            // Update via API
            const endpoint = tableType === 'phenocams' ? '/api/phenocams' : '/api/mspectral';
            const response = await this.authenticatedFetch(`${endpoint}/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ [field]: newValue })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update');
            }
            
            // Update local data
            const dataArray = tableType === 'phenocams' ? this.phenocams : this.sensors;
            const item = dataArray.find(i => i.id == id);
            if (item) {
                item[field] = newValue;
            }
            
            // Update cell display
            this.updateCellDisplay(cell, field, newValue);
            
            Utils.showToast('Updated successfully', 'success');
            
        } catch (error) {
            console.error('Failed to update:', error);
            Utils.showToast('Failed to update', 'error');
            this.updateCellDisplay(cell, field, oldValue);
        }
        
        cell.classList.remove('editing');
    }
    
    updateCellDisplay(cell, field, value) {
        if (field === 'status') {
            cell.innerHTML = `<span class="status-badge ${value.toLowerCase()}">${value}</span>`;
        } else if (field === 'thematic_program') {
            cell.innerHTML = `<span class="program-badge ${value.toLowerCase().replace('_', '-')}">${value}</span>`;
        } else {
            cell.textContent = value || '-';
        }
    }
    
    cancelEditing(cell, originalValue) {
        this.updateCellDisplay(cell, cell.dataset.field, originalValue);
        cell.classList.remove('editing');
    }
    
    setupRowSelection(tableType) {
        const checkboxes = document.querySelectorAll(`#${tableType}-table .row-select`);
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSelection(tableType);
            });
        });
    }
    
    updateSelection(tableType) {
        const checkboxes = document.querySelectorAll(`#${tableType}-table .row-select:checked`);
        const count = checkboxes.length;
        
        document.getElementById(`${tableType}-selected-count`).textContent = count;
        
        const bulkActions = document.getElementById(`${tableType}-bulk-actions`);
        if (count > 0) {
            bulkActions.classList.add('show');
        } else {
            bulkActions.classList.remove('show');
        }
    }
    
    toggleSelectAll(tableType, checked) {
        const checkboxes = document.querySelectorAll(`#${tableType}-table .row-select`);
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateSelection(tableType);
    }
    
    filterTable(tableType, searchQuery, statusFilter = '') {
        const data = tableType === 'phenocams' ? this.phenocams : this.sensors;
        
        // Get current filter values from the form
        if (!searchQuery && !statusFilter) {
            searchQuery = document.getElementById(`${tableType}-search`).value;
            statusFilter = document.getElementById(`${tableType}-filter`).value;
        }
        const programFilter = document.getElementById(`${tableType}-program-filter`).value;
        
        let filtered = data;
        
        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                (item.canonical_id || '').toLowerCase().includes(query) ||
                (item.legacy_name || item.legacy_acronym || '').toLowerCase().includes(query) ||
                (item.ecosystem || '').toLowerCase().includes(query) ||
                (item.location || '').toLowerCase().includes(query)
            );
        }
        
        // Apply status filter
        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter);
        }
        
        // Apply program filter
        if (programFilter) {
            filtered = filtered.filter(item => item.thematic_program === programFilter);
        }
        
        // Re-render table with filtered data
        if (tableType === 'phenocams') {
            this.renderPhenocamsTable(filtered);
        } else {
            this.renderSensorsTable(filtered);
        }
    }
    
    async logout() {
        try {
            await this.authenticatedFetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        localStorage.removeItem('sites_spectral_token');
        localStorage.removeItem('sites_spectral_user');
        window.location.href = '/';
    }
    
    // Placeholder methods for future implementation
    addInstrument(type) {
        Utils.showToast(`Add ${type} functionality coming soon`, 'info');
    }
    
    bulkUpdateStatus(type) {
        Utils.showToast(`Bulk update for ${type} coming soon`, 'info');
    }
    
    bulkExport(type) {
        Utils.showToast(`Export ${type} functionality coming soon`, 'info');
    }
}

// Global functions for HTML onclick handlers
window.editInstrument = (id, type) => {
    Utils.showToast(`Edit ${type} functionality coming soon`, 'info');
};

window.viewROI = (id) => {
    Utils.showToast('ROI viewer coming soon', 'info');
};

window.viewTechnicalSpecs = (id) => {
    Utils.showToast('Technical specs viewer coming soon', 'info');
};

window.deleteInstrument = (id, type) => {
    Utils.showToast(`Delete ${type} functionality coming soon`, 'info');
};

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new StationDashboard();
});

// Additional CSS for action buttons
const additionalStyles = `
    .action-buttons {
        display: flex;
        gap: 0.5rem;
    }
    
    .btn-icon {
        background: none;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        padding: 0.375rem;
        cursor: pointer;
        color: #6b7280;
        font-size: 0.875rem;
        transition: all 0.2s;
    }
    
    .btn-icon:hover {
        background: #f3f4f6;
        color: #374151;
    }
    
    .btn-icon.text-danger {
        color: #dc2626;
    }
    
    .btn-icon.text-danger:hover {
        background: #fee2e2;
        border-color: #fca5a5;
    }
    
    .btn-icon:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .btn-icon:disabled:hover {
        background: none;
        color: #6b7280;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);