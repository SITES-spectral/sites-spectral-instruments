# UI Form Components Documentation
## Enhanced CRUD Modal Implementation

---

## 📋 Form Field Components

### Camera Specifications Fieldset

```html
<fieldset class="mb-4">
  <legend class="h5 mb-3">
    <i class="fas fa-camera me-2"></i>Camera Specifications
  </legend>
  <div class="row">
    <!-- Aperture Field -->
    <div class="col-md-6 mb-3">
      <label for="aperture" class="form-label">
        Aperture <span class="text-muted">(f-stop)</span>
        <i class="fas fa-info-circle ms-1" data-bs-toggle="tooltip"
           title="Controls depth of field and light intake. Smaller f-numbers = wider aperture = more light"></i>
      </label>
      <div class="input-group">
        <span class="input-group-text">f/</span>
        <input type="text" class="form-control" id="aperture" name="aperture"
               placeholder="2.8" pattern="[\d.]+" data-validation="aperture">
      </div>
      <div class="invalid-feedback" id="aperture-error"></div>
      <div class="form-text">e.g., 2.8, 5.6, 8.0</div>
    </div>

    <!-- Exposure Time Field -->
    <div class="col-md-6 mb-3">
      <label for="exposureTime" class="form-label">
        Exposure Time <span class="text-muted">(shutter speed)</span>
        <i class="fas fa-info-circle ms-1" data-bs-toggle="tooltip"
           title="Controls motion blur and exposure. Faster speeds freeze motion, slower speeds allow more light"></i>
      </label>
      <input type="text" class="form-control" id="exposureTime" name="exposure_time"
             placeholder="1/60" data-validation="exposureTime">
      <div class="invalid-feedback" id="exposureTime-error"></div>
      <div class="form-text">e.g., 1/60, 1/125, 2.0</div>
    </div>

    <!-- Focal Length Field -->
    <div class="col-md-6 mb-3">
      <label for="focalLength" class="form-label">
        Focal Length <span class="text-muted">(mm)</span>
        <i class="fas fa-info-circle ms-1" data-bs-toggle="tooltip"
           title="Determines field of view. Shorter lengths = wider view, longer lengths = magnified view"></i>
      </label>
      <div class="input-group">
        <input type="number" class="form-control" id="focalLength" name="focal_length"
               placeholder="50" min="1" max="1000" data-validation="focalLength">
        <span class="input-group-text">mm</span>
      </div>
      <div class="invalid-feedback" id="focalLength-error"></div>
      <div class="form-text">e.g., 18, 50, 200</div>
    </div>

    <!-- ISO Field -->
    <div class="col-md-6 mb-3">
      <label for="iso" class="form-label">
        ISO <span class="text-muted">(sensitivity)</span>
        <i class="fas fa-info-circle ms-1" data-bs-toggle="tooltip"
           title="Sensor sensitivity to light. Higher ISO = more sensitive but potentially more noise"></i>
      </label>
      <select class="form-select" id="iso" name="iso" data-validation="iso">
        <option value="">Select ISO...</option>
        <option value="50">50 (Very low noise, bright light)</option>
        <option value="100">100 (Low noise, good light)</option>
        <option value="200">200 (Slightly overcast)</option>
        <option value="400">400 (Overcast, early/late day)</option>
        <option value="800">800 (Low light conditions)</option>
        <option value="1600">1600 (Very low light)</option>
        <option value="3200">3200 (Extreme low light)</option>
      </select>
      <div class="invalid-feedback" id="iso-error"></div>
    </div>

    <!-- Lens Field -->
    <div class="col-12 mb-3">
      <label for="lens" class="form-label">
        Lens <span class="text-muted">(complete specifications)</span>
        <i class="fas fa-info-circle ms-1" data-bs-toggle="tooltip"
           title="Complete lens model including manufacturer and specifications"></i>
      </label>
      <input type="text" class="form-control" id="lens" name="lens"
             placeholder="Canon EF 50mm f/1.8 STM" data-validation="lens">
      <div class="invalid-feedback" id="lens-error"></div>
      <div class="form-text">Include manufacturer, model, and key specifications</div>
    </div>

    <!-- Mega Pixels Field -->
    <div class="col-md-6 mb-3">
      <label for="megaPixels" class="form-label">
        Resolution <span class="text-muted">(MP)</span>
        <i class="fas fa-info-circle ms-1" data-bs-toggle="tooltip"
           title="Camera sensor resolution. Higher resolution provides more detail for analysis"></i>
      </label>
      <div class="input-group">
        <input type="number" class="form-control" id="megaPixels" name="mega_pixels"
               placeholder="24.7" step="0.1" min="1" max="100" data-validation="megaPixels">
        <span class="input-group-text">MP</span>
      </div>
      <div class="invalid-feedback" id="megaPixels-error"></div>
      <div class="form-text">e.g., 12.3, 24.7, 45.0</div>
    </div>

    <!-- White Balance Field -->
    <div class="col-md-6 mb-3">
      <label for="whiteBalance" class="form-label">
        White Balance <span class="text-muted">(color temperature)</span>
        <i class="fas fa-info-circle ms-1" data-bs-toggle="tooltip"
           title="Adjusts colors for different lighting conditions to ensure accurate vegetation color analysis"></i>
      </label>
      <select class="form-select" id="whiteBalance" name="white_balance" data-validation="whiteBalance">
        <option value="">Select white balance...</option>
        <option value="Auto">Auto (camera automatic)</option>
        <option value="Daylight">Daylight (5600K) - Standard outdoor</option>
        <option value="Cloudy">Cloudy (6500K) - Overcast conditions</option>
        <option value="Shade">Shade (7500K) - Shaded areas</option>
        <option value="Tungsten">Tungsten (3200K) - Artificial light</option>
        <option value="Fluorescent">Fluorescent (4000K) - Lab conditions</option>
        <option value="Flash">Flash (5500K) - Camera flash</option>
        <option value="Manual">Manual (custom setting)</option>
      </select>
      <div class="invalid-feedback" id="whiteBalance-error"></div>
    </div>
  </div>
</fieldset>
```

