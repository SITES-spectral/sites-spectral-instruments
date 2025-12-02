# Frontend Components Documentation

**SITES Spectral v9.0.0**

This document provides comprehensive documentation for the frontend JavaScript components introduced or enhanced in version 9.0.0 of SITES Spectral Instruments.

---

## Table of Contents

1. [API Client](#1-api-client)
2. [Platform Type Filter](#2-platform-type-filter)
3. [Pagination Controls](#3-pagination-controls)
4. [Campaign Manager](#4-campaign-manager)
5. [Product Browser](#5-product-browser)
6. [Config Service Updates](#6-config-service-updates)
7. [YAML Configuration Files](#7-yaml-configuration-files)
8. [Integration Examples](#8-integration-examples)

---

## 1. API Client

**File:** `public/js/api.js`

The API client provides a unified interface for communicating with the SITES Spectral API across all versions (v1, v2, v3).

### V3Response Class

The `V3Response` class wraps API responses to provide consistent access to data, pagination, and metadata.

```javascript
class V3Response {
    constructor(response) {
        this.data = response.data || [];
        this.meta = response.meta || {};
        this.links = response.links || {};
        this.pagination = response.pagination || null;
    }

    // Check if response has data
    hasData() {
        return Array.isArray(this.data) ? this.data.length > 0 : !!this.data;
    }

    // Get total count from pagination
    getTotalCount() {
        return this.pagination?.total || this.data?.length || 0;
    }

    // Check if more pages exist
    hasMorePages() {
        return this.pagination?.has_more === true ||
               this.pagination?.next_cursor !== null;
    }

    // Get next cursor for pagination
    getNextCursor() {
        return this.pagination?.next_cursor || null;
    }

    // Get previous cursor for pagination
    getPrevCursor() {
        return this.pagination?.prev_cursor || null;
    }
}
```

### Available Methods

#### Station Operations

| Method | Description | Parameters |
|--------|-------------|------------|
| `getStations()` | Fetch all stations | None |
| `getStation(acronym)` | Fetch single station | `acronym`: Station code (e.g., 'SVB') |
| `createStation(data)` | Create new station | `data`: Station object |
| `updateStation(id, data)` | Update station | `id`: Station ID, `data`: Updated fields |
| `deleteStation(id)` | Delete station | `id`: Station ID |

#### Platform Operations

| Method | Description | Parameters |
|--------|-------------|------------|
| `getPlatforms(stationAcronym, options)` | Fetch platforms | `stationAcronym`: Station code, `options`: Filter options |
| `getPlatformsByType(stationAcronym, type)` | Filter by platform type | `stationAcronym`, `type`: 'fixed', 'uav', 'satellite' |
| `createPlatform(data)` | Create new platform | `data`: Platform object |
| `updatePlatform(id, data)` | Update platform | `id`: Platform ID, `data`: Updated fields |
| `deletePlatform(id)` | Delete platform | `id`: Platform ID |

#### Instrument Operations

| Method | Description | Parameters |
|--------|-------------|------------|
| `getInstruments(platformId, options)` | Fetch instruments | `platformId`, `options`: Pagination/filter options |
| `getInstrument(id)` | Fetch single instrument | `id`: Instrument ID |
| `createInstrument(data)` | Create instrument | `data`: Instrument object |
| `updateInstrument(id, data)` | Update instrument | `id`: Instrument ID, `data`: Updated fields |
| `deleteInstrument(id)` | Delete instrument | `id`: Instrument ID |

#### Campaign Operations (v3)

| Method | Description | Parameters |
|--------|-------------|------------|
| `getCampaigns(stationId, options)` | Fetch campaigns | `stationId`, `options`: Filter options |
| `getCampaign(id)` | Fetch single campaign | `id`: Campaign ID |
| `createCampaign(data)` | Create campaign | `data`: Campaign object |
| `updateCampaign(id, data)` | Update campaign | `id`: Campaign ID, `data`: Updated fields |
| `deleteCampaign(id)` | Delete campaign | `id`: Campaign ID |
| `getCampaignProducts(campaignId)` | Get linked products | `campaignId`: Campaign ID |

#### Product Operations (v3)

| Method | Description | Parameters |
|--------|-------------|------------|
| `getProducts(campaignId, options)` | Fetch products | `campaignId`, `options`: Filter options |
| `getProduct(id)` | Fetch single product | `id`: Product ID |
| `createProduct(data)` | Create product | `data`: Product object |
| `updateProduct(id, data)` | Update product | `id`: Product ID, `data`: Updated fields |
| `deleteProduct(id)` | Delete product | `id`: Product ID |

### Pagination Helpers

```javascript
// Build pagination query parameters
const queryParams = API.buildPaginationParams({
    page: 1,
    pageSize: 25,
    sortBy: 'created_at',
    sortOrder: 'desc'
});

// Parse pagination from response
const paginationInfo = API.parsePagination(response);
// Returns: { page, pageSize, total, totalPages, hasNext, hasPrev }

// Build cursor-based pagination params (v3)
const cursorParams = API.buildCursorParams({
    cursor: 'eyJpZCI6MTIzfQ',
    limit: 25
});
```

### Usage Examples

#### Basic API Call

```javascript
// Fetch stations
const response = await API.getStations();
if (response.success) {
    const stations = response.data;
    console.log(`Loaded ${stations.length} stations`);
}

// With error handling
try {
    const response = await API.getStation('SVB');
    if (response.success) {
        renderStation(response.data);
    } else {
        showError(response.error);
    }
} catch (error) {
    showError('Network error: ' + error.message);
}
```

#### Paginated Request (v3)

```javascript
// Fetch instruments with pagination
const options = {
    page: 1,
    pageSize: 25,
    type: 'phenocam',
    status: 'Active'
};

const response = await API.getInstruments(platformId, options);
const v3Response = new V3Response(response);

if (v3Response.hasData()) {
    renderInstruments(v3Response.data);
    updatePagination(v3Response.pagination);

    if (v3Response.hasMorePages()) {
        showLoadMoreButton();
    }
}
```

#### Campaign Creation

```javascript
const campaignData = {
    campaign_name: 'Summer Field Survey 2025',
    campaign_type: 'field_survey',
    station_id: 1,
    start_date: '2025-06-15',
    end_date: '2025-06-20',
    campaign_lead: 'John Doe',
    objectives: 'Vegetation sampling and ground truth collection'
};

const response = await API.createCampaign(campaignData);
if (response.success) {
    showNotification('Campaign created successfully');
    refreshCampaignList();
}
```

---

## 2. Platform Type Filter

**File:** `public/js/platforms/platform-type-filter.js`

A reusable component for filtering platforms by type (fixed, uav, satellite, mobile, usv, uuv).

### Constructor Options

```javascript
const filter = new PlatformTypeFilter({
    // Container element ID or reference
    container: 'platform-filter-container',

    // Initially selected type (null for 'all')
    initialType: null,

    // Show count badges on filter buttons
    showCounts: true,

    // Only show types with platforms
    hideEmptyTypes: false,

    // Show 'All' option
    showAllOption: true,

    // Layout style: 'horizontal', 'vertical', 'dropdown'
    layout: 'horizontal',

    // Button size: 'small', 'medium', 'large'
    size: 'medium',

    // Callback when type changes
    onTypeChange: (type) => { /* handler */ }
});
```

### Methods

#### render()

Renders the filter component into the container.

```javascript
filter.render();
```

**Generated HTML Structure:**

```html
<div class="platform-type-filter" role="radiogroup" aria-label="Filter by platform type">
    <button class="type-btn active" data-type="all" aria-checked="true">
        <i class="fas fa-layer-group"></i>
        <span class="label">All</span>
        <span class="count-badge">24</span>
    </button>
    <button class="type-btn" data-type="fixed" aria-checked="false">
        <i class="fas fa-tower-observation"></i>
        <span class="label">Fixed</span>
        <span class="count-badge">15</span>
    </button>
    <button class="type-btn" data-type="uav" aria-checked="false">
        <i class="fas fa-crosshairs"></i>
        <span class="label">UAV</span>
        <span class="count-badge">6</span>
    </button>
    <!-- Additional type buttons... -->
</div>
```

#### setActiveType(type)

Programmatically sets the active filter type.

```javascript
// Set to UAV filter
filter.setActiveType('uav');

// Reset to all
filter.setActiveType(null);
```

#### onTypeChange(callback)

Registers a callback for type changes.

```javascript
filter.onTypeChange((type) => {
    console.log(`Filter changed to: ${type || 'all'}`);
    refreshPlatformList(type);
});
```

#### updateCounts(counts)

Updates the count badges for each type.

```javascript
// Update counts from API response
filter.updateCounts({
    all: 24,
    fixed: 15,
    uav: 6,
    satellite: 3,
    mobile: 0,
    usv: 0,
    uuv: 0
});
```

#### getActiveType()

Returns the currently selected type.

```javascript
const currentType = filter.getActiveType();
// Returns: 'fixed', 'uav', 'satellite', or null for 'all'
```

### Integration Example

```html
<!-- HTML -->
<div id="platform-filter-container"></div>
<div id="platform-list"></div>
```

```javascript
// JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize filter
    const platformFilter = new PlatformTypeFilter({
        container: 'platform-filter-container',
        showCounts: true,
        onTypeChange: handleFilterChange
    });

    // Render filter
    platformFilter.render();

    // Load initial data and update counts
    const platforms = await API.getPlatforms(stationAcronym);
    const counts = countPlatformsByType(platforms.data);
    platformFilter.updateCounts(counts);

    // Handle filter changes
    async function handleFilterChange(type) {
        const filtered = type
            ? await API.getPlatformsByType(stationAcronym, type)
            : await API.getPlatforms(stationAcronym);

        renderPlatformList(filtered.data);
    }
});
```

---

## 3. Pagination Controls

**File:** `public/js/ui/pagination-controls.js`

A flexible pagination component supporting numbered pagination, load-more, and cursor-based navigation.

### Constructor Options

```javascript
const pagination = new PaginationControls({
    // Container element ID or reference
    container: 'pagination-container',

    // Pagination style: 'numbered', 'load_more', 'infinite_scroll'
    style: 'numbered',

    // Current page (1-indexed)
    currentPage: 1,

    // Items per page
    pageSize: 25,

    // Total number of items
    totalItems: 234,

    // Available page size options
    pageSizeOptions: [10, 25, 50, 100],

    // Maximum page buttons to show
    maxPageButtons: 5,

    // Show first/last buttons
    showFirstLast: true,

    // Show page size selector
    showPageSizeSelector: true,

    // Show item range (e.g., "1-25 of 234")
    showItemRange: true,

    // Position: 'top', 'bottom', 'both'
    position: 'bottom',

    // Callbacks
    onPageChange: (page) => { /* handler */ },
    onPageSizeChange: (pageSize) => { /* handler */ }
});
```

### Methods

#### render()

Renders the pagination controls.

```javascript
pagination.render();
```

**Generated HTML Structure (numbered style):**

```html
<nav class="pagination-controls" role="navigation" aria-label="Pagination navigation">
    <div class="pagination-info">
        <span class="item-range">1-25 of 234</span>
        <div class="page-size-selector">
            <label for="page-size">Items per page:</label>
            <select id="page-size">
                <option value="10">10</option>
                <option value="25" selected>25</option>
                <option value="50">50</option>
                <option value="100">100</option>
            </select>
        </div>
    </div>

    <div class="pagination-buttons">
        <button class="page-btn first" aria-label="First page">
            <i class="fas fa-angle-double-left"></i>
        </button>
        <button class="page-btn prev" aria-label="Previous page">
            <i class="fas fa-chevron-left"></i>
        </button>

        <button class="page-btn" data-page="1" aria-current="page">1</button>
        <button class="page-btn" data-page="2">2</button>
        <button class="page-btn" data-page="3">3</button>
        <span class="ellipsis">...</span>
        <button class="page-btn" data-page="10">10</button>

        <button class="page-btn next" aria-label="Next page">
            <i class="fas fa-chevron-right"></i>
        </button>
        <button class="page-btn last" aria-label="Last page">
            <i class="fas fa-angle-double-right"></i>
        </button>
    </div>
</nav>
```

#### setPage(page)

Sets the current page and triggers re-render.

```javascript
pagination.setPage(3);
```

#### setLoading(isLoading)

Shows/hides loading state.

```javascript
// Show loading
pagination.setLoading(true);

// After data loads
pagination.setLoading(false);
```

#### update(options)

Updates pagination state with new values.

```javascript
pagination.update({
    currentPage: 2,
    totalItems: 500,
    pageSize: 50
});
```

#### destroy()

Removes the component and cleans up event listeners.

```javascript
pagination.destroy();
```

### Event Callbacks

#### onPageChange

Triggered when user clicks a page button.

```javascript
pagination.onPageChange = async (page) => {
    pagination.setLoading(true);

    const response = await API.getInstruments(platformId, {
        page: page,
        pageSize: pagination.pageSize
    });

    renderInstruments(response.data);
    pagination.setLoading(false);
};
```

#### onPageSizeChange

Triggered when user changes items per page.

```javascript
pagination.onPageSizeChange = async (pageSize) => {
    pagination.setLoading(true);

    const response = await API.getInstruments(platformId, {
        page: 1,  // Reset to first page
        pageSize: pageSize
    });

    pagination.update({
        currentPage: 1,
        pageSize: pageSize,
        totalItems: response.pagination.total
    });

    renderInstruments(response.data);
    pagination.setLoading(false);
};
```

### Keyboard Navigation

The pagination component supports keyboard navigation:

| Key | Action |
|-----|--------|
| `ArrowRight` | Next page |
| `ArrowLeft` | Previous page |
| `Home` | First page |
| `End` | Last page |
| `Enter/Space` | Activate focused button |

```javascript
// Enable keyboard navigation (enabled by default)
const pagination = new PaginationControls({
    container: 'pagination',
    keyboardNavigation: true,
    // ...
});
```

### Integration Example

```html
<!-- HTML -->
<div id="instruments-list"></div>
<div id="instruments-pagination"></div>
```

```javascript
// JavaScript
let paginationControls;

async function initializeInstrumentsList(platformId) {
    // Initialize pagination
    paginationControls = new PaginationControls({
        container: 'instruments-pagination',
        style: 'numbered',
        pageSize: 25,
        showFirstLast: true,
        showPageSizeSelector: true,
        onPageChange: (page) => loadInstruments(platformId, page),
        onPageSizeChange: (size) => loadInstruments(platformId, 1, size)
    });

    // Load initial data
    await loadInstruments(platformId, 1);
}

async function loadInstruments(platformId, page, pageSize = 25) {
    paginationControls.setLoading(true);

    try {
        const response = await API.getInstruments(platformId, {
            page,
            pageSize
        });

        renderInstrumentsList(response.data);

        paginationControls.update({
            currentPage: page,
            pageSize: pageSize,
            totalItems: response.pagination.total
        });
    } catch (error) {
        showError('Failed to load instruments');
    } finally {
        paginationControls.setLoading(false);
    }
}
```

---

## 4. Campaign Manager

**File:** `public/js/campaigns/campaign-manager.js`

A comprehensive component for managing field campaigns, UAV missions, and satellite acquisitions.

### Constructor Options

```javascript
const campaignManager = new CampaignManager({
    // Container element ID or reference
    container: 'campaign-container',

    // Station ID to filter campaigns
    stationId: 1,

    // Initial view: 'list', 'calendar', 'timeline'
    initialView: 'list',

    // Enable create/edit operations
    editable: true,

    // User role for permission checks
    userRole: 'admin',  // 'admin', 'station', 'readonly'

    // Show filter controls
    showFilters: true,

    // Default filter values
    defaultFilters: {
        status: null,
        type: null,
        dateRange: null
    },

    // Callbacks
    onCampaignSelect: (campaign) => { /* handler */ },
    onCampaignCreate: (campaign) => { /* handler */ },
    onCampaignUpdate: (campaign) => { /* handler */ },
    onCampaignDelete: (campaignId) => { /* handler */ }
});
```

### CRUD Methods

#### loadCampaigns(filters)

Loads campaigns with optional filters.

```javascript
await campaignManager.loadCampaigns({
    status: 'in_progress',
    type: 'uav_flight',
    startDate: '2025-01-01',
    endDate: '2025-12-31'
});
```

#### createCampaign(data)

Opens create modal and handles submission.

```javascript
campaignManager.createCampaign({
    campaign_type: 'field_survey'  // Pre-select campaign type
});
```

#### editCampaign(campaignId)

Opens edit modal for existing campaign.

```javascript
campaignManager.editCampaign(123);
```

#### deleteCampaign(campaignId)

Deletes a campaign with confirmation.

```javascript
await campaignManager.deleteCampaign(123);
```

#### updateCampaignStatus(campaignId, status)

Updates campaign status.

```javascript
await campaignManager.updateCampaignStatus(123, 'completed');
```

### Modal System

The Campaign Manager includes a modal system for create/edit operations.

#### showCreateModal(type)

Opens the campaign creation modal.

```javascript
// Open modal with pre-selected type
campaignManager.showCreateModal('uav_flight');
```

#### showEditModal(campaign)

Opens the campaign edit modal.

```javascript
const campaign = await API.getCampaign(123);
campaignManager.showEditModal(campaign.data);
```

#### closeModal()

Closes any open modal.

```javascript
campaignManager.closeModal();
```

### Modal HTML Structure

```html
<div class="modal-overlay" id="campaign-modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Create Campaign</h2>
            <button class="modal-close" aria-label="Close">&times;</button>
        </div>

        <form id="campaign-form" class="modal-body">
            <!-- General Information Section -->
            <section class="form-section">
                <h3>General Information</h3>
                <div class="form-group">
                    <label for="campaign_name">Campaign Name *</label>
                    <input type="text" id="campaign_name" required>
                </div>
                <div class="form-group">
                    <label for="campaign_type">Campaign Type *</label>
                    <select id="campaign_type" required>
                        <option value="field_survey">Field Survey</option>
                        <option value="uav_flight">UAV Flight Mission</option>
                        <option value="satellite_acquisition">Satellite Acquisition</option>
                        <option value="mobile_survey">Mobile Survey</option>
                    </select>
                </div>
            </section>

            <!-- Timeline Section -->
            <section class="form-section">
                <h3>Schedule</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="start_date">Start Date *</label>
                        <input type="date" id="start_date" required>
                    </div>
                    <div class="form-group">
                        <label for="end_date">End Date</label>
                        <input type="date" id="end_date">
                    </div>
                </div>
            </section>

            <!-- Type-specific fields rendered dynamically -->
            <section class="form-section type-specific" id="type-specific-fields">
                <!-- Populated based on campaign_type -->
            </section>
        </form>

        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" form="campaign-form" class="btn btn-primary">Create Campaign</button>
        </div>
    </div>
</div>
```

### Event Callbacks

```javascript
const campaignManager = new CampaignManager({
    container: 'campaigns',
    stationId: 1,

    // Called when a campaign is selected/clicked
    onCampaignSelect: (campaign) => {
        showCampaignDetails(campaign);
    },

    // Called after successful creation
    onCampaignCreate: (campaign) => {
        showNotification('Campaign created: ' + campaign.campaign_name);
        refreshDashboard();
    },

    // Called after successful update
    onCampaignUpdate: (campaign) => {
        showNotification('Campaign updated');
        refreshDashboard();
    },

    // Called after successful deletion
    onCampaignDelete: (campaignId) => {
        showNotification('Campaign deleted');
        refreshDashboard();
    }
});
```

### Integration Example

```html
<!-- HTML -->
<div class="campaigns-section">
    <div class="section-header">
        <h2>Campaigns</h2>
        <button id="create-campaign-btn" class="btn btn-primary">
            <i class="fas fa-plus"></i> New Campaign
        </button>
    </div>

    <div id="campaign-filters"></div>
    <div id="campaign-list"></div>
    <div id="campaign-pagination"></div>
</div>

<div id="campaign-modal-container"></div>
```

```javascript
// JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    const stationId = getStationIdFromUrl();

    // Initialize campaign manager
    const campaignManager = new CampaignManager({
        container: 'campaign-list',
        stationId: stationId,
        editable: currentUser.role !== 'readonly',
        showFilters: true,

        onCampaignSelect: (campaign) => {
            navigateToCampaignDetail(campaign.id);
        },

        onCampaignCreate: (campaign) => {
            showSuccess(`Campaign "${campaign.campaign_name}" created`);
        },

        onCampaignUpdate: () => {
            showSuccess('Campaign updated successfully');
        }
    });

    // Initialize with data
    await campaignManager.loadCampaigns();

    // Create button handler
    document.getElementById('create-campaign-btn').addEventListener('click', () => {
        campaignManager.showCreateModal();
    });
});
```

---

## 5. Product Browser

**File:** `public/js/products/product-browser.js`

A component for browsing, filtering, and managing data products linked to campaigns.

### Constructor Options

```javascript
const productBrowser = new ProductBrowser({
    // Container element ID or reference
    container: 'product-browser',

    // Campaign ID to filter products
    campaignId: null,

    // Initial view mode: 'grid', 'list'
    viewMode: 'grid',

    // Enable product management
    editable: true,

    // Show preview thumbnails
    showThumbnails: true,

    // Enable product downloads
    enableDownload: true,

    // Default filters
    defaultFilters: {
        type: null,
        processingLevel: null,
        dateRange: null
    },

    // Callbacks
    onProductSelect: (product) => { /* handler */ },
    onProductDownload: (product) => { /* handler */ },
    onFilterChange: (filters) => { /* handler */ }
});
```

### View Modes

#### Grid View

```javascript
productBrowser.setViewMode('grid');
```

Displays products as cards with thumbnails:

```html
<div class="product-grid">
    <div class="product-card" data-product-id="123">
        <div class="product-thumbnail">
            <img src="/api/products/123/thumbnail" alt="Product preview">
            <span class="product-type-badge">NDVI</span>
        </div>
        <div class="product-info">
            <h4 class="product-name">NDVI_SVB_2025-06-15</h4>
            <div class="product-meta">
                <span class="processing-level">L2</span>
                <span class="file-size">245 MB</span>
                <span class="date">2025-06-15</span>
            </div>
        </div>
        <div class="product-actions">
            <button class="btn-icon" aria-label="Download">
                <i class="fas fa-download"></i>
            </button>
            <button class="btn-icon" aria-label="View details">
                <i class="fas fa-eye"></i>
            </button>
        </div>
    </div>
    <!-- More product cards... -->
</div>
```

#### List View

```javascript
productBrowser.setViewMode('list');
```

Displays products as a table:

```html
<table class="product-table">
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Level</th>
            <th>Size</th>
            <th>Date</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        <tr data-product-id="123">
            <td>NDVI_SVB_2025-06-15</td>
            <td><span class="type-badge ndvi">NDVI</span></td>
            <td>L2</td>
            <td>245 MB</td>
            <td>2025-06-15</td>
            <td>
                <button class="btn-icon download" aria-label="Download">
                    <i class="fas fa-download"></i>
                </button>
            </td>
        </tr>
    </tbody>
</table>
```

### Filtering Methods

#### setFilter(key, value)

Sets a single filter.

```javascript
productBrowser.setFilter('type', 'ndvi_map');
productBrowser.setFilter('processingLevel', 'L2');
```

#### setFilters(filters)

Sets multiple filters at once.

```javascript
productBrowser.setFilters({
    type: 'ndvi_map',
    processingLevel: 'L2',
    startDate: '2025-06-01',
    endDate: '2025-06-30'
});
```

#### clearFilters()

Clears all filters.

```javascript
productBrowser.clearFilters();
```

#### getActiveFilters()

Returns current filter state.

```javascript
const filters = productBrowser.getActiveFilters();
// { type: 'ndvi_map', processingLevel: 'L2' }
```

### Event Callbacks

```javascript
const productBrowser = new ProductBrowser({
    container: 'products',
    campaignId: 123,

    // Product selection
    onProductSelect: (product) => {
        showProductDetailModal(product);
    },

    // Product download
    onProductDownload: async (product) => {
        showDownloadProgress(product);
        await downloadProduct(product.id);
        hideDownloadProgress();
    },

    // Filter changes
    onFilterChange: (filters) => {
        updateUrlParams(filters);
        trackAnalytics('product_filter', filters);
    }
});
```

### Integration Example

```html
<!-- HTML -->
<div class="products-section">
    <div class="section-header">
        <h2>Products</h2>
        <div class="view-toggle">
            <button id="grid-view" class="active" aria-label="Grid view">
                <i class="fas fa-th"></i>
            </button>
            <button id="list-view" aria-label="List view">
                <i class="fas fa-list"></i>
            </button>
        </div>
    </div>

    <div class="filter-bar">
        <select id="product-type-filter">
            <option value="">All Types</option>
            <option value="orthomosaic">Orthomosaic</option>
            <option value="ndvi_map">NDVI Map</option>
            <option value="point_cloud">Point Cloud</option>
        </select>

        <select id="processing-level-filter">
            <option value="">All Levels</option>
            <option value="L0">L0 - Raw</option>
            <option value="L1">L1 - Processed</option>
            <option value="L2">L2 - Validated</option>
            <option value="L3">L3 - Published</option>
        </select>
    </div>

    <div id="product-browser"></div>
    <div id="product-pagination"></div>
</div>
```

```javascript
// JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    const campaignId = getCampaignIdFromUrl();

    // Initialize product browser
    const productBrowser = new ProductBrowser({
        container: 'product-browser',
        campaignId: campaignId,
        viewMode: 'grid',
        showThumbnails: true,
        enableDownload: true,

        onProductSelect: (product) => {
            window.open(`/products/${product.id}`, '_blank');
        },

        onProductDownload: async (product) => {
            await API.downloadProduct(product.id);
        }
    });

    // View toggle handlers
    document.getElementById('grid-view').addEventListener('click', () => {
        productBrowser.setViewMode('grid');
        updateActiveToggle('grid-view');
    });

    document.getElementById('list-view').addEventListener('click', () => {
        productBrowser.setViewMode('list');
        updateActiveToggle('list-view');
    });

    // Filter handlers
    document.getElementById('product-type-filter').addEventListener('change', (e) => {
        productBrowser.setFilter('type', e.target.value || null);
    });

    document.getElementById('processing-level-filter').addEventListener('change', (e) => {
        productBrowser.setFilter('processingLevel', e.target.value || null);
    });

    // Load products
    await productBrowser.loadProducts();
});
```

---

## 6. Config Service Updates

**File:** `public/js/core/config-service.js`

The ConfigService has been enhanced in v9.0.0 with new methods for accessing API version, campaign, product, and pagination configurations.

### New V3 Methods

#### API Version Accessors

```javascript
// Get all API versions configuration
const apiVersions = SitesConfig.getAPIVersions();

// Get current API version (marked as current/default)
const currentVersion = SitesConfig.getAPIVersion();
// Returns: { version: 'v3', status: 'current', features: {...}, ... }

// Get specific API version by key
const v2Config = SitesConfig.getAPIVersionByKey('v2');

// Get version selection configuration
const selectionConfig = SitesConfig.getAPIVersionSelection();
// Returns: { default_version: 'v3', methods: {...}, priority: [...] }

// Get default API version string
const defaultVersion = SitesConfig.getDefaultAPIVersion();
// Returns: 'v3'

// Get feature availability by version
const features = SitesConfig.getAPIFeatures();
// Returns: { pagination: { v1: false, v2: 'offset-based', v3: 'cursor-based' }, ... }
```

### Campaign Config Accessors

```javascript
// Get all campaign types
const campaignTypes = SitesConfig.getCampaignTypes();

// Get specific campaign type
const uavFlight = SitesConfig.getCampaignType('uav_flight');
// Returns: { name: 'UAV Flight Mission', icon: 'fa-helicopter', color: '#059669', ... }

// Get campaign type icon
const icon = SitesConfig.getCampaignTypeIcon('field_survey');
// Returns: 'fa-clipboard-list'

// Get campaign type color
const color = SitesConfig.getCampaignTypeColor('field_survey');
// Returns: '#2563eb'

// Get all campaign status definitions
const statuses = SitesConfig.getCampaignStatuses();

// Get specific campaign status
const inProgress = SitesConfig.getCampaignStatus('in_progress');
// Returns: { label: 'In Progress', icon: 'fa-spinner', color: '#f59e0b', ... }

// Get campaign status color
const statusColor = SitesConfig.getCampaignStatusColor('completed');
// Returns: '#22c55e'

// Get campaign status icon
const statusIcon = SitesConfig.getCampaignStatusIcon('planning');
// Returns: 'fa-clipboard'

// Get campaign priorities
const priorities = SitesConfig.getCampaignPriorities();

// Get campaign UI configuration
const uiConfig = SitesConfig.getCampaignUIConfig();
// Returns: { card_display: {...}, filters: {...}, timeline: {...}, calendar: {...} }

// Get campaign validation rules
const validation = SitesConfig.getCampaignValidation();
```

### Product Config Accessors

```javascript
// Get all product types
const productTypes = SitesConfig.getProductTypes();

// Get specific product type
const ndviMap = SitesConfig.getProductType('ndvi_map');
// Returns: { name: 'NDVI Map', icon: 'fa-leaf', color: '#22c55e', ... }

// Get product type icon
const icon = SitesConfig.getProductTypeIcon('orthomosaic');
// Returns: 'fa-image'

// Get product type color
const color = SitesConfig.getProductTypeColor('point_cloud');
// Returns: '#8b5cf6'

// Get product types by category
const vegetationIndices = SitesConfig.getProductTypesByCategory('vegetation_index');
// Returns: [{ key: 'ndvi_map', name: 'NDVI Map', ... }, { key: 'evi_map', ... }]

// Get all processing level definitions
const levels = SitesConfig.getProcessingLevels();

// Get specific processing level
const l2 = SitesConfig.getProcessingLevel('validated');
// Returns: { code: 'L2', name: 'Validated Data', icon: 'fa-check-double', ... }

// Get all file format definitions
const formats = SitesConfig.getFileFormats();

// Get specific file format
const geotiff = SitesConfig.getFileFormat('geotiff');
// Returns: { extension: '.tif', mime_type: 'image/tiff', ... }

// Get product categories
const categories = SitesConfig.getProductCategories();

// Get quality control configuration
const qcConfig = SitesConfig.getProductQualityControl();
```

### Pagination Config Accessors

```javascript
// Get full pagination configuration
const paginationConfig = SitesConfig.getPaginationConfig();

// Get default pagination settings
const defaults = SitesConfig.getPaginationDefaults();
// Returns: { page_size: 25, page_size_options: [10, 25, 50, 100], ... }

// Get view-specific pagination (merges with defaults)
const instrumentsPagination = SitesConfig.getViewPagination('instruments');
// Returns: { page_size: 25, page_size_options: [...], group_by_type: true, ... }

// Get pagination style configuration
const numberedStyle = SitesConfig.getPaginationStyle('numbered');
// Returns: { name: 'Numbered Pagination', components: {...}, behavior: {...} }

// Get API pagination configuration
const apiPagination = SitesConfig.getAPIPaginationConfig();
// Returns: { defaults: {...}, offset_based: {...}, cursor_based: {...} }

// Get pagination UI components configuration
const uiComponents = SitesConfig.getPaginationUIComponents();
// Returns: { container: {...}, page_buttons: {...}, nav_buttons: {...} }

// Get pagination performance settings
const performance = SitesConfig.getPaginationPerformance();
// Returns: { prefetch: {...}, caching: {...}, virtual_scrolling: {...} }

// Get pagination accessibility settings
const a11y = SitesConfig.getPaginationAccessibility();
// Returns: { aria_labels: {...}, keyboard_navigation: {...}, ... }

// Get pagination mobile settings
const mobile = SitesConfig.getPaginationMobile();
// Returns: { breakpoints: {...}, mobile_settings: {...}, touch_gestures: {...} }
```

### Usage Example

```javascript
// Initialize ConfigService before using
await SitesConfig.init();

// Use configuration values
function createCampaignCard(campaign) {
    const typeConfig = SitesConfig.getCampaignType(campaign.campaign_type);
    const statusConfig = SitesConfig.getCampaignStatus(campaign.status);

    return `
        <div class="campaign-card" style="border-left-color: ${typeConfig.color}">
            <div class="campaign-header">
                <i class="fas ${typeConfig.icon}"></i>
                <h3>${campaign.campaign_name}</h3>
            </div>
            <div class="campaign-status" style="background: ${statusConfig.background}">
                <i class="fas ${statusConfig.icon}"></i>
                <span>${statusConfig.label}</span>
            </div>
        </div>
    `;
}

// Use pagination config
function initializePagination(viewName) {
    const config = SitesConfig.getViewPagination(viewName);

    return new PaginationControls({
        container: `${viewName}-pagination`,
        pageSize: config.page_size,
        pageSizeOptions: config.page_size_options,
        showPageSizeSelector: config.show_page_size_selector,
        style: config.pagination_style
    });
}
```

---

## 7. YAML Configuration Files

The following YAML configuration files define the behavior and appearance of v9.0.0 components.

### api-versions.yaml

**Location:** `yamls/api/api-versions.yaml`

Defines API version configurations, features, and migration paths.

```yaml
api_versions:
  v3:
    version: "3.0.0"
    status: "current"
    is_default: true
    features:
      campaigns: true
      products: true
      pagination: true
      search: true
      bulk_operations: true
    endpoints:
      prefix: "/api/v3"
      authentication: "jwt"
      rate_limits:
        per_minute: 120
        per_hour: 5000
        burst: 200

version_selection:
  default_version: "v3"
  methods:
    url_path:
      enabled: true
      pattern: "/api/{version}/"
    custom_header:
      enabled: true
      header_name: "X-API-Version"
```

**Access via ConfigService:**

```javascript
const currentVersion = SitesConfig.getAPIVersion();
const features = SitesConfig.getAPIFeatures();
```

### campaign-types.yaml

**Location:** `yamls/campaigns/campaign-types.yaml`

Defines campaign types, statuses, and workflow configurations.

```yaml
campaign_types:
  field_survey:
    name: "Field Survey"
    icon: "fa-clipboard-list"
    color: "#2563eb"
    code: "FS"
    required_fields:
      - "campaign_name"
      - "start_date"
      - "station_id"
    workflow:
      planning: "Define objectives"
      execution: "Conduct measurements"
      reporting: "Generate report"

  uav_flight:
    name: "UAV Flight Mission"
    icon: "fa-helicopter"
    color: "#059669"
    code: "UAV"
    flight_regulations:
      max_altitude_m: 120
      requires_clearance: true

campaign_status:
  planning:
    label: "Planning"
    icon: "fa-clipboard"
    color: "#6b7280"
  in_progress:
    label: "In Progress"
    icon: "fa-spinner"
    color: "#f59e0b"
  completed:
    label: "Completed"
    icon: "fa-check-circle"
    color: "#22c55e"
```

**Access via ConfigService:**

```javascript
const campaignTypes = SitesConfig.getCampaignTypes();
const statusConfig = SitesConfig.getCampaignStatus('in_progress');
```

### product-types.yaml

**Location:** `yamls/products/product-types.yaml`

Defines product types, processing levels, and file formats.

```yaml
product_types:
  orthomosaic:
    name: "Orthomosaic"
    icon: "fa-image"
    color: "#2563eb"
    code: "ORTHO"
    category: "imagery"
    file_formats:
      primary: "GeoTIFF"
      alternatives: ["COG", "JPEG2000"]

  ndvi_map:
    name: "NDVI Map"
    icon: "fa-leaf"
    color: "#22c55e"
    code: "NDVI"
    category: "vegetation_index"
    characteristics:
      value_range: [-1.0, 1.0]
      data_type: "float32"

processing_levels:
  raw:
    code: "L0"
    name: "Raw Data"
  processed:
    code: "L1"
    name: "Processed Data"
  validated:
    code: "L2"
    name: "Validated Data"
  published:
    code: "L3"
    name: "Published Data"

file_formats:
  geotiff:
    extension: ".tif"
    mime_type: "image/tiff"
    supports_compression: true
  cog:
    extension: ".tif"
    cloud_optimized: true
```

**Access via ConfigService:**

```javascript
const productTypes = SitesConfig.getProductTypes();
const levels = SitesConfig.getProcessingLevels();
const format = SitesConfig.getFileFormat('geotiff');
```

### pagination.yaml

**Location:** `yamls/ui/pagination.yaml`

Defines pagination defaults, view-specific settings, and styling options.

```yaml
defaults:
  page_size: 25
  page_size_options: [10, 25, 50, 100]
  max_page_size: 100
  pagination_style: "numbered"
  show_total_count: true
  show_first_last_buttons: true
  page_button_count: 5

views:
  instruments:
    page_size: 25
    group_by_type: true
  campaigns:
    page_size: 25
    show_filters: true
    filters: ["status", "type", "date_range"]
  products:
    page_size: 25
    filters: ["type", "processing_level"]

pagination_styles:
  numbered:
    name: "Numbered Pagination"
    components:
      show_prev_next: true
      show_page_numbers: true
      show_ellipsis: true
  load_more:
    name: "Load More"
    components:
      button_text: "Load More"
      loading_text: "Loading..."

api:
  defaults:
    page_size: 25
    max_page_size: 100
    pagination_type: "cursor"
  cursor_based:
    cursor_encoding: "base64"
    cursor_ttl_hours: 24

accessibility:
  keyboard_navigation:
    enabled: true
    shortcuts:
      next_page: "ArrowRight"
      prev_page: "ArrowLeft"
      first_page: "Home"
      last_page: "End"
```

**Access via ConfigService:**

```javascript
const defaults = SitesConfig.getPaginationDefaults();
const viewConfig = SitesConfig.getViewPagination('campaigns');
const a11y = SitesConfig.getPaginationAccessibility();
```

---

## 8. Integration Examples

### Complete Station Dashboard Integration

This example demonstrates integrating multiple v9.0.0 components in a station dashboard.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Station Dashboard - SITES Spectral</title>
    <link rel="stylesheet" href="/css/styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <main class="dashboard">
        <!-- Platform Section -->
        <section class="platforms-section">
            <div class="section-header">
                <h2>Platforms</h2>
                <div id="platform-type-filter"></div>
            </div>
            <div id="platform-list"></div>
            <div id="platform-pagination"></div>
        </section>

        <!-- Campaigns Section -->
        <section class="campaigns-section">
            <div class="section-header">
                <h2>Campaigns</h2>
                <button id="new-campaign-btn" class="btn btn-primary">
                    <i class="fas fa-plus"></i> New Campaign
                </button>
            </div>
            <div id="campaign-filters"></div>
            <div id="campaign-list"></div>
            <div id="campaign-pagination"></div>
        </section>

        <!-- Products Section -->
        <section class="products-section">
            <div class="section-header">
                <h2>Recent Products</h2>
                <div class="view-toggle" id="product-view-toggle">
                    <button class="active" data-view="grid">
                        <i class="fas fa-th"></i>
                    </button>
                    <button data-view="list">
                        <i class="fas fa-list"></i>
                    </button>
                </div>
            </div>
            <div id="product-filters"></div>
            <div id="product-browser"></div>
            <div id="product-pagination"></div>
        </section>
    </main>

    <!-- Modal Container -->
    <div id="modal-container"></div>

    <!-- Scripts -->
    <script src="/js/vendor/js-yaml.min.js"></script>
    <script src="/js/config-loader.js"></script>
    <script src="/js/core/config-service.js"></script>
    <script src="/js/core/debug.js"></script>
    <script src="/js/core/rate-limit.js"></script>
    <script src="/js/api.js"></script>
    <script src="/js/platforms/platform-type-filter.js"></script>
    <script src="/js/ui/pagination-controls.js"></script>
    <script src="/js/campaigns/campaign-manager.js"></script>
    <script src="/js/products/product-browser.js"></script>

    <script>
    (async function() {
        'use strict';

        // Get station from URL
        const stationAcronym = window.location.pathname.split('/').pop();
        let stationData = null;

        // Initialize configuration
        await SitesConfig.init();

        // ==========================================
        // Platform Section
        // ==========================================

        const platformFilter = new PlatformTypeFilter({
            container: 'platform-type-filter',
            showCounts: true,
            onTypeChange: loadPlatforms
        });
        platformFilter.render();

        const platformPagination = new PaginationControls({
            container: 'platform-pagination',
            pageSize: SitesConfig.getViewPagination('station_platforms').page_size,
            onPageChange: (page) => loadPlatforms(platformFilter.getActiveType(), page),
            onPageSizeChange: (size) => loadPlatforms(platformFilter.getActiveType(), 1, size)
        });

        async function loadPlatforms(type = null, page = 1, pageSize = 50) {
            platformPagination.setLoading(true);

            try {
                const options = { page, pageSize };
                const response = type
                    ? await API.getPlatformsByType(stationAcronym, type, options)
                    : await API.getPlatforms(stationAcronym, options);

                renderPlatformList(response.data);
                platformPagination.update({
                    currentPage: page,
                    pageSize: pageSize,
                    totalItems: response.pagination?.total || response.data.length
                });

                // Update filter counts
                const counts = countByType(response.data);
                platformFilter.updateCounts(counts);
            } catch (error) {
                Debug.error('Failed to load platforms', error);
                showError('Failed to load platforms');
            } finally {
                platformPagination.setLoading(false);
            }
        }

        function renderPlatformList(platforms) {
            const container = document.getElementById('platform-list');
            container.innerHTML = platforms.map(platform => {
                const typeConfig = SitesConfig.getPlatformType(platform.platform_type);
                return `
                    <div class="platform-card" data-id="${platform.id}">
                        <div class="platform-icon" style="background: ${typeConfig?.gradient || '#6b7280'}">
                            <i class="fas ${typeConfig?.icon || 'fa-cube'}"></i>
                        </div>
                        <div class="platform-info">
                            <h3>${platform.display_name}</h3>
                            <span class="ecosystem-badge">${platform.ecosystem_code}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // ==========================================
        // Campaign Section
        // ==========================================

        const campaignManager = new CampaignManager({
            container: 'campaign-list',
            stationId: null,  // Will be set after loading station
            editable: true,
            showFilters: true,

            onCampaignSelect: (campaign) => {
                window.location.href = `/campaigns/${campaign.id}`;
            },

            onCampaignCreate: (campaign) => {
                showNotification(`Campaign "${campaign.campaign_name}" created`);
            },

            onCampaignUpdate: () => {
                showNotification('Campaign updated successfully');
            },

            onCampaignDelete: () => {
                showNotification('Campaign deleted');
            }
        });

        document.getElementById('new-campaign-btn').addEventListener('click', () => {
            campaignManager.showCreateModal();
        });

        // ==========================================
        // Product Section
        // ==========================================

        const productBrowser = new ProductBrowser({
            container: 'product-browser',
            viewMode: 'grid',
            showThumbnails: true,
            enableDownload: true,

            onProductSelect: (product) => {
                window.open(`/products/${product.id}`, '_blank');
            },

            onProductDownload: async (product) => {
                showNotification('Download started...');
                await API.downloadProduct(product.id);
            }
        });

        // View toggle
        document.getElementById('product-view-toggle').addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const view = button.dataset.view;
            productBrowser.setViewMode(view);

            // Update active state
            document.querySelectorAll('#product-view-toggle button').forEach(b => {
                b.classList.toggle('active', b === button);
            });
        });

        // ==========================================
        // Initialize Dashboard
        // ==========================================

        async function initDashboard() {
            try {
                // Load station data
                const stationResponse = await API.getStation(stationAcronym);
                stationData = stationResponse.data;

                // Update campaign manager with station ID
                campaignManager.stationId = stationData.id;

                // Load all sections
                await Promise.all([
                    loadPlatforms(),
                    campaignManager.loadCampaigns(),
                    productBrowser.loadProducts()
                ]);

                Debug.log('Dashboard initialized successfully');
            } catch (error) {
                Debug.error('Failed to initialize dashboard', error);
                showError('Failed to load dashboard data');
            }
        }

        // Utility functions
        function countByType(platforms) {
            const counts = { all: platforms.length };
            platforms.forEach(p => {
                const type = p.platform_type || 'fixed';
                counts[type] = (counts[type] || 0) + 1;
            });
            return counts;
        }

        function showNotification(message) {
            // Implementation depends on your notification system
            console.log('Notification:', message);
        }

        function showError(message) {
            console.error('Error:', message);
        }

        // Start initialization
        initDashboard();
    })();
    </script>
</body>
</html>
```

### API Response Handling Pattern

```javascript
/**
 * Standard pattern for handling paginated API responses
 */
async function loadData(endpoint, options = {}) {
    const {
        page = 1,
        pageSize = 25,
        filters = {},
        onSuccess,
        onError,
        paginationControl
    } = options;

    // Show loading state
    if (paginationControl) {
        paginationControl.setLoading(true);
    }

    try {
        // Build request options
        const requestOptions = {
            page,
            pageSize,
            ...filters
        };

        // Make API call
        const response = await API[endpoint](requestOptions);

        // Wrap in V3Response for consistent access
        const v3Response = new V3Response(response);

        if (v3Response.hasData()) {
            // Update pagination
            if (paginationControl) {
                paginationControl.update({
                    currentPage: page,
                    pageSize: pageSize,
                    totalItems: v3Response.getTotalCount()
                });
            }

            // Call success handler
            if (onSuccess) {
                onSuccess(v3Response.data, v3Response);
            }
        } else {
            // Handle empty state
            if (onSuccess) {
                onSuccess([], v3Response);
            }
        }

        return v3Response;
    } catch (error) {
        Debug.error(`Failed to load ${endpoint}`, error);

        if (onError) {
            onError(error);
        }

        throw error;
    } finally {
        if (paginationControl) {
            paginationControl.setLoading(false);
        }
    }
}

// Usage example
await loadData('getInstruments', {
    page: 1,
    pageSize: 25,
    filters: { status: 'Active', type: 'phenocam' },
    paginationControl: instrumentPagination,
    onSuccess: (instruments) => renderInstrumentList(instruments),
    onError: (error) => showErrorMessage('Failed to load instruments')
});
```

---

## Document Information

| Property | Value |
|----------|-------|
| Version | 9.0.0 |
| Created | 2025-12-02 |
| Author | SITES Spectral Development Team |
| Status | Draft |

---

## Related Documentation

- [API Reference](/docs/v3/API_REFERENCE.md)
- [Database Schema](/docs/v3/DATABASE_SCHEMA.md)
- [Security Guidelines](/docs/v3/SECURITY.md)
- [Migration Guide](/docs/v3/MIGRATION_GUIDE.md)
- [CHANGELOG](/CHANGELOG.md)
