# Troubleshooting Report: v15.7.1

**Date:** 2026-03-09
**Version fixed:** 15.7.0 → 15.7.1
**Reported issue:** Station subdomain portals not showing platforms and instruments

---

## Issue 1: Station Portal Showing Public-Only Data

### Symptom

Visiting any station subdomain (e.g. `https://abisko.sitesspectral.work`) showed platforms with a placeholder message **"X instrument(s) — Login to view details"** instead of actual instrument names, types, and statuses. The instrument count was correct but no details were rendered.

### Root Cause

`station-portal.html` contained two methods responsible for loading station data:

**`loadStationData(acronym)`** — called the unauthenticated public API:

```javascript
const response = await fetch('/api/public/station/' + encodeURIComponent(acronym.toLowerCase()));
```

The public endpoint `GET /api/public/station/:acronym` (in `src/handlers/public.js`) intentionally returns only summary data:
- Station metadata
- Platforms with `instrument_count` (a count only, not a list)
- Instrument type summary (aggregated counts by type)

It does **not** return individual instrument records. This is by design — public endpoints expose minimal data.

**`loadInstruments(acronym)`** — completely non-functional:

```javascript
async loadInstruments(acronym) {
    for (const platform of this.platforms) {
        try {
            const response = await fetch('/api/public/station/' + encodeURIComponent(acronym.toLowerCase()));
            // For now, we'll use instrument_count from platforms
            // Full instrument data would need authenticated API
            this.instruments[platform.id] = [];   // ← ALWAYS EMPTY
        } catch (e) {
            console.warn('Could not load instruments for platform:', platform.id);
        }
    }
},
```

This looped over every platform, made the same useless public API call for each one, then unconditionally set `this.instruments[platform.id] = []`. The comment admitted the problem: "Full instrument data would need authenticated API." The work was never completed.

**`createPlatformCard(platform)`** — rendered a hard-coded placeholder:

```javascript
const typeEl = document.createElement('div');
typeEl.className = 'instrument-type';
typeEl.textContent = 'Login to view details';   // ← placeholder, never removed
```

### Why It Went Unnoticed

Station portal users ARE authenticated (via Cloudflare Access). The authenticated dashboard API existed and returned complete data. The portal was simply never wired to use it. The placeholder text suggested the author knew the authenticated API was needed but deferred it.

### Solution

**Replaced both broken methods** with a single `loadDashboardData(acronym)` that calls the authenticated endpoint:

```javascript
async loadDashboardData(acronym) {
    const response = await fetch('/api/v11/stations/' + encodeURIComponent(acronym.toLowerCase()) + '/dashboard');
    if (!response.ok) {
        throw new Error('Failed to load station dashboard: ' + response.status);
    }
    const json = await response.json();

    if (!json.data) {
        throw new Error('Station not found');
    }

    this.station = json.data.station;
    this.platforms = json.data.platforms || [];
},
```

The endpoint `GET /api/v11/stations/:acronym/dashboard` is handled by `GetStationDashboard` (`src/application/queries/GetStationDashboard.js`), which executes a single optimised query returning:

```json
{
  "data": {
    "station": { ... },
    "platforms": [
      {
        "id": 1,
        "normalized_name": "SVB_FOR_TWR01",
        "display_name": "Svartberget Forest Tower 1",
        "mount_type_code": "TWR",
        "status": "Active",
        "instruments": [
          {
            "normalized_name": "SVB_FOR_TWR01_PHE01",
            "display_name": "Phenocam South",
            "instrument_type": "PHE",
            "status": "Active"
          }
        ]
      }
    ],
    "stats": {
      "platformCount": 3,
      "instrumentCount": 8,
      "activeInstruments": 7
    }
  }
}
```

Instruments are nested inside each platform object — no N+1 queries, a single round-trip.

**Updated `createPlatformCard()`** to iterate `platform.instruments` and render each one:

```javascript
const platformInstruments = platform.instruments || [];
platformInstruments.forEach(instrument => {
    // render name, type icon, active/inactive status badge
});
```

**Added instrument icon helpers:**