### Research Programs Multiselect Component

```html
<fieldset class="mb-4">
  <legend class="h5 mb-3">
    <i class="fas fa-network-wired me-2"></i>Research Programs
  </legend>

  <!-- Research Programs Selection -->
  <div class="mb-3">
    <label for="researchPrograms" class="form-label">
      Associated Research Programs
      <i class="fas fa-info-circle ms-1" data-bs-toggle="tooltip"
         title="Select all research networks that will use this instrument's data. Hold Ctrl (Cmd on Mac) for multiple selections."></i>
    </label>

    <select class="form-select" id="researchPrograms" name="research_programs"
            multiple size="8" data-validation="researchPrograms">
      <optgroup label="Primary SITES Networks">
        <option value="SITES_SPECTRAL" data-description="Swedish Infrastructure for Ecosystem Science spectral monitoring">
          SITES Spectral
        </option>
        <option value="ICOS" data-description="Integrated Carbon Observation System">
          ICOS (Carbon Observation System)
        </option>
      </optgroup>

      <optgroup label="European Networks">
        <option value="LTER" data-description="Long Term Ecological Research">
          LTER (Long Term Ecological Research)
        </option>
        <option value="ELTER" data-description="European Long Term Ecological Research Infrastructure">
          eLTER (European LTER Infrastructure)
        </option>
        <option value="ENVRI" data-description="Environmental Research Infrastructures">
          EnvRi (Environmental Research Infrastructures)
        </option>
        <option value="INTERACT" data-description="International Network for Terrestrial Research and Monitoring in the Arctic">
          INTERACT (Arctic Research Network)
        </option>
      </optgroup>

      <optgroup label="Global Networks">
        <option value="PHENOCAM" data-description="Continental-scale phenology observations">
          PhenoCam Network
        </option>
        <option value="FLUXNET" data-description="Global network of micrometeorological flux measurement sites">
          FLUXNET
        </option>
        <option value="NEON" data-description="National Ecological Observatory Network">
          NEON (US Ecological Observatory)
        </option>
      </optgroup>

      <optgroup label="Data Management">
        <option value="DEIMS_SDR" data-description="Dynamic Ecological Information Management System">
          DEIMS-SDR (Ecological Information Management)
        </option>
      </optgroup>
    </select>

    <div class="invalid-feedback" id="researchPrograms-error"></div>
    <div class="form-text">
      <strong>Selection Help:</strong> Hold <kbd>Ctrl</kbd> (Windows) or <kbd>⌘ Cmd</kbd> (Mac) to select multiple programs.
      Click to deselect. Choose all networks that will access this instrument's data.
    </div>

    <!-- Selected Programs Display -->
    <div class="mt-2">
      <small class="text-muted">Selected programs: </small>
      <span id="selectedProgramsDisplay" class="badge bg-secondary me-1">None selected</span>
    </div>
  </div>

  <!-- Program Selection Shortcuts -->
  <div class="mb-3">
    <label class="form-label">Quick Selection:</label>
    <div class="btn-group" role="group" aria-label="Program selection shortcuts">
      <button type="button" class="btn btn-outline-secondary btn-sm" onclick="selectProgramGroup('sites')">
        <i class="fas fa-leaf me-1"></i>SITES Only
      </button>
      <button type="button" class="btn btn-outline-secondary btn-sm" onclick="selectProgramGroup('european')">
        <i class="fas fa-flag me-1"></i>European Networks
      </button>
      <button type="button" class="btn btn-outline-secondary btn-sm" onclick="selectProgramGroup('global')">
        <i class="fas fa-globe me-1"></i>Global Networks
      </button>
      <button type="button" class="btn btn-outline-secondary btn-sm" onclick="selectProgramGroup('clear')">
        <i class="fas fa-times me-1"></i>Clear All
      </button>
    </div>
  </div>
</fieldset>
```

