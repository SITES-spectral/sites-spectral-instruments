/**
 * Dashboard State Management
 * SITES Spectral v8.0.0 - Phase 7
 *
 * Reactive state management for the dashboard.
 * Provides centralized state with subscription-based updates.
 */

class DashboardState {
    constructor() {
        this._state = {
            // Station data
            station: null,
            stationLoading: false,
            stationError: null,

            // Platforms organized by type
            platformsByType: {
                fixed: [],
                uav: [],
                satellite: [],
                mobile: []
            },

            // All instruments
            instruments: [],

            // UI state
            expandedPlatformTypes: new Set(['fixed']), // Default: fixed expanded
            expandedPlatforms: new Set(),
            selectedPlatformType: null,
            selectedPlatform: null,
            selectedInstrument: null,

            // Modal state
            activeModal: null,
            modalData: null,

            // Loading states
            isLoading: true,
            loadingStates: {},

            // Errors
            error: null,
            errors: {},

            // User permissions
            user: null,
            isAdmin: false,
            canEdit: false
        };

        this._subscribers = new Map();
        this._subscriberIdCounter = 0;
        this._batchUpdates = false;
        this._pendingNotify = false;
    }

    // =========================================================================
    // STATE ACCESS
    // =========================================================================

    /**
     * Get current state (read-only copy)
     */
    getState() {
        return { ...this._state };
    }

    /**
     * Get a specific state property
     */
    get(key) {
        return this._state[key];
    }

    // =========================================================================
    // STATE UPDATES
    // =========================================================================

    /**
     * Update state with partial updates
     * @param {object} updates - Partial state updates
     */
    setState(updates) {
        const prevState = { ...this._state };

        // Apply updates
        this._state = {
            ...this._state,
            ...updates
        };

        // Notify subscribers
        if (!this._batchUpdates) {
            this._notifySubscribers(prevState);
        } else {
            this._pendingNotify = true;
        }
    }

    /**
     * Batch multiple state updates
     * @param {Function} updateFn - Function containing multiple setState calls
     */
    batchUpdate(updateFn) {
        const prevState = { ...this._state };
        this._batchUpdates = true;

        try {
            updateFn();
        } finally {
            this._batchUpdates = false;
            if (this._pendingNotify) {
                this._pendingNotify = false;
                this._notifySubscribers(prevState);
            }
        }
    }

    // =========================================================================
    // SUBSCRIPTIONS
    // =========================================================================

    /**
     * Subscribe to state changes
     * @param {Function} callback - Called with (newState, prevState) on changes
     * @param {string[]} [keys] - Optional array of state keys to watch
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback, keys = null) {
        const id = ++this._subscriberIdCounter;
        this._subscribers.set(id, { callback, keys });

        // Return unsubscribe function
        return () => {
            this._subscribers.delete(id);
        };
    }

    /**
     * Notify subscribers of state changes
     */
    _notifySubscribers(prevState) {
        for (const [id, { callback, keys }] of this._subscribers) {
            // If keys specified, only notify if those keys changed
            if (keys) {
                const hasChanges = keys.some(key =>
                    this._state[key] !== prevState[key]
                );
                if (!hasChanges) continue;
            }

            try {
                callback(this._state, prevState);
            } catch (error) {
                console.error('DashboardState: Subscriber error:', error);
            }
        }
    }

    // =========================================================================
    // COMPUTED GETTERS
    // =========================================================================

    /**
     * Get instrument counts by type
     */
    get instrumentCountsByType() {
        const counts = {
            phenocam: 0,
            multispectral: 0,
            par: 0,
            ndvi: 0,
            pri: 0,
            hyperspectral: 0,
            other: 0
        };

        for (const instrument of this._state.instruments) {
            const category = this._getInstrumentCategory(instrument.instrument_type);
            counts[category] = (counts[category] || 0) + 1;
        }

        return counts;
    }

    /**
     * Get platforms with their instruments attached
     */
    get platformsWithInstruments() {
        const result = {};

        for (const [type, platforms] of Object.entries(this._state.platformsByType)) {
            result[type] = platforms.map(platform => ({
                ...platform,
                instruments: this._state.instruments.filter(
                    i => i.platform_id === platform.id
                )
            }));
        }

        return result;
    }

    /**
     * Get total platform count
     */
    get totalPlatformCount() {
        return Object.values(this._state.platformsByType)
            .reduce((sum, platforms) => sum + platforms.length, 0);
    }

    /**
     * Get total instrument count
     */
    get totalInstrumentCount() {
        return this._state.instruments.length;
    }

    /**
     * Get instrument category from type string
     */
    _getInstrumentCategory(instrumentType) {
        if (!instrumentType) return 'other';

        const type = instrumentType.toLowerCase();

        if (type.includes('phenocam')) return 'phenocam';
        if (type.includes('hyperspectral') || type.includes('hyp')) return 'hyperspectral';
        if (type.includes('multispectral') || type.includes('skye') ||
            type.includes('decagon') || type === 'ms sensor') return 'multispectral';
        if (type.includes('par')) return 'par';
        if (type.includes('ndvi')) return 'ndvi';
        if (type.includes('pri')) return 'pri';

        return 'other';
    }

    // =========================================================================
    // UI STATE ACTIONS
    // =========================================================================

    /**
     * Toggle platform type expansion
     */
    togglePlatformType(type) {
        const expanded = new Set(this._state.expandedPlatformTypes);

        if (expanded.has(type)) {
            expanded.delete(type);
        } else {
            expanded.add(type);
        }

        this.setState({ expandedPlatformTypes: expanded });
    }

