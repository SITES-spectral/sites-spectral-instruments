# ROI Creation Modal - Quick Start Guide

## 🚀 Get ROI Management Working in 15 Minutes

### Prerequisites
✅ Backend ROI handler already exists (`/src/handlers/rois.js`)
✅ Database schema already configured
✅ API endpoints already functional

**You only need to add the frontend UI!**

## Step 1: Add the Modal (5 minutes)

Open `/lunarc/nobackup/projects/sitesspec/SITES/Spectral/apps/sites-spectral-instruments/public/station.html`

Find the closing `</body>` tag (around line 5300) and insert **ALL contents** of `ROI_CREATION_MODAL.html` just before it:

```html
<!-- Existing modals above... -->

<!-- ========================================
     ROI Creation Modal
     ======================================== -->
<div id="roi-creation-modal" class="platform-modal" style="display: none;">
    <!-- COPY ENTIRE CONTENTS FROM ROI_CREATION_MODAL.html HERE -->
</div>

</body>
</html>
```

## Step 2: Add ROI Display Section (3 minutes)

In the same `station.html` file, find the instrument modal body (around line 1900) and add this section after existing instrument details:

```html
<!-- ROI Section -->
<div class="roi-section">
    <div class="roi-section-header">
        <h4>
            <i class="fas fa-draw-polygon"></i>
            Regions of Interest (ROIs)
            <span class="roi-count-badge" id="roi-count-badge" style="display: none;">0</span>
        </h4>
        <button class="btn btn-sm btn-success" onclick="showROICreationModalFromInstrument()"
                id="create-roi-section-btn" style="display: none;">
            <i class="fas fa-plus"></i> Create ROI
        </button>
    </div>
    <div class="roi-cards-container" id="instrument-rois-container">
        <div class="roi-empty-state" id="roi-empty-state">
            <i class="fas fa-draw-polygon"></i>
            <p>No ROIs defined for this instrument</p>
            <button class="btn btn-primary" onclick="showROICreationModalFromInstrument()">
                <i class="fas fa-plus"></i> Create First ROI
            </button>
        </div>
    </div>
</div>
```

## Step 3: Add JavaScript Functions (5 minutes)

In `station.html`, find the `<script>` section (around line 5000) and add these functions:

```javascript
/**
 * Show ROI creation modal from instrument details
 */
function showROICreationModalFromInstrument() {
    const instrumentId = document.getElementById('instrument-details')?.dataset?.instrumentId;
    const instrumentName = document.getElementById('instrument-details')?.dataset?.instrumentName;

    if (!instrumentId) {
        showNotification('Cannot determine instrument ID', 'error');
        return;
    }

    showROICreationModal(parseInt(instrumentId), instrumentName || 'Unknown');
}

/**
 * Load ROIs for instrument
 */
async function loadInstrumentROIs(instrumentId) {
    try {
        const response = await fetch(`/api/rois?instrument=${instrumentId}`, {
            headers: window.API.getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch ROIs');

        const data = await response.json();
        const rois = data.rois || [];

        // Update count badge
        const countBadge = document.getElementById('roi-count-badge');
        if (countBadge) {
            countBadge.textContent = rois.length;
            countBadge.style.display = rois.length > 0 ? 'inline-block' : 'none';
        }

        const container = document.getElementById('instrument-rois-container');
        const emptyState = document.getElementById('roi-empty-state');

        if (rois.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // Create ROI cards
        let roiHTML = '<div class="roi-cards-grid">';

        rois.forEach(roi => {
            const colorRGB = `rgb(${roi.color_r}, ${roi.color_g}, ${roi.color_b})`;
            const points = JSON.parse(roi.points_json || '[]');
            const autoGenBadge = roi.auto_generated ? '<span class="roi-auto-badge">Auto</span>' : '';

            roiHTML += `
                <div class="roi-card">
                    <div class="roi-card-header" style="border-left: 4px solid ${colorRGB};">
                        <strong>${roi.roi_name}</strong>
                        ${autoGenBadge}
                    </div>
                    <div class="roi-card-body">
                        <div class="roi-card-info">
                            <i class="fas fa-info-circle"></i>
                            <span>${roi.description || 'No description'}</span>
                        </div>
                        <div class="roi-card-info">
                            <i class="fas fa-draw-polygon"></i>
                            <span>${points.length} points</span>
                        </div>
                        <div class="roi-card-info">
                            <i class="fas fa-palette"></i>
                            <span>
                                <span class="roi-color-swatch" style="background-color: ${colorRGB};"></span>
                                RGB(${roi.color_r}, ${roi.color_g}, ${roi.color_b})
                            </span>
                        </div>
                    </div>
                    <div class="roi-card-actions">
                        <button class="btn btn-sm btn-danger" onclick="deleteROI(${roi.id}, '${roi.roi_name}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });

        roiHTML += '</div>';
        container.innerHTML = roiHTML;

    } catch (error) {
        console.error('Error loading ROIs:', error);
    }
}