```javascript
getInstrumentIconClass(type) {
    const classes = { 'PHE': 'phenocam', 'MS': 'multispectral', 'NDVI': 'ndvi', 'PAR': 'par', 'HYP': 'multispectral' };
    return classes[type] || 'default';
},
getInstrumentFaIcon(type) {
    const icons = { 'PHE': 'fas fa-camera', 'MS': 'fas fa-layer-group', 'NDVI': 'fas fa-seedling', 'PAR': 'fas fa-sun', 'HYP': 'fas fa-rainbow' };
    return icons[type] || 'fas fa-microchip';
},
```

**Updated stats helpers** to count from nested instrument data instead of the `instrument_count` integer:

```javascript
getTotalInstruments() {
    return this.platforms.reduce((sum, p) =>
        sum + (p.instruments ? p.instruments.length : (p.instrument_count || 0)), 0);
},
getActiveCount() {
    return this.platforms.reduce((sum, p) => {
        if (!p.instruments) return sum;
        return sum + p.instruments.filter(i => i.status === 'Active').length;
    }, 0);
},
```

### Files Changed

| File | Change |
|------|--------|
| `public/station-portal.html` | Replaced `loadStationData()` + `loadInstruments()` with `loadDashboardData()`; rewrote `createPlatformCard()` instrument section; added icon helpers; updated stats helpers |

---

## Issue 2: `DELETE /api/v11/uav/missions/:id/pilots/:pilotId` Silently Deleting the Mission

### Symptom

Discovered during a full API endpoint audit. The route `DELETE /api/v11/uav/missions/:id/pilots/:pilotId` was listed in the API documentation (`GET /api/v11/info`) but calling it would silently delete the entire **mission** instead of removing a pilot assignment.

### Root Cause

Three separate gaps in the implementation stack, each independently broken:

#### Gap 1: Missing command class

`AssignPilotToMission` had a corresponding command (`src/application/commands/uav/AssignPilotToMission.js`), but no `RemovePilotFromMission` command existed. The SQL implementation existed in the repository (`D1MissionRepository.removePilotFromMission()`) but was never wrapped in a command.

#### Gap 2: Missing controller method

`UAVController` had `assignPilotToMission()` but no `removePilotFromMission()` method.

#### Gap 3: Routing bug — catch-all DELETE masked the problem

The `handleMissions()` method had this routing at the bottom:

```javascript
// DELETE /uav/missions/:id
if (method === 'DELETE' && id) {      // ← catches EVERYTHING with an id
    return this.deleteMission(request, id);
}
```

The condition `method === 'DELETE' && id` matched any DELETE request where `id` (pathSegments[1]) was truthy — including `DELETE /missions/123/pilots/456` where `id = '123'`. The `subResource` ('pilots') and `subId` ('456') were never checked.

Additionally, `handleMissions()` was not even receiving `subId`. The call site passed only 5 arguments:

```javascript
// Before fix — subId not passed:
return this.handleMissions(request, method, id, subResource, url);

// handlePilots received subId correctly:
return this.handlePilots(request, method, id, subResource, subId, url);
```

`subId` (pathSegments[3]) was available in the parent `handle()` method but was dropped when delegating to `handleMissions`.

### Solution

**Step 1:** Created `src/application/commands/uav/RemovePilotFromMission.js`:

```javascript
export class RemovePilotFromMission {
  constructor({ missionRepository, pilotRepository }) { ... }

  async execute({ missionId, pilotId }) {
    const mission = await this.missionRepository.findById(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);

    const pilot = await this.pilotRepository.findById(pilotId);
    if (!pilot) throw new Error(`Pilot ${pilotId} not found`);

    const removed = await this.missionRepository.removePilotFromMission(missionId, pilotId);
    if (!removed) throw new Error(`Pilot ${pilotId} is not assigned to mission ${missionId}`);

    return true;
  }
}
```

**Step 2:** Registered it in all barrel index files and `container.js`:

```javascript
// src/application/commands/uav/index.js
export { RemovePilotFromMission } from './RemovePilotFromMission.js';

// src/application/commands/index.js — re-exports all commands
RemovePilotFromMission,

// src/application/index.js — top-level application exports
RemovePilotFromMission,

// src/container.js — dependency injection
removePilotFromMission: new RemovePilotFromMission(deps),
```

