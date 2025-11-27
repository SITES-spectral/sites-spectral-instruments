# Modal System - Phase 2: Modular Instruments

**SITES Spectral v8.0.0-alpha.2**

Complete modular, config-driven modal system for instrument management.

---

## Architecture Overview

### Design Principles

1. **Config-Driven**: All dropdown options, labels, and help text loaded from YAML files
2. **Modular Sections**: Each section is self-contained and reusable
3. **Consistent Fields**: All fields use `FormField` class for uniform styling
4. **Accessible**: ARIA labels, keyboard navigation, screen reader support
5. **Reactive**: Real-time validation and dynamic updates
6. **User-Friendly**: Help text, validation messages, character counters

### File Structure

```
public/js/modals/
├── README.md                      # This file
├── modal-base.js                  # Base modal class
├── form-field.js                  # Field generator & validation
└── sections/
    ├── general-info.js            # General Information section
    ├── position.js                # Position & Orientation section
    ├── timeline.js                # Timeline & Deployment section
    ├── system-config.js           # System Configuration section
    └── documentation.js           # Documentation section
```

---

## Components

### 1. ModalBase Class

Base modal with show/hide animations, event handlers, and accessibility.

**Usage:**

```javascript
const modal = new ModalBase('#my-modal', {
    closeOnEscape: true,
    closeOnBackdrop: true,
    showCloseButton: true
});

modal
    .setTitle('Edit Instrument', 'edit')
    .setContent('<p>Modal content here</p>')
    .setFooter([
        {
            text: 'Cancel',
            className: 'btn btn-secondary',
            onClick: () => modal.hide()
        },
        {
            text: 'Save',
            icon: 'save',
            className: 'btn btn-primary',
            onClick: () => modal.save(data)
        }
    ])
    .onSave((data) => {
        console.log('Saving:', data);
        return true; // return false to prevent modal close
    })
    .onCancel(() => {
        console.log('Cancelled');
    })
    .show();
```

**Methods:**

- `show(options)` - Show modal with animation
- `hide(options)` - Hide modal with animation
- `toggle()` - Toggle visibility
- `setTitle(title, icon)` - Set modal title
- `setContent(html)` - Set modal body content
- `setFooter(buttons)` - Set footer buttons
- `onSave(callback)` - Register save handler
- `onCancel(callback)` - Register cancel handler
- `destroy()` - Cleanup and destroy

---

### 2. FormField Class

Generates consistent, accessible form fields.

**Field Types:**

#### Text Input
```javascript
FormField.text({
    id: 'instrument-name',
    label: 'Instrument Name',
    value: 'SVB_FOR_PL01_PHE01',
    placeholder: 'Enter name',
    required: true,
    maxlength: 100,
    helpText: 'Human-readable instrument name',
    validation: {
        required: true,
        custom: (value) => value.length >= 3 || 'Name too short'
    }
})
```

#### Number Input
```javascript
FormField.number({
    id: 'latitude',
    label: 'Latitude',
    value: 64.256,
    min: -90,
    max: 90,
    step: 'any',
    required: true,
    helpText: 'Decimal degrees (WGS84)',
    validation: { type: 'latitude' }
})
```

#### Select Dropdown
```javascript
FormField.select({
    id: 'status',
    label: 'Status',
    value: 'Active',
    options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' }
    ],
    required: true,
    onChange: 'handleStatusChange(this)'
})
```

#### Date Input
```javascript
FormField.date({
    id: 'deployment-date',
    label: 'Deployment Date',
    value: '2020-01-15',
    min: '2010-01-01',
    max: '2030-12-31',
    helpText: 'YYYY-MM-DD format',
    onChange: 'updateYearsActive()'
})
```

#### Textarea
```javascript
FormField.textarea({
    id: 'description',
    label: 'Description',
    value: 'Phenocam monitoring forest canopy',
    rows: 3,
    maxlength: 1000,
    showCharCount: true,
    placeholder: 'Enter description...',
    helpText: 'Detailed instrument description'
})
```

#### Coordinates (Lat/Lon Pair)
```javascript
FormField.coordinates({
    idPrefix: 'instrument',
    latValue: 64.256,
    lonValue: 19.775,
    required: false,
    showMap: true,
    helpText: 'WGS84 decimal degrees'
})
```