/**
 * Delete ROI
 */
async function deleteROI(roiId, roiName) {
    if (!confirm(`Delete ROI "${roiName}"?\n\nThis cannot be undone.`)) return;

    try {
        const response = await fetch(`/api/rois/${roiId}`, {
            method: 'DELETE',
            headers: window.API.getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete ROI');
        }

        showNotification(`ROI "${roiName}" deleted successfully`, 'success');

        const instrumentId = document.getElementById('instrument-details')?.dataset?.instrumentId;
        if (instrumentId) {
            await loadInstrumentROIs(parseInt(instrumentId));
        }

    } catch (error) {
        console.error('Error deleting ROI:', error);
        showNotification(error.message, 'error');
    }
}

/**
 * Refresh instrument modal after ROI operations
 */
async function refreshInstrumentModal() {
    const instrumentId = document.getElementById('instrument-details')?.dataset?.instrumentId;
    if (instrumentId && document.getElementById('instrument-modal').style.display === 'flex') {
        await loadInstrumentROIs(parseInt(instrumentId));
    }
}
```

## Step 4: Add CSS Styles (2 minutes)

In `station.html`, find the `<style>` section (around line 200) and add:

```css
/* ROI Section */
.roi-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 2px solid #e5e7eb;
}

.roi-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e5e7eb;
}

.roi-section-header h4 {
    margin: 0;
    color: #059669;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.roi-count-badge {
    display: inline-block;
    background: #059669;
    color: white;
    padding: 0.25rem 0.625rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
}

.roi-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem 2rem;
    background: #f9fafb;
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    color: #6b7280;
}

.roi-empty-state i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.3;
}

.roi-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
}

.roi-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
}

.roi-card:hover {
    border-color: #059669;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.15);
    transform: translateY(-2px);
}