### Enhanced Ecosystem Code Component

```html
<fieldset class="mb-4">
  <legend class="h5 mb-3">
    <i class="fas fa-tree me-2"></i>Ecosystem Classification
  </legend>

  <div class="mb-3">
    <label for="ecosystemCode" class="form-label">
      Primary Ecosystem Code <span class="text-danger">*</span>
      <i class="fas fa-info-circle ms-1" data-bs-toggle="tooltip"
         title="Select the primary ecosystem type being monitored. Choose the most specific code that accurately describes the area."></i>
    </label>

    <select class="form-select" id="ecosystemCode" name="ecosystem_code"
            required data-validation="ecosystemCode">
      <option value="">Select primary ecosystem type...</option>

      <optgroup label="🌲 Forest Ecosystems">
        <option value="FOR" data-description="Mixed or unspecified forest types">
          FOR - General Forest
        </option>
        <option value="CON" data-description="Spruce, pine, fir dominated forests">
          CON - Coniferous Forest
        </option>
        <option value="DEC" data-description="Birch, oak, beech dominated forests">
          DEC - Deciduous Forest
        </option>
        <option value="ALP" data-description="High-elevation forest ecosystems">
          ALP - Alpine Forest
        </option>
      </optgroup>

      <optgroup label="🌾 Wetland Ecosystems">
        <option value="MIR" data-description="Bog and fen peatland systems">
          MIR - Mires
        </option>
        <option value="WET" data-description="Non-peat wetland areas">
          WET - General Wetland
        </option>
        <option value="PEA" data-description="Specialized peat-forming wetlands">
          PEA - Peatland
        </option>
        <option value="MAR" data-description="Seasonal or permanent marsh areas">
          MAR - Marshland
        </option>
      </optgroup>

      <optgroup label="🌱 Open Ecosystems">
        <option value="HEA" data-description="Shrub-dominated open areas">
          HEA - Heathland
        </option>
        <option value="GRA" data-description="Natural and semi-natural grasslands">
          GRA - Grassland
        </option>
        <option value="AGR" data-description="Agricultural and cultivated areas">
          AGR - Arable Land
        </option>
      </optgroup>

      <optgroup label="💧 Aquatic Ecosystems">
        <option value="LAK" data-description="Freshwater lake ecosystems">
          LAK - Lake
        </option>
      </optgroup>
    </select>

    <div class="invalid-feedback" id="ecosystemCode-error"></div>

    <!-- Ecosystem Description Display -->
    <div class="form-text mt-2">
      <div id="ecosystemDescription" class="text-muted">
        Select an ecosystem type to see detailed description...
      </div>
    </div>
  </div>

  <!-- Ecosystem Selection Help -->
  <div class="alert alert-info">
    <h6 class="alert-heading">
      <i class="fas fa-lightbulb me-2"></i>Selection Guidelines
    </h6>
    <ul class="mb-0 small">
      <li><strong>Mixed Ecosystems:</strong> Choose the dominant ecosystem type (>50% coverage)</li>
      <li><strong>Transitional Areas:</strong> Select the ecosystem type most relevant to research objectives</li>
      <li><strong>Uncertainty:</strong> Consult with ecological specialists for complex classifications</li>
      <li><strong>Changes:</strong> Can be updated if ecosystem management or disturbance changes characteristics</li>
    </ul>
  </div>
</fieldset>
```