#### Toggle Switch
```javascript
FormField.toggle({
    id: 'processing-enabled',
    label: 'Enable Processing',
    checked: true,
    helpText: 'Automatically process data',
    onChange: 'updateProcessingStatus(this)'
})
```

#### Range Slider
```javascript
FormField.range({
    id: 'quality-score',
    label: 'Quality Score',
    value: 85,
    min: 0,
    max: 100,
    step: 1,
    showValue: true,
    onChange: 'updateQualityDisplay(this.value)',
    helpText: 'Overall data quality (0-100)'
})
```

---

### 3. Modal Sections

#### GeneralInfoSection

Basic instrument information fields.

**Usage:**
```javascript
const html = GeneralInfoSection.render(instrument, config);
const data = GeneralInfoSection.extractData(sectionElement);
const { valid, errors } = GeneralInfoSection.validate(data);
```

**Fields:**
- Instrument Name (required)
- Normalized ID (readonly, auto-generated)
- Legacy Acronym
- Status (from YAML config)
- Measurement Status
- Quality Score (slider)

**Config Required:**
```javascript
{
    statusOptions: [
        { value: 'Active', label: 'Active', description: '...' },
        // ... from status.yaml
    ],
    measurementStatusOptions: [
        { value: 'Active', label: 'Active' },
        // ...
    ]
}
```

---

#### PositionSection

Geographic position and orientation fields.

**Usage:**
```javascript
const html = PositionSection.render(instrument, config);
PositionSection.initializeMap(instrument, 'position-map'); // After render
const data = PositionSection.extractData(sectionElement);
const { valid, errors } = PositionSection.validate(data);
```

**Fields:**
- Latitude/Longitude (with validation)
- Height Above Ground
- Viewing Direction (dropdown)
- Azimuth Angle (0-360°)
- Tilt Angle (0-90° from nadir)

**Features:**
- Real-time map preview (Leaflet)
- Coordinate validation
- Map marker updates on coordinate change

---

#### TimelineSection

Deployment timeline and temporal metadata.

**Usage:**
```javascript
const html = TimelineSection.render(instrument, config);
const data = TimelineSection.extractData(sectionElement);
const { valid, errors } = TimelineSection.validate(data);
```

**Fields:**
- Instrument Type (from config, with "Other")
- Ecosystem Code (from ecosystems.yaml)
- Deployment Date
- Decommission Date
- Last Calibration Date
- First/Last Measurement Years
- Platform & Station (readonly)

**Features:**
- Auto-calculated years active
- Calibration status indicators
- Date sequence validation

**Config Required:**
```javascript
{
    instrumentTypes: [
        { value: 'Phenocam', label: 'Phenocam' },
        // ... from instrument-types.yaml
    ],
    ecosystemCodes: [
        { value: 'FOR', label: 'FOR - Forest' },
        // ... from ecosystems.yaml
    ]
}
```

---

#### SystemConfigSection

System configuration and technical details.

**Usage:**
```javascript
const html = SystemConfigSection.render(instrument, config);
const data = SystemConfigSection.extractData(sectionElement);
const { valid, errors } = SystemConfigSection.validate(data);
```

**Fields:**
- Power Source (dropdown)
- Data Transmission Method
- Warranty Expiration (with status)
- Maintenance Schedule
- Processing Enabled (toggle)
- Calibration Notes

**Features:**
- Warranty status indicators
- Days until/since expiration
- Color-coded status badges

**Config Required:**
```javascript
{
    powerSources: [
        { value: 'Solar', label: '☀️ Solar' },
        // ...
    ],
    transmissionMethods: [
        { value: 'WiFi', label: '📡 WiFi' },
        // ...
    ]
}
```

---

#### DocumentationSection

Free-form documentation fields.

**Usage:**
```javascript
const html = DocumentationSection.render(instrument, config);
const data = DocumentationSection.extractData(sectionElement);
const { valid, errors } = DocumentationSection.validate(data);
```

**Fields:**
- Description (1000 chars)
- Installation Notes (1000 chars)
- Maintenance Notes (1000 chars)

**Features:**
- Character counters
- Warning when approaching limit
- Documentation tips panel

---

## Complete Modal Example

### HTML Structure

```html
<div id="instrument-edit-modal" class="modal" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Edit Instrument</h3>
                <button class="modal-close" onclick="modal.hide()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <!-- Sections rendered here -->
            </div>
            <div class="modal-footer">
                <!-- Buttons rendered here -->
            </div>
        </div>
    </div>
</div>
```