.roi-card-header {
    padding: 0.875rem 1rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.roi-card-header strong {
    color: #059669;
    font-family: 'Courier New', monospace;
}

.roi-auto-badge {
    background: #fbbf24;
    color: #78350f;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
}

.roi-card-body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.roi-card-info {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    font-size: 0.875rem;
    color: #6b7280;
}

.roi-card-info i {
    color: #9ca3af;
    width: 16px;
}

.roi-color-swatch {
    display: inline-block;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 2px solid #e5e7eb;
    vertical-align: middle;
    margin-right: 0.25rem;
}

.roi-card-actions {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
}

.roi-card-actions .btn {
    flex: 1;
}
```

## Step 5: Update Instrument Modal (1 minute)

Find the `showInstrumentModal()` function and add these lines:

```javascript
async function showInstrumentModal(instrumentId) {
    // ... existing code to load instrument data ...

    // ADD THIS: Store instrument ID for ROI creation
    const detailsContainer = document.getElementById('instrument-details');
    detailsContainer.dataset.instrumentId = instrumentId;
    detailsContainer.dataset.instrumentName = instrument.normalized_name;

    // ADD THIS: Load ROIs
    await loadInstrumentROIs(instrumentId);

    // ADD THIS: Show create button for authorized users
    const user = window.API.getUser();
    if (user && (user.role === 'admin' || user.role === 'station')) {
        document.getElementById('create-roi-section-btn').style.display = 'inline-flex';
    }

    // ... rest of existing code ...
}
```

## ✅ Done! Test It Out

1. **Clear browser cache**: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
2. **Hard refresh**: Ctrl+F5 (or Cmd+Shift+R on Mac)
3. **Login** as admin or station user
4. **Open any instrument** details modal
5. **Click "Create ROI"** button
6. **Draw a polygon** or upload YAML
7. **Save** and see it appear in the ROI list!

## Quick Test Workflow

### Interactive Drawing Test
```
1. Click "Create ROI" → Modal opens
2. Click "Upload Image" → Load test image
3. Click 4 points on canvas → Polygon appears
4. Right-click → Polygon closes
5. Select color (e.g., Red preset)
6. Set thickness to 5
7. Enter description: "Test ROI"
8. Click "Save ROI" → Success!
9. Check instrument modal → ROI appears in list
```

### YAML Upload Test
```
1. Click "Create ROI" → Modal opens
2. Switch to "YAML Upload" tab
3. Create test.yaml with ROI data
4. Drag file to drop zone → Preview appears
5. Select ROIs to import (checkboxes)
6. Click "Import Selected ROIs" → Success!
7. Check instrument modal → ROIs appear in list
```

## Common Issues & Fixes

### Modal doesn't open
- Check browser console for JavaScript errors
- Verify all HTML was copied correctly
- Ensure closing `</script>` and `</style>` tags are present

### "Create ROI" button not visible
- Verify user is logged in as admin or station user
- Check `showInstrumentModal()` was updated correctly
- Inspect element to see if button exists but is hidden

### ROIs don't display
- Check browser console Network tab for API errors
- Verify `/api/rois?instrument=X` endpoint returns data
- Check `loadInstrumentROIs()` function is being called

### Canvas drawing not working
- Verify image uploaded successfully
- Check canvas element exists in DOM
- Look for JavaScript errors in console

## Need YAML Parsing?

Add js-yaml library to `<head>` section:

```html
<script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
```

Then update `parseYAMLROIs()` function in the modal JavaScript:

```javascript
function parseYAMLROIs(yamlText) {
    try {
        const data = jsyaml.load(yamlText);
        if (!data.rois) throw new Error('YAML must contain "rois" object');
        displayYAMLPreview(data.rois);
    } catch (error) {
        showNotification('Error parsing YAML: ' + error.message, 'error');
    }
}
```

## API Test with curl

```bash
# Create ROI
curl -X POST https://sites.jobelab.com/api/rois \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instrument_id": 1,
    "roi_name": "ROI_01",
    "description": "Test ROI",
    "color_r": 255,
    "color_g": 0,
    "color_b": 0,
    "thickness": 7,
    "points_json": "[[100,100],[200,100],[200,200],[100,200]]"
  }'

# Get ROIs
curl -X GET "https://sites.jobelab.com/api/rois?instrument=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Deployment

```bash
# Build and deploy
npm run build
npm run deploy

# Or combine version bump + deploy
npm run deploy:bump
```

## Support

- **Full Documentation**: See `ROI_IMPLEMENTATION_SUMMARY.md`
- **Integration Guide**: See `ROI_MODAL_INTEGRATION_GUIDE.md`
- **Code Examples**: See `ROI_BUTTON_INTEGRATION_EXAMPLE.html`
- **Modal Code**: See `ROI_CREATION_MODAL.html`

---

**🎉 That's it! You now have a complete, professional ROI management system!**

**Next Steps:**
- Test with real instrument images
- Create ROIs for multiple instruments
- Try batch YAML import
- Customize colors and styles
- Add ROI visualization features