**Step 3:** Added controller method to `UAVController`:

```javascript
async removePilotFromMission(request, missionId, pilotId) {
    const { response } = await this.auth.authenticateAndAuthorize(request, 'uav_missions', 'write');
    if (response) return response;

    const missionIdResult = parsePathId(missionId, 'mission_id');
    if (!missionIdResult.valid) return missionIdResult.error;

    const pilotIdResult = parsePathId(pilotId, 'pilot_id');
    if (!pilotIdResult.valid) return pilotIdResult.error;

    try {
        await this.commands.removePilotFromMission.execute({
            missionId: missionIdResult.value,
            pilotId: pilotIdResult.value
        });
        return createSuccessResponse({ removed: true });
    } catch (error) {
        if (error.message.includes('not found')) return createNotFoundResponse(error.message);
        return createErrorResponse(error.message, 400);
    }
}
```

**Step 4:** Fixed `handleMissions()` to receive `subId` and added the pilot DELETE route **before** the mission DELETE catch-all:

```javascript
// Fix call site to pass subId
return this.handleMissions(request, method, id, subResource, subId, url);

// Fix method signature
async handleMissions(request, method, id, subResource, subId, url) {

    // ... other routes ...

    // DELETE /uav/missions/:id/pilots/:pilotId  ← MUST come before mission delete
    if (method === 'DELETE' && id && subResource === 'pilots' && subId) {
        return this.removePilotFromMission(request, id, subId);
    }

    // DELETE /uav/missions/:id  ← added !subResource guard
    if (method === 'DELETE' && id && !subResource) {
        return this.deleteMission(request, id);
    }
}
```

The `!subResource` guard on the mission delete is a defensive improvement — previously a `DELETE /missions/123/pilots` (without pilotId) would also hit the mission delete. Now it returns 404 instead.

### Files Changed

| File | Change |
|------|--------|
| `src/application/commands/uav/RemovePilotFromMission.js` | **New file** — command class |
| `src/application/commands/uav/index.js` | Added export |
| `src/application/commands/index.js` | Added re-export |
| `src/application/index.js` | Added re-export |
| `src/container.js` | Imported and instantiated command |
| `src/infrastructure/http/controllers/UAVController.js` | Added method; fixed `handleMissions` signature and routing |

---

## Build Failure During Deployment

### Symptom

`npm run deploy` failed twice with bundler errors after the initial commit:

```
✘ [ERROR] No matching export in "src/application/index.js" for import "RemovePilotFromMission"
✘ [ERROR] No matching export in "src/application/commands/index.js" for import "RemovePilotFromMission"
```

### Root Cause

The project uses a layered barrel export pattern with **three** index files that must all be updated when adding a new command:

| File | Role |
|------|------|
| `src/application/commands/uav/index.js` | Groups UAV-domain commands |
| `src/application/commands/index.js` | Re-exports all commands across all domains |
| `src/application/index.js` | Top-level application layer barrel (used by `container.js` imports) |

The initial fix updated `src/application/commands/uav/index.js` but missed the two higher-level barrels. The bundler (esbuild via wrangler) resolved the import chain and found the export missing at `commands/index.js`, then `application/index.js`.

### Fix

Added `RemovePilotFromMission` to both missing index files. Required two additional fix commits before deploy succeeded.

### Prevention

When adding any new command class to the UAV domain, update all three index files:

```
src/application/commands/uav/index.js      ← 1. domain barrel
src/application/commands/index.js          ← 2. commands barrel
src/application/index.js                   ← 3. application barrel
```

The same pattern applies to queries. Check `src/application/queries/index.js` when adding new query classes.

---

## Deployment Result

```
Uploaded sites-spectral-instruments (23.41 sec)
Deployed sites-spectral-instruments triggers (9.31 sec)
  https://sites-spectral-instruments.jose-beltran.workers.dev
  sitesspectral.work/*
  *.sitesspectral.work/*
Current Version ID: 0ca5d92f-f125-4bfc-863f-db07bd4c8c9e
```

**Total commits:** 3
**Assets uploaded:** 7 new/modified files
**Version:** 15.7.1
**Date:** 2026-03-09