### JavaScript Implementation

```javascript
// Load config from YAML (via API)
const config = await fetch('/api/config/modal').then(r => r.json());

// Build modal content
function buildInstrumentModal(instrument) {
    const sections = [
        GeneralInfoSection.render(instrument, config),
        PositionSection.render(instrument, config),
        TimelineSection.render(instrument, config),
        SystemConfigSection.render(instrument, config),
        DocumentationSection.render(instrument, config)
    ].join('');

    return `
        <form id="instrument-form">
            ${sections}
        </form>
    `;
}

// Show modal
const modal = new ModalBase('#instrument-edit-modal');

modal
    .setTitle('Edit Instrument', 'edit')
    .setContent(buildInstrumentModal(instrument))
    .setFooter([
        {
            text: 'Cancel',
            className: 'btn btn-secondary',
            onClick: () => modal.cancel()
        },
        {
            text: 'Save Changes',
            icon: 'save',
            className: 'btn btn-primary',
            attributes: { type: 'submit' },
            onClick: async () => {
                const data = extractAllData();
                const validation = validateAllData(data);

                if (!validation.valid) {
                    showErrors(validation.errors);
                    return false; // Prevent close
                }

                await saveInstrument(data);
                return true; // Allow close
            }
        }
    ])
    .show();

// Initialize map after render
PositionSection.initializeMap(instrument, 'position-map');
```

### Data Extraction

```javascript
function extractAllData() {
    return {
        ...GeneralInfoSection.extractData(document.querySelector('[data-section="general-info"]')),
        ...PositionSection.extractData(document.querySelector('[data-section="position"]')),
        ...TimelineSection.extractData(document.querySelector('[data-section="timeline"]')),
        ...SystemConfigSection.extractData(document.querySelector('[data-section="system-config"]')),
        ...DocumentationSection.extractData(document.querySelector('[data-section="documentation"]'))
    };
}
```

### Validation

```javascript
function validateAllData(data) {
    const validations = [
        GeneralInfoSection.validate(data),
        PositionSection.validate(data),
        TimelineSection.validate(data),
        SystemConfigSection.validate(data),
        DocumentationSection.validate(data)
    ];

    const allErrors = validations.flatMap(v => v.errors);

    return {
        valid: allErrors.length === 0,
        errors: allErrors
    };
}
```

---

## Configuration Loading

### YAML Files

```yaml
# yamls/status.yaml
Active: "Currently operational and collecting data."
Inactive: "Temporarily not in use but can be reactivated."
Testing: "Installed and being tested but not yet fully operational."
# ...

# yamls/ecosystems.yaml
FOR:
  description: "Forest"
  acronym: "FOR"
AGR:
  description: "Arable Land"
  acronym: "AGR"
# ...

# yamls/instruments/instrument-types.yaml
instrument_types:
  phenocam:
    name: "Phenocam"
    description: "Digital camera for repeat photography..."
    icon: "camera"
    color: "#3b82f6"
    code: "PHE"
    # ...
```

### Config Loader

```javascript
class ConfigLoader {
    static async loadAll() {
        const [status, ecosystems, instruments] = await Promise.all([
            fetch('/api/config/status').then(r => r.json()),
            fetch('/api/config/ecosystems').then(r => r.json()),
            fetch('/api/config/instruments').then(r => r.json())
        ]);

        return {
            statusOptions: Object.entries(status).map(([value, description]) => ({
                value,
                label: value,
                description
            })),
            ecosystemCodes: Object.entries(ecosystems).map(([code, info]) => ({
                value: code,
                label: `${code} - ${info.description}`
            })),
            instrumentTypes: Object.entries(instruments.instrument_types).map(([key, info]) => ({
                value: info.name,
                label: info.name
            }))
        };
    }
}
```

---

## Styling

### Required CSS Classes

```css
/* Modal Base */
.modal { display: none; opacity: 0; transition: opacity 0.3s; }
.modal-active { opacity: 1; }
.modal-dialog { max-width: 900px; margin: 2rem auto; }
.modal-content { background: white; border-radius: 8px; }
.modal-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; }
.modal-body { padding: 1.5rem; max-height: 70vh; overflow-y: auto; }
.modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; }

/* Form Sections */
.form-section { margin-bottom: 1.5rem; }
.form-section-header { cursor: pointer; padding: 1rem; background: #f8fafc; }
.form-section-content { padding: 1rem; }
.section-toggle-icon { transition: transform 0.3s; }
.form-section.collapsed .section-toggle-icon { transform: rotate(-90deg); }

/* Form Fields */
.form-group { margin-bottom: 1rem; }
.form-control { width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; }
.field-readonly { background: #f1f5f9; cursor: not-allowed; }
.required-indicator { color: #ef4444; }

/* Validation */
.validation-feedback { font-size: 0.875rem; margin-top: 0.25rem; }
.validation-error { color: #ef4444; }
.is-invalid { border-color: #ef4444; }
.is-valid { border-color: #22c55e; }

/* Character Counter */
.char-counter { text-align: right; font-size: 0.875rem; color: #64748b; }
.char-counter-warning { color: #f59e0b; font-weight: 600; }

/* Quality Badge */
.quality-badge { padding: 0.25rem 0.5rem; border-radius: 4px; }
.quality-badge.high { background: #dcfce7; color: #166534; }
.quality-badge.medium { background: #fef3c7; color: #92400e; }
.quality-badge.low { background: #fee2e2; color: #991b1b; }

/* Status Indicators */
.field-status { padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem; }
.status-success { background: #dcfce7; color: #166534; }
.status-warning { background: #fef3c7; color: #92400e; }
.status-danger { background: #fee2e2; color: #991b1b; }
.status-info { background: #dbeafe; color: #1e40af; }
```

---

## Accessibility Features

1. **ARIA Labels**: All fields have proper `aria-label` attributes
2. **Live Regions**: Character counters use `aria-live="polite"`
3. **Keyboard Navigation**: Tab order, Enter to submit, Escape to close
4. **Screen Reader Support**: Section headers, help text, error messages
5. **Focus Management**: First field focused on modal open
6. **Color Contrast**: WCAG AA compliant color combinations

---

## Migration from v7.0.0

### Old Pattern (modal-sections.js)
```javascript
function renderGeneralInfoSection(instrument) {
    return `<div>...</div>`; // Hard-coded HTML
}
```

### New Pattern (v8.0.0-alpha.2)
```javascript
class GeneralInfoSection {
    static render(instrument, config) {
        return FormField.text({ ... }); // Config-driven
    }
    static extractData(section) { ... }
    static validate(data) { ... }
}
```

### Key Differences

| Feature | v7.0.0 | v8.0.0-alpha.2 |
|---------|--------|----------------|
| Configuration | Hard-coded | YAML-driven |
| Field Generation | Manual HTML | FormField class |
| Validation | Inline | Separate validate() |
| Data Extraction | Manual | extractData() method |
| Reusability | Limited | Highly modular |
| Maintainability | ~1500 lines | ~800 lines |

---

## Testing

### Unit Tests

```javascript
// Test field generation
describe('FormField', () => {
    it('generates text input with validation', () => {
        const html = FormField.text({
            id: 'test',
            label: 'Test',
            required: true
        });
        expect(html).toContain('required');
        expect(html).toContain('aria-label="Test"');
    });
});

// Test section rendering
describe('GeneralInfoSection', () => {
    it('renders all required fields', () => {
        const html = GeneralInfoSection.render(mockInstrument, mockConfig);
        expect(html).toContain('edit-instrument-name');
        expect(html).toContain('edit-instrument-status');
    });

    it('validates data correctly', () => {
        const result = GeneralInfoSection.validate({
            display_name: 'AB', // Too short
            status: 'Active'
        });
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });
});
```

---

## Future Enhancements

1. **Dynamic Section Loading**: Load only sections needed for instrument type
2. **Field Dependencies**: Show/hide fields based on other field values
3. **Auto-Save Drafts**: Save form state to localStorage
4. **Revision History**: Track changes to instrument configuration
5. **Bulk Edit**: Apply changes to multiple instruments
6. **Custom Validators**: Plugin system for field validation
7. **Internationalization**: Multi-language support for labels/help text

---

## Support

For questions or issues, see:
- Main documentation: `/docs/STATION_USER_GUIDE.md`
- CLAUDE.md: Project-wide guidelines
- CHANGELOG.md: Version history

**Version:** 8.0.0-alpha.2
**Last Updated:** 2025-11-27
**Status:** Phase 2 Complete - Ready for Integration
