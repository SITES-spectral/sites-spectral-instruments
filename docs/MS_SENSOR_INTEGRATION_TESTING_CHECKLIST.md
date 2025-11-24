# Multispectral Sensor Integration Testing Checklist

**Version:** 1.0.0
**Created:** 2025-11-24
**Purpose:** Comprehensive manual testing checklist for MS sensor functionality after fixes are applied
**Production URL:** https://sites.jobelab.com

---

## Table of Contents

1. [Pre-Testing Setup](#1-pre-testing-setup)
2. [API Endpoint Tests](#2-api-endpoint-tests)
3. [Frontend Modal Tests](#3-frontend-modal-tests)
4. [Data Flow Tests](#4-data-flow-tests)
5. [Error Handling Tests](#5-error-handling-tests)
6. [Permission Tests](#6-permission-tests)
7. [Channel Management Tests](#7-channel-management-tests)
8. [Sensor Models Library Tests](#8-sensor-models-library-tests)
9. [Validation Tests](#9-validation-tests)
10. [Post-Testing Cleanup](#10-post-testing-cleanup)

---

## 1. Pre-Testing Setup

### 1.1 Environment Preparation
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Open browser developer console (F12)
- [ ] Verify production URL is accessible: https://sites.jobelab.com
- [ ] Confirm current application version in footer/header

### 1.2 Test Accounts Ready
- [ ] Admin account credentials available
- [ ] Station user account credentials available (e.g., SVB station user)
- [ ] Read-only user account credentials available (if applicable)

### 1.3 Test Station Selection
- [ ] Select test station (recommended: Svartberget - SVB)
- [ ] Note the station ID for API testing
- [ ] Identify a test platform ID for instrument creation
- [ ] Document existing instrument count on test platform

---

## 2. API Endpoint Tests

### 2.1 Instruments API - GET Operations

#### 2.1.1 List Instruments
```
GET /api/instruments?station=SVB
Authorization: Bearer {token}
```
- [ ] **Expected Response:** HTTP 200
- [ ] **Response Format:** `{ "instruments": [...] }`
- [ ] **Verify:** All instruments have `normalized_name`, `display_name`, `instrument_type`
- [ ] **Verify:** MS instruments have `instrument_type` containing "Multispectral" or similar

#### 2.1.2 Get Single Instrument
```
GET /api/instruments/{instrument_id}
Authorization: Bearer {token}
```
- [ ] **Expected Response:** HTTP 200
- [ ] **Verify:** Response includes all expected fields (46 columns per schema)
- [ ] **Verify:** `roi_count` and `active_roi_count` are numeric
- [ ] **Verify:** `platform_name`, `station_acronym` are populated

#### 2.1.3 Get Instrument ROIs
```
GET /api/instruments/{instrument_id}/rois
Authorization: Bearer {token}
```
- [ ] **Expected Response:** HTTP 200
- [ ] **Verify:** Returns array of ROI objects (may be empty)

### 2.2 Instruments API - POST (Create MS Sensor)

#### 2.2.1 Create MS Sensor - Valid Request
```json
POST /api/instruments
Authorization: Bearer {token}
Content-Type: application/json

{
  "platform_id": {test_platform_id},
  "instrument_type": "SKYE MultiSpectral Sensor (Uplooking)",
  "display_name": "Test MS Sensor Uplooking",
  "sensor_brand": "SKYE",
  "sensor_model": "SKR 1800",
  "number_of_channels": 4,
  "deployment_date": "2025-01-01",
  "ecosystem_code": "FOR",
  "orientation": "uplooking",
  "latitude": 64.25,
  "longitude": 19.77,
  "instrument_height_m": 25.5,
  "description": "Integration test MS sensor"
}
```
- [ ] **Expected Response:** HTTP 200
- [ ] **Response Contains:** `{ "success": true, "id": number, "normalized_name": "...", "instrument_number": "MS01" }`
- [ ] **Verify:** `normalized_name` follows pattern: `{PLATFORM}_{BRAND}_MS{NN}_NB{channels}`
- [ ] **Record:** Created instrument ID for subsequent tests: _______________

#### 2.2.2 Create MS Sensor - Missing Required Field
```json
POST /api/instruments
{
  "platform_id": {test_platform_id},
  "display_name": "Test Without Type"
}
```
- [ ] **Expected Response:** HTTP 400
- [ ] **Error Message:** "Missing required field: instrument_type"

#### 2.2.3 Create MS Sensor - Invalid Platform ID
```json
POST /api/instruments
{
  "platform_id": 99999,
  "instrument_type": "Multispectral Sensor",
  "display_name": "Test Invalid Platform"
}
```
- [ ] **Expected Response:** HTTP 404
- [ ] **Error Message:** "Platform not found"

### 2.3 Instruments API - PUT (Update MS Sensor)

#### 2.3.1 Update MS Sensor - Valid Request
```json
PUT /api/instruments/{instrument_id}
Authorization: Bearer {token}
{
  "display_name": "Updated MS Sensor Name",
  "calibration_date": "2025-11-24",
  "calibration_notes": "Integration test calibration update"
}
```
- [ ] **Expected Response:** HTTP 200
- [ ] **Response Contains:** `{ "success": true, "message": "Instrument updated successfully" }`

#### 2.3.2 Update MS Sensor - Station User Fields
- [ ] **Verify:** Station users CAN update: `display_name`, `status`, `camera_brand`, `camera_model`, `calibration_date`, `description`
- [ ] **Verify:** Station users CANNOT update: `normalized_name`, `instrument_number` (admin only)

### 2.4 Instruments API - DELETE

#### 2.4.1 Delete MS Sensor - No Dependencies
```
DELETE /api/instruments/{instrument_id}
Authorization: Bearer {token}
```
- [ ] **Expected Response:** HTTP 200
- [ ] **Response Contains:** `{ "success": true, "message": "Instrument deleted successfully" }`

#### 2.4.2 Delete MS Sensor - With ROI Dependencies
- [ ] **Expected Response:** HTTP 409
- [ ] **Error Message:** Contains "ROI(s) are associated with this instrument"

### 2.5 Channels API

#### 2.5.1 List Channels for Instrument
```
GET /api/channels?instrument_id={instrument_id}
Authorization: Bearer {token}
```
- [ ] **Expected Response:** HTTP 200
- [ ] **Response Format:** `{ "channels": [...], "total": number, "instrument_id": number }`
- [ ] **Verify:** Each channel has `channel_number`, `channel_name`, `center_wavelength_nm`, `bandwidth_nm`

#### 2.5.2 Create Channel
```json
POST /api/channels
Authorization: Bearer {token}
{
  "instrument_id": {ms_instrument_id},
  "channel_name": "RED645nm_NW10nm",
  "channel_number": 1,
  "center_wavelength_nm": 645,
  "bandwidth_nm": 10,
  "band_type": "Red"
}
```
- [ ] **Expected Response:** HTTP 201
- [ ] **Response Contains:** Complete channel object with `id`
- [ ] **Verify:** `wavelength_notation` auto-generated as "NW10nm"

#### 2.5.3 Create Channel - Duplicate Channel Number
- [ ] **Expected Response:** HTTP 409
- [ ] **Error Message:** "Channel number X already exists for this instrument"

#### 2.5.4 Create Channel - Invalid Wavelength
```json
{
  "instrument_id": {ms_instrument_id},
  "channel_name": "InvalidWL",
  "channel_number": 5,
  "center_wavelength_nm": 50,  // Too low
  "bandwidth_nm": 10
}
```
- [ ] **Expected Response:** HTTP 400
- [ ] **Error Message:** "Center wavelength must be between 300-1200nm"

#### 2.5.5 Update Channel
```json
PUT /api/channels/{channel_id}
Authorization: Bearer {token}
{
  "center_wavelength_nm": 650,
  "description": "Updated channel description"
}
```
- [ ] **Expected Response:** HTTP 200
- [ ] **Verify:** Channel updated correctly

#### 2.5.6 Delete Channel
```
DELETE /api/channels/{channel_id}
Authorization: Bearer {token}
```
- [ ] **Expected Response:** HTTP 200
- [ ] **Verify:** Cannot delete last channel (error if only 1 remains)

### 2.6 Sensor Models API

#### 2.6.1 List Sensor Models
```
GET /api/sensor-models
Authorization: Bearer {token}
```
- [ ] **Expected Response:** HTTP 200
- [ ] **Response Format:** `{ "models": [...], "total": number }`
- [ ] **Verify:** Models include SKYE, Apogee, Decagon, LI-COR brands

#### 2.6.2 Get Sensor Model by ID
```
GET /api/sensor-models/{model_id}
Authorization: Bearer {token}
```
- [ ] **Expected Response:** HTTP 200
- [ ] **Verify:** JSON fields parsed: `available_channels_config`, `typical_calibration_coefficients`

#### 2.6.3 Create Sensor Model (Admin Only)
```json
POST /api/sensor-models
Authorization: Bearer {admin_token}
{
  "manufacturer": "Test Brand",
  "model_number": "TEST-001",
  "model_name": "Integration Test Model",
  "sensor_type": "Multispectral",
  "wavelength_range_min_nm": 400,
  "wavelength_range_max_nm": 900
}
```
- [ ] **Expected Response:** HTTP 201 (admin)
- [ ] **Expected Response:** HTTP 403 (station user) - "Only administrators can create sensor models"

#### 2.6.4 Delete Sensor Model - In Use
- [ ] **Expected Response:** HTTP 400
- [ ] **Error Message:** "X instrument(s) are using this model"

---

## 3. Frontend Modal Tests

### 3.1 MS Sensor Creation Modal

#### 3.1.1 Modal Opening
- [ ] Navigate to station page (e.g., /station.html?station=SVB)
- [ ] Login as admin or station user
- [ ] Click "Add Instrument" button on a platform card
- [ ] Select "Multispectral Sensor" from instrument type dropdown
- [ ] **Verify:** MS sensor creation modal appears
- [ ] **Verify:** Console shows: "MS sensor creation modal opened for platform X"

#### 3.1.2 Tab Navigation
- [ ] **Verify:** 5 tabs are present: Basic Info, Sensor Details, Location, Channels, Calibration
- [ ] Click each tab in sequence
- [ ] **Verify:** Tab content changes appropriately
- [ ] **Verify:** Console shows: "Switched to tab: {tab-id}"

#### 3.1.3 Sensor Model Selection
- [ ] Select a sensor model from dropdown (e.g., "SKYE SKR 1800")
- [ ] **Verify:** Manufacturer field auto-populates
- [ ] **Verify:** Model number field auto-populates
- [ ] **Verify:** Wavelength range info displays (if available)
- [ ] **Verify:** Suggested channel configurations appear (if model has presets)

#### 3.1.4 Channel Configuration Application
- [ ] Click on a suggested channel configuration button (e.g., "4-channel")
- [ ] **Verify:** Alert shows: "Applied X-channel configuration"
- [ ] Navigate to Channels tab
- [ ] **Verify:** Channels table populated with preset channels
- [ ] **Verify:** number_of_channels field updated automatically

#### 3.1.5 Manual Channel Addition
- [ ] On Channels tab, select Band Type: "Red"
- [ ] **Verify:** Wavelength auto-fills (645nm)
- [ ] Select Bandwidth: "Narrow (10nm)"
- [ ] **Verify:** Channel name auto-generates: "RED645nm_NW10nm"
- [ ] Click "Add Channel"
- [ ] **Verify:** Channel appears in table
- [ ] **Verify:** Console shows: "Added channel X: RED645nm_NW10nm"

#### 3.1.6 Channel Deletion
- [ ] Click delete button on a channel row
- [ ] **Verify:** Confirmation dialog appears
- [ ] Confirm deletion
- [ ] **Verify:** Channel removed from table
- [ ] **Verify:** Remaining channels re-numbered

#### 3.1.7 Orientation Change
- [ ] Set Orientation to "Downlooking"
- [ ] **Verify:** Azimuth field becomes visible
- [ ] **Verify:** Nadir tilt field becomes visible
- [ ] Set Orientation back to "Uplooking"
- [ ] **Verify:** Azimuth and Nadir fields hide

#### 3.1.8 Form Submission
- [ ] Fill all required fields
- [ ] Add at least 2 channels
- [ ] Click "Save MS Sensor"
- [ ] **Verify:** Loading state shows on button
- [ ] **Verify:** Success notification appears
- [ ] **Verify:** Modal closes
- [ ] **Verify:** Page refreshes with new instrument visible

### 3.2 MS Sensor Edit Modal

#### 3.2.1 Modal Opening
- [ ] Click "Edit" on an existing MS sensor instrument
- [ ] **Verify:** Edit modal appears with pre-populated data
- [ ] **Verify:** Console shows: "MS sensor edit modal opened for instrument X"

#### 3.2.2 Data Pre-Population
- [ ] **Verify:** Display name field shows current value
- [ ] **Verify:** Sensor brand/model fields populated
- [ ] **Verify:** Existing channels loaded in table
- [ ] **Verify:** Console shows: "Loaded X channels from server"

#### 3.2.3 Edit and Save
- [ ] Modify a field (e.g., description)
- [ ] Click "Save Changes"
- [ ] **Verify:** Success notification appears
- [ ] **Verify:** Modal closes
- [ ] Refresh page
- [ ] **Verify:** Changes persisted

---

## 4. Data Flow Tests

### 4.1 Create -> Save -> Refresh -> Display

#### 4.1.1 Full MS Sensor Creation Flow
- [ ] Open MS sensor creation modal
- [ ] Fill form with test data:
  - Display Name: "QA Test MS Sensor"
  - Sensor Brand: "SKYE"
  - Sensor Model: "SKR 1800"
  - Serial Number: "QA-TEST-001"
  - Orientation: "Uplooking"
  - Height: 25.0m
  - Deployment Date: Today
- [ ] Add 4 channels:
  - Blue (450nm, 10nm)
  - Green (530nm, 10nm)
  - Red (645nm, 10nm)
  - NIR (850nm, 40nm)
- [ ] Click Save
- [ ] Hard refresh page (Ctrl+F5)
- [ ] **Verify:** New instrument appears in platform card
- [ ] **Verify:** Instrument count increased
- [ ] Click "View Details" on new instrument
- [ ] **Verify:** All saved data displayed correctly

#### 4.1.2 Channel Count Consistency
- [ ] Create MS sensor with declared `number_of_channels: 4`
- [ ] Add exactly 4 channels
- [ ] Save successfully
- [ ] Call API: `GET /api/channels?instrument_id={id}`
- [ ] **Verify:** API returns exactly 4 channels
- [ ] **Verify:** Each channel has sequential `channel_number` (1, 2, 3, 4)

#### 4.1.3 Normalized Name Generation
- [ ] Create MS sensor with:
  - Platform: SVB_FOR_PL01
  - Sensor Brand: SKYE
  - Number of Channels: 4
- [ ] **Verify:** Generated normalized_name follows pattern:
  - Expected: `SVB_FOR_PL01_SKYE_MS01_NB04`
- [ ] Create second MS sensor on same platform
- [ ] **Verify:** Instrument number incremented:
  - Expected: `SVB_FOR_PL01_SKYE_MS02_NB04`

### 4.2 Update -> Refresh -> Verify

#### 4.2.1 Instrument Update Flow
- [ ] Edit existing MS sensor
- [ ] Change calibration date to today
- [ ] Add calibration notes
- [ ] Save changes
- [ ] Refresh page
- [ ] View instrument details
- [ ] **Verify:** Calibration date shows today
- [ ] **Verify:** Calibration notes displayed

#### 4.2.2 Channel Update Flow
- [ ] Edit existing MS sensor
- [ ] Navigate to Channels tab
- [ ] Update a channel's wavelength
- [ ] Save changes
- [ ] Call API: `GET /api/channels?instrument_id={id}`
- [ ] **Verify:** Updated wavelength value returned

### 4.3 Delete -> Verify Removal

#### 4.3.1 Instrument Deletion Flow
- [ ] Identify test instrument to delete (created during testing)
- [ ] First delete all associated channels
- [ ] Delete the instrument
- [ ] Refresh page
- [ ] **Verify:** Instrument no longer appears in platform card
- [ ] Call API: `GET /api/instruments/{deleted_id}`
- [ ] **Verify:** HTTP 404 returned

---

## 5. Error Handling Tests

### 5.1 Frontend Validation Errors

#### 5.1.1 Required Field Validation
- [ ] Open MS sensor creation modal
- [ ] Leave Display Name empty
- [ ] Click Save
- [ ] **Verify:** Alert shows "Display name is required"
- [ ] Leave Sensor Brand empty
- [ ] Click Save
- [ ] **Verify:** Alert shows "Sensor brand is required"

#### 5.1.2 Wavelength Range Validation
- [ ] Add channel with wavelength = 100nm (below minimum)
- [ ] **Verify:** Alert shows "Wavelength must be between 300-1200nm"
- [ ] Add channel with wavelength = 1500nm (above maximum)
- [ ] **Verify:** Same error message

#### 5.1.3 Bandwidth Validation
- [ ] Add channel with bandwidth = 0nm
- [ ] **Verify:** Alert shows "Bandwidth must be between 1-200nm"
- [ ] Add channel with bandwidth = 300nm
- [ ] **Verify:** Same error message

#### 5.1.4 Orientation Validation
- [ ] Set orientation to "Downlooking"
- [ ] Leave Azimuth empty
- [ ] Leave Nadir empty
- [ ] Click Save
- [ ] **Verify:** Alert shows "Azimuth is required for downlooking sensors"

#### 5.1.5 Channel Count Mismatch
- [ ] Set number_of_channels to 4
- [ ] Add only 2 channels
- [ ] Click Save
- [ ] **Verify:** Alert shows "Channel count mismatch: Declared 4 channels but created 2"

#### 5.1.6 Duplicate Channel Validation
- [ ] Add channel with name "RED645nm_NW10nm"
- [ ] Add another channel with same name
- [ ] **Verify:** Alert shows "Duplicate channel name: RED645nm_NW10nm"

### 5.2 API Error Handling

#### 5.2.1 Unauthenticated Request
- [ ] Call API without Authorization header
- [ ] **Verify:** HTTP 401 Unauthorized returned

#### 5.2.2 Invalid JSON
- [ ] Send malformed JSON to POST /api/instruments
- [ ] **Verify:** HTTP 400 Bad Request

#### 5.2.3 Server Error Recovery
- [ ] Simulate network interruption during save
- [ ] **Verify:** Error message displayed to user
- [ ] **Verify:** Button re-enabled after error
- [ ] **Verify:** Form data preserved for retry

### 5.3 Console Error Monitoring

- [ ] Keep browser console open during all tests
- [ ] **Verify:** No unhandled JavaScript errors
- [ ] **Verify:** No 500 Internal Server Errors in Network tab
- [ ] **Verify:** All API calls complete within 10 seconds

---

## 6. Permission Tests

### 6.1 Admin User Tests

#### 6.1.1 Admin Full Access
- [ ] Login as admin user
- [ ] Navigate to any station
- [ ] **Verify:** "Add Platform" button visible
- [ ] **Verify:** "Add Instrument" button visible on platform cards
- [ ] **Verify:** Edit and Delete buttons visible on instruments
- [ ] Create new MS sensor
- [ ] **Verify:** Creation successful
- [ ] Update MS sensor
- [ ] **Verify:** Update successful (including admin-only fields)
- [ ] Delete MS sensor
- [ ] **Verify:** Deletion successful

#### 6.1.2 Admin Sensor Models Access
- [ ] Navigate to sensor models library (if UI exists)
- [ ] **Verify:** Create new model button visible
- [ ] Create new sensor model
- [ ] **Verify:** HTTP 201 response
- [ ] Update sensor model
- [ ] **Verify:** Update successful
- [ ] Delete unused sensor model
- [ ] **Verify:** Deletion successful

### 6.2 Station User Tests

#### 6.2.1 Station User - Own Station Access
- [ ] Login as station user (e.g., SVB station user)
- [ ] Navigate to assigned station
- [ ] **Verify:** Platform cards visible
- [ ] **Verify:** "Add Instrument" button visible on platform cards
- [ ] **Verify:** Edit button visible on own instruments
- [ ] **Verify:** Delete button visible on own instruments

#### 6.2.2 Station User - Create Instrument
- [ ] Create new MS sensor
- [ ] **Verify:** Creation successful
- [ ] **Verify:** Normalized name auto-generated (cannot override)
- [ ] **Verify:** Console shows "Station access GRANTED"

#### 6.2.3 Station User - Update Instrument
- [ ] Edit own MS sensor
- [ ] Update allowed fields:
  - [ ] display_name - **Verify:** Success
  - [ ] status - **Verify:** Success
  - [ ] calibration_date - **Verify:** Success
  - [ ] description - **Verify:** Success
- [ ] Attempt to update admin-only fields via API:
  - [ ] normalized_name - **Verify:** Field not updated
  - [ ] instrument_number - **Verify:** Field not updated

#### 6.2.4 Station User - Other Station Access
- [ ] Attempt to access different station (e.g., ANS if logged in as SVB user)
- [ ] **Verify:** Instruments from other station NOT visible
- [ ] Attempt API call to create instrument on other station's platform
- [ ] **Verify:** HTTP 403 Forbidden

#### 6.2.5 Station User - Sensor Models Library
- [ ] Call `GET /api/sensor-models`
- [ ] **Verify:** HTTP 200 - Can view models
- [ ] Call `POST /api/sensor-models` with new model data
- [ ] **Verify:** HTTP 403 - "Only administrators can create sensor models"
- [ ] Call `DELETE /api/sensor-models/{id}`
- [ ] **Verify:** HTTP 403 - "Only administrators can delete sensor models"

### 6.3 Read-Only User Tests (if applicable)

#### 6.3.1 Read-Only - View Access
- [ ] Login as read-only user
- [ ] Navigate to any station
- [ ] **Verify:** Can view station details
- [ ] **Verify:** Can view platform cards
- [ ] **Verify:** Can view instrument details

#### 6.3.2 Read-Only - Write Restrictions
- [ ] **Verify:** "Add Instrument" button NOT visible
- [ ] **Verify:** Edit button NOT visible on instruments
- [ ] **Verify:** Delete button NOT visible
- [ ] Attempt API `POST /api/instruments`
- [ ] **Verify:** HTTP 403 Forbidden

---

## 7. Channel Management Tests

### 7.1 Channel CRUD via Frontend

#### 7.1.1 Add Multiple Channels
- [ ] Add channels in non-sequential order (e.g., 3, 1, 2)
- [ ] **Verify:** Channels auto-numbered sequentially (1, 2, 3)
- [ ] **Verify:** Table sorted by channel_number

#### 7.1.2 Edit Channel (if implemented)
- [ ] Click edit button on channel row
- [ ] Modify wavelength
- [ ] Save changes
- [ ] **Verify:** Channel updated in table

#### 7.1.3 Delete All But One Channel
- [ ] Add 3 channels
- [ ] Delete 2 channels
- [ ] Attempt to delete last channel via API
- [ ] **Verify:** HTTP 400 - "Cannot delete last channel"

### 7.2 Channel Validation

#### 7.2.1 Wavelength Range Per Sensor Model
- [ ] Select sensor model with defined wavelength range
- [ ] Add channel outside model's range
- [ ] **Verify:** Warning or error displayed about out-of-range wavelength

#### 7.2.2 Standard Band Type Presets
- [ ] For each band type, verify preset wavelength:
  - [ ] Blue: 450nm
  - [ ] Green: 530nm
  - [ ] Red: 645nm
  - [ ] Far-Red: 730nm
  - [ ] NIR: 850nm
- [ ] **Verify:** Custom band type allows any valid wavelength

---

## 8. Sensor Models Library Tests

### 8.1 Model Data Integrity

#### 8.1.1 JSON Field Parsing
- [ ] Call `GET /api/sensor-models/{id}`
- [ ] **Verify:** `available_channels_config` is parsed as array (not string)
- [ ] **Verify:** `typical_calibration_coefficients` is parsed as object
- [ ] **Verify:** `dimensions_mm` is parsed as object

#### 8.1.2 Model Filtering
- [ ] Call `GET /api/sensor-models?manufacturer=SKYE`
- [ ] **Verify:** Only SKYE models returned
- [ ] Call `GET /api/sensor-models?type=Multispectral`
- [ ] **Verify:** Only Multispectral type models returned

### 8.2 Model Usage Tracking

#### 8.2.1 Model In Use Protection
- [ ] Identify sensor model used by at least one instrument
- [ ] Attempt to delete that model (as admin)
- [ ] **Verify:** HTTP 400 - "X instrument(s) are using this model"

---

## 9. Validation Tests

### 9.1 MSValidation Module Tests

#### 9.1.1 Wavelength Validation Constants
Open browser console and run:
```javascript
console.log(MSValidation.constants);
```
- [ ] **Verify:** `WAVELENGTH_MIN: 300`
- [ ] **Verify:** `WAVELENGTH_MAX: 1200`
- [ ] **Verify:** `BANDWIDTH_MIN: 1`
- [ ] **Verify:** `BANDWIDTH_MAX: 200`

#### 9.1.2 Channel Name Generation
```javascript
console.log(MSValidation.generateChannelName('Red', 645, 10));
```
- [ ] **Verify:** Output: "RED645nm_NW10nm"

#### 9.1.3 Wavelength Notation Generation
```javascript
console.log(MSValidation.generateWavelengthNotation(40));
```
- [ ] **Verify:** Output: "NW40nm"

### 9.2 Form Validation Integration

#### 9.2.1 Complete Form Validation
- [ ] Fill MS sensor form with all valid data
- [ ] Add 4 valid channels
- [ ] Verify console shows validation passing
- [ ] Submit form
- [ ] **Verify:** No validation errors

#### 9.2.2 Partial Form Validation
- [ ] Leave some required fields empty
- [ ] Click Save
- [ ] **Verify:** All missing fields listed in error alert
- [ ] **Verify:** Form not submitted

---

## 10. Post-Testing Cleanup

### 10.1 Test Data Removal

- [ ] Delete all test instruments created during testing
- [ ] Delete all test channels created during testing
- [ ] Delete test sensor models created during testing (if any)
- [ ] Verify no orphaned records in database

### 10.2 Documentation

- [ ] Record any bugs found during testing
- [ ] Note any unexpected behaviors
- [ ] Document performance issues (slow responses, timeouts)
- [ ] Update this checklist with any additional test cases discovered

### 10.3 Test Results Summary

| Category | Tests Passed | Tests Failed | Notes |
|----------|-------------|--------------|-------|
| API - GET | ___ / ___ | | |
| API - POST | ___ / ___ | | |
| API - PUT | ___ / ___ | | |
| API - DELETE | ___ / ___ | | |
| Frontend Modal | ___ / ___ | | |
| Data Flow | ___ / ___ | | |
| Error Handling | ___ / ___ | | |
| Admin Permissions | ___ / ___ | | |
| Station User Permissions | ___ / ___ | | |
| Channel Management | ___ / ___ | | |
| Sensor Models | ___ / ___ | | |
| Validation | ___ / ___ | | |

**Overall Result:** [ ] PASS / [ ] FAIL

**Tester Name:** _______________________

**Test Date:** _______________________

**Application Version:** _______________________

---

## Appendix A: Test Data Reference

### Sample MS Sensor Data

```json
{
  "platform_id": 1,
  "instrument_type": "SKYE MultiSpectral Sensor (Uplooking)",
  "display_name": "QA Test MS Sensor",
  "sensor_brand": "SKYE",
  "sensor_model": "SKR 1800",
  "sensor_serial_number": "QA-2025-001",
  "orientation": "uplooking",
  "number_of_channels": 4,
  "deployment_date": "2025-01-01",
  "ecosystem_code": "FOR",
  "latitude": 64.25586,
  "longitude": 19.773851,
  "instrument_height_m": 25.5,
  "description": "Integration test multispectral sensor"
}
```

### Sample Channel Data

```json
[
  {
    "channel_name": "BLUE450nm_NW10nm",
    "channel_number": 1,
    "center_wavelength_nm": 450,
    "bandwidth_nm": 10,
    "band_type": "Blue"
  },
  {
    "channel_name": "GREEN530nm_NW10nm",
    "channel_number": 2,
    "center_wavelength_nm": 530,
    "bandwidth_nm": 10,
    "band_type": "Green"
  },
  {
    "channel_name": "RED645nm_NW10nm",
    "channel_number": 3,
    "center_wavelength_nm": 645,
    "bandwidth_nm": 10,
    "band_type": "Red"
  },
  {
    "channel_name": "NIR850nm_NW40nm",
    "channel_number": 4,
    "center_wavelength_nm": 850,
    "bandwidth_nm": 40,
    "band_type": "NIR"
  }
]
```

### Instrument Type Codes Reference

| Instrument Type | Code |
|----------------|------|
| Phenocam | PHE |
| SKYE MultiSpectral Sensor (Uplooking) | MS |
| SKYE MultiSpectral Sensor (Downlooking) | MS |
| Decagon Sensor (Uplooking) | MS |
| Decagon Sensor (Downlooking) | MS |
| Apogee MS | MS |
| PRI Sensor | PRI |
| NDVI Sensor | NDVI |
| PAR Sensor | PAR |
| Hyperspectral Sensor | HYP |

---

## Appendix B: Console Commands for Quick Testing

### Check MS Sensor Modal State
```javascript
console.log('Current Platform ID:', MSSensorModal.currentPlatformId);
console.log('Current Sensor Model:', MSSensorModal.currentSensorModel);
```

### Check Channel Manager State
```javascript
console.log('Current Channels:', MSChannelManager.getChannels());
```

### Validate Form Data Manually
```javascript
const formData = {
  display_name: 'Test',
  sensor_brand: 'SKYE',
  sensor_model: 'SKR 1800',
  sensor_serial_number: '12345',
  orientation: 'uplooking',
  instrument_height_m: 25,
  deployment_date: '2025-01-01'
};
const channels = MSChannelManager.getChannels();
console.log(MSValidation.validateMSInstrumentForm(formData, channels));
```

### Quick API Test
```javascript
fetch('/api/sensor-models', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') }
})
.then(r => r.json())
.then(d => console.log('Sensor Models:', d));
```