    /**
     * Toggle individual platform expansion
     */
    togglePlatform(platformId) {
        const expanded = new Set(this._state.expandedPlatforms);

        if (expanded.has(platformId)) {
            expanded.delete(platformId);
        } else {
            expanded.add(platformId);
        }

        this.setState({ expandedPlatforms: expanded });
    }

    /**
     * Check if platform type is expanded
     */
    isPlatformTypeExpanded(type) {
        return this._state.expandedPlatformTypes.has(type);
    }

    /**
     * Check if platform is expanded
     */
    isPlatformExpanded(platformId) {
        return this._state.expandedPlatforms.has(platformId);
    }

    /**
     * Select a platform
     */
    selectPlatform(platform) {
        this.setState({
            selectedPlatform: platform,
            selectedInstrument: null
        });
    }

    /**
     * Select an instrument
     */
    selectInstrument(instrument) {
        this.setState({
            selectedInstrument: instrument
        });
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.setState({
            selectedPlatform: null,
            selectedInstrument: null
        });
    }

    // =========================================================================
    // MODAL ACTIONS
    // =========================================================================

    /**
     * Open a modal
     */
    openModal(modalId, data = null) {
        this.setState({
            activeModal: modalId,
            modalData: data
        });
    }

    /**
     * Close the active modal
     */
    closeModal() {
        this.setState({
            activeModal: null,
            modalData: null
        });
    }

    // =========================================================================
    // DATA LOADING ACTIONS
    // =========================================================================

    /**
     * Set loading state for a specific resource
     */
    setLoading(key, isLoading) {
        const loadingStates = {
            ...this._state.loadingStates,
            [key]: isLoading
        };

        const isAnyLoading = Object.values(loadingStates).some(v => v);

        this.setState({
            loadingStates,
            isLoading: isAnyLoading
        });
    }

    /**
     * Set error state for a specific resource
     */
    setError(key, error) {
        const errors = {
            ...this._state.errors,
            [key]: error
        };

        this.setState({
            errors,
            error: error // Also set global error
        });
    }

    /**
     * Clear error state
     */
    clearError(key) {
        if (key) {
            const errors = { ...this._state.errors };
            delete errors[key];
            this.setState({ errors });
        } else {
            this.setState({ error: null, errors: {} });
        }
    }

    // =========================================================================
    // DATA ACTIONS
    // =========================================================================

    /**
     * Load station data
     */
    async loadStation(acronym) {
        this.setLoading('station', true);
        this.clearError('station');

        try {
            const response = await fetch(`/api/v2/stations/${acronym}`);
            if (!response.ok) throw new Error('Failed to load station');

            const data = await response.json();

            this.setState({
                station: data.station || data,
                stationError: null
            });
        } catch (error) {
            this.setError('station', error.message);
        } finally {
            this.setLoading('station', false);
        }
    }

    /**
     * Load platforms for station
     */
    async loadPlatforms(stationId) {
        this.setLoading('platforms', true);
        this.clearError('platforms');

        try {
            const response = await fetch(`/api/v2/platforms?station_id=${stationId}`);
            if (!response.ok) throw new Error('Failed to load platforms');

            const data = await response.json();
            const platforms = data.platforms || [];

            // Organize by type
            const platformsByType = {
                fixed: [],
                uav: [],
                satellite: [],
                mobile: []
            };

            for (const platform of platforms) {
                const type = platform.platform_type || 'fixed';
                if (platformsByType[type]) {
                    platformsByType[type].push(platform);
                } else {
                    platformsByType.fixed.push(platform);
                }
            }

            this.setState({ platformsByType });
        } catch (error) {
            this.setError('platforms', error.message);
        } finally {
            this.setLoading('platforms', false);
        }
    }

    /**
     * Load instruments for station
     */
    async loadInstruments(stationId) {
        this.setLoading('instruments', true);
        this.clearError('instruments');

        try {
            const response = await fetch(`/api/v2/instruments?station_id=${stationId}`);
            if (!response.ok) throw new Error('Failed to load instruments');

            const data = await response.json();

            this.setState({
                instruments: data.instruments || []
            });
        } catch (error) {
            this.setError('instruments', error.message);
        } finally {
            this.setLoading('instruments', false);
        }
    }

    /**
     * Load all data for a station
     */
    async loadStationData(acronym) {
        this.setState({ isLoading: true });

        try {
            await this.loadStation(acronym);

            const station = this._state.station;
            if (station && station.id) {
                await Promise.all([
                    this.loadPlatforms(station.id),
                    this.loadInstruments(station.id)
                ]);
            }
        } finally {
            this.setState({ isLoading: false });
        }
    }

    /**
     * Refresh current station data
     */
    async refresh() {
        const station = this._state.station;
        if (station) {
            await this.loadStationData(station.acronym);
        }
    }

    // =========================================================================
    // USER/PERMISSIONS
    // =========================================================================

    /**
     * Set user and permissions
     */
    setUser(user) {
        this.setState({
            user,
            isAdmin: user?.role === 'admin',
            canEdit: user?.role === 'admin' || user?.role === 'station'
        });
    }

    /**
     * Check if user can edit station
     */
    canEditStation(stationAcronym) {
        if (this._state.isAdmin) return true;
        if (!this._state.user) return false;

        return this._state.user.station_acronym === stationAcronym;
    }

    /**
     * Check if user can delete (admin only)
     */
    canDelete() {
        return this._state.isAdmin;
    }
}

// Create global instance
window.DashboardState = new DashboardState();