---

## 🎨 CSS Styling for Enhanced Components

```css
/* Camera Specifications Styling */
.camera-specs-fieldset {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.camera-specs-fieldset legend {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  color: #495057;
}

/* Research Programs Multi-select Styling */
.research-programs-select {
  min-height: 200px;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.research-programs-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.research-programs-select option {
  padding: 8px 12px;
  border-bottom: 1px solid #f8f9fa;
}

.research-programs-select option:hover {
  background-color: #e3f2fd;
}

.research-programs-select option:selected {
  background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%);
  color: white;
  font-weight: 500;
}

/* Program Selection Badges */
.program-badge {
  display: inline-block;
  padding: 0.35em 0.65em;
  margin: 0.25em 0.25em 0.25em 0;
  font-size: 0.75em;
  font-weight: 500;
  line-height: 1;
  color: #fff;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 0.375rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  transition: all 0.2s ease-in-out;
}

.program-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Ecosystem Code Styling */
.ecosystem-select {
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.ecosystem-select:focus {
  border-color: #198754;
  box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
}

.ecosystem-select optgroup {
  font-weight: 600;
  color: #495057;
  background: #f8f9fa;
}

.ecosystem-select option {
  padding: 8px 12px;
  font-weight: 500;
}

/* Info Icons and Tooltips */
.info-icon {
  color: #6c757d;
  cursor: help;
  transition: color 0.2s ease;
}

.info-icon:hover {
  color: #0d6efd;
}

/* Validation Styling */
.form-control.is-invalid,
.form-select.is-invalid {
  border-color: #dc3545;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 5.8 2.4 2.4'/%3e%3cpath d='m8.2 5.8-2.4 2.4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.form-control.is-valid,
.form-select.is-valid {
  border-color: #198754;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='m2.3 6.73 1.64 1.64L7.59 4.72 6.95 4.08 3.94 7.09 2.94 6.09z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

/* Loading States */
.form-loading {
  position: relative;
  pointer-events: none;
  opacity: 0.6;
}

.form-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #0d6efd;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .camera-specs-fieldset {
    padding: 1rem;
  }

  .research-programs-select {
    min-height: 150px;
  }

  .btn-group .btn {
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .camera-specs-fieldset {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    border-color: #495057;
    color: #f8f9fa;
  }

  .camera-specs-fieldset legend {
    background: #2c3e50;
    border-color: #495057;
    color: #f8f9fa;
  }

  .research-programs-select option:hover {
    background-color: #495057;
  }

  .ecosystem-select optgroup {
    background: #2c3e50;
    color: #f8f9fa;
  }
}
```

---

## ⚡ JavaScript Form Interactions

```javascript
// Enhanced Form Validation and Interactions
class EnhancedInstrumentForm {
  constructor(formId) {
    this.form = document.getElementById(formId);
    this.validators = new Map();
    this.initializeValidators();
    this.initializeInteractions();
  }

  initializeValidators() {
    // Camera specification validators
    this.validators.set('aperture', {
      pattern: /^f?\/?\d*\.?\d+$/,
      message: 'Enter aperture in f-stop format (e.g., f/2.8, 5.6)',
      transform: (value) => value.replace(/^f?\/?/, 'f/')
    });

    this.validators.set('exposureTime', {
      pattern: /^(\d+\/\d+|\d*\.?\d+)$/,
      message: 'Enter exposure time as fraction (1/60) or decimal (0.5)',
      validate: (value) => {
        if (value.includes('/')) {
          const [num, denom] = value.split('/').map(Number);
          return num > 0 && denom > 0 && denom >= num;
        }
        return parseFloat(value) > 0;
      }
    });

    this.validators.set('focalLength', {
      pattern: /^\d+$/,
      message: 'Enter focal length as numeric value (lens unit will be added)',
      validate: (value) => {
        const num = parseInt(value);
        return num >= 8 && num <= 1000;
      }
    });

    this.validators.set('iso', {
      validate: (value) => {
        const num = parseInt(value);
        return num >= 50 && num <= 6400 && [50, 100, 200, 400, 800, 1600, 3200, 6400].includes(num);
      },
      message: 'Select a standard ISO value from the dropdown'
    });

    this.validators.set('megaPixels', {
      validate: (value) => {
        const num = parseFloat(value);
        return num >= 1 && num <= 100;
      },
      message: 'Enter resolution between 1 and 100 megapixels'
    });

    this.validators.set('lens', {
      minLength: 5,
      message: 'Enter complete lens specifications including manufacturer'
    });

    this.validators.set('whiteBalance', {
      required: true,
      message: 'Select white balance setting for color accuracy'
    });

    this.validators.set('researchPrograms', {
      validate: (value) => Array.isArray(value) && value.length > 0,
      message: 'Select at least one research program'
    });

    this.validators.set('ecosystemCode', {
      required: true,
      validate: (value) => ['FOR', 'CON', 'DEC', 'ALP', 'MIR', 'WET', 'PEA', 'MAR', 'HEA', 'GRA', 'AGR', 'LAK'].includes(value),
      message: 'Select a valid ecosystem code'
    });
  }

  initializeInteractions() {
    // Research programs multiselect enhancement
    this.setupResearchProgramsInteraction();

    // Ecosystem code description display
    this.setupEcosystemDescriptions();

    // Camera specifications auto-formatting
    this.setupCameraSpecFormatting();

    // Real-time validation
    this.setupRealTimeValidation();

    // Tooltips
    this.initializeTooltips();
  }

  setupResearchProgramsInteraction() {
    const select = document.getElementById('researchPrograms');
    const display = document.getElementById('selectedProgramsDisplay');

    if (!select || !display) return;

    select.addEventListener('change', () => {
      const selected = Array.from(select.selectedOptions).map(opt => opt.textContent.trim());

      if (selected.length === 0) {
        display.innerHTML = '<span class="badge bg-secondary">None selected</span>';
      } else {
        display.innerHTML = selected.map(prog =>
          `<span class="badge bg-primary me-1">${prog}</span>`
        ).join('');
      }
    });

    // Quick selection buttons
    window.selectProgramGroup = (group) => {
      const options = select.querySelectorAll('option');

      // Clear all selections first
      options.forEach(opt => opt.selected = false);

      switch (group) {
        case 'sites':
          select.querySelector('option[value="SITES_SPECTRAL"]').selected = true;
          select.querySelector('option[value="ICOS"]').selected = true;
          break;
        case 'european':
          ['LTER', 'ELTER', 'ENVRI', 'INTERACT'].forEach(code => {
            const opt = select.querySelector(`option[value="${code}"]`);
            if (opt) opt.selected = true;
          });
          break;
        case 'global':
          ['PHENOCAM', 'FLUXNET', 'NEON'].forEach(code => {
            const opt = select.querySelector(`option[value="${code}"]`);
            if (opt) opt.selected = true;
          });
          break;
        case 'clear':
          // Already cleared above
          break;
      }

      // Trigger change event
      select.dispatchEvent(new Event('change'));
    };
  }

  setupEcosystemDescriptions() {
    const select = document.getElementById('ecosystemCode');
    const description = document.getElementById('ecosystemDescription');

    if (!select || !description) return;

    const descriptions = {
      'FOR': 'Mixed or unspecified forest types - Use when forest composition is diverse or unknown',
      'CON': 'Coniferous forests dominated by spruce, pine, or fir - Common in northern Sweden',
      'DEC': 'Deciduous forests dominated by birch, oak, or beech - Often found in southern regions',
      'ALP': 'High-elevation forest ecosystems above the montane zone - Alpine and subalpine forests',
      'MIR': 'Bog and fen peatland systems - Nutrient-poor wetlands with specialized vegetation',
      'WET': 'General wetland areas not classified as peatlands - Seasonal or permanent wet areas',
      'PEA': 'Specialized peat-forming wetlands - Deep organic soil accumulation areas',
      'MAR': 'Seasonal or permanent marsh areas - Often associated with lake margins or rivers',
      'HEA': 'Shrub-dominated open areas - Heath vegetation on acidic soils',
      'GRA': 'Natural and semi-natural grasslands - Meadows and pastures',
      'AGR': 'Agricultural and cultivated areas - Crop fields and managed farmland',
      'LAK': 'Freshwater lake ecosystems - Open water or littoral zone monitoring'
    };

    select.addEventListener('change', () => {
      const selected = select.value;
      if (selected && descriptions[selected]) {
        description.innerHTML = `<strong>${selected}:</strong> ${descriptions[selected]}`;
        description.className = 'text-info';
      } else {
        description.innerHTML = 'Select an ecosystem type to see detailed description...';
        description.className = 'text-muted';
      }
    });
  }

  setupCameraSpecFormatting() {
    // Aperture formatting
    const apertureField = document.getElementById('aperture');
    if (apertureField) {
      apertureField.addEventListener('blur', () => {
        let value = apertureField.value.trim();
        if (value && !value.startsWith('f/')) {
          apertureField.value = `f/${value}`;
        }
      });
    }

    // Focal length formatting
    const focalLengthField = document.getElementById('focalLength');
    if (focalLengthField) {
      focalLengthField.addEventListener('input', () => {
        // Remove non-numeric characters
        focalLengthField.value = focalLengthField.value.replace(/[^\d]/g, '');
      });
    }

    // Mega pixels formatting
    const megaPixelsField = document.getElementById('megaPixels');
    if (megaPixelsField) {
      megaPixelsField.addEventListener('blur', () => {
        const value = parseFloat(megaPixelsField.value);
        if (!isNaN(value)) {
          megaPixelsField.value = value.toFixed(1);
        }
      });
    }
  }

  setupRealTimeValidation() {
    this.form.querySelectorAll('[data-validation]').forEach(field => {
      field.addEventListener('blur', () => this.validateField(field));
      field.addEventListener('input', () => this.clearFieldError(field));
    });
  }

  validateField(field) {
    const validatorName = field.dataset.validation;
    const validator = this.validators.get(validatorName);

    if (!validator) return true;

    let value = field.value;
    let isValid = true;
    let message = '';

    // Transform value if transformer exists
    if (validator.transform) {
      value = validator.transform(value);
      field.value = value;
    }

    // Check required
    if (validator.required && !value.trim()) {
      isValid = false;
      message = `${field.labels[0]?.textContent || 'Field'} is required`;
    }

    // Check minimum length
    if (isValid && validator.minLength && value.length < validator.minLength) {
      isValid = false;
      message = `Minimum ${validator.minLength} characters required`;
    }

    // Check pattern
    if (isValid && validator.pattern && !validator.pattern.test(value)) {
      isValid = false;
      message = validator.message;
    }

    // Custom validation
    if (isValid && validator.validate && !validator.validate(value)) {
      isValid = false;
      message = validator.message;
    }

    // Handle multiselect
    if (field.multiple) {
      const selectedValues = Array.from(field.selectedOptions).map(opt => opt.value);
      if (validator.validate && !validator.validate(selectedValues)) {
        isValid = false;
        message = validator.message;
      }
    }

    // Update field appearance
    if (isValid) {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
      this.clearFieldError(field);
    } else {
      field.classList.remove('is-valid');
      field.classList.add('is-invalid');
      this.showFieldError(field, message);
    }

    return isValid;
  }

  showFieldError(field, message) {
    const errorElement = document.getElementById(`${field.id}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  clearFieldError(field) {
    const errorElement = document.getElementById(`${field.id}-error`);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  initializeTooltips() {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = this.form.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl =>
      new bootstrap.Tooltip(tooltipTriggerEl)
    );
  }

  validateForm() {
    let isFormValid = true;

    this.form.querySelectorAll('[data-validation]').forEach(field => {
      if (!this.validateField(field)) {
        isFormValid = false;
      }
    });

    return isFormValid;
  }

  getFormData() {
    const formData = new FormData(this.form);
    const data = {};

    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
      if (data[key]) {
        // Handle multiple values (like research programs)
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }

    // Handle research programs multiselect
    const researchPrograms = document.getElementById('researchPrograms');
    if (researchPrograms) {
      data.research_programs = Array.from(researchPrograms.selectedOptions).map(opt => opt.value);
    }

    return data;
  }
}

// Initialize enhanced form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('instrumentForm')) {
    window.enhancedInstrumentForm = new EnhancedInstrumentForm('instrumentForm');
  }
});
```

This comprehensive UI form components documentation provides:

1. **Complete HTML form components** with proper accessibility and validation
2. **Advanced CSS styling** with responsive design and dark mode support
3. **Interactive JavaScript functionality** for enhanced user experience
4. **Real-time validation** with clear error messaging
5. **Progressive enhancement** for all form interactions
6. **Professional presentation** matching the scientific research context

The components are designed to be modular, accessible, and easily integrable into your existing SITES Spectral system architecture.