# User Flow Diagrams: Station User Instrument Management

**Version:** 1.0
**Date:** 2025-09-30
**Designer:** River (UX Expert - Watershed Collective)

---

## Flow 1: Create Instrument from Platform Card (Primary Flow)

### Current Flow (BROKEN)

```
┌──────────────────────────────────────────────────────────────────┐
│                        CURRENT FLOW - BROKEN                      │
└──────────────────────────────────────────────────────────────────┘

[Station User Logs In]
         │
         ├─> Redirected to station dashboard
         │
         ├─> Sees platform cards
         │
         ├─> Looks for way to add instrument
         │
         └─> [BLOCKED] Button not visible
                     │
                     ├─> Confusion: "Where do I add instruments?"
                     │
                     ├─> Tries clicking platform card
                     │
                     ├─> Opens "View Details" modal
                     │
                     ├─> No instrument management visible
                     │
                     └─> [DEAD END] Contacts support

🚫 RESULT: User cannot complete task
⏱️  TIME WASTED: 5+ minutes of searching
😞 USER EMOTION: Frustrated, confused
```

### Proposed Flow (FIXED)

```
┌──────────────────────────────────────────────────────────────────┐
│                    PROPOSED FLOW - STREAMLINED                    │
└──────────────────────────────────────────────────────────────────┘

[Station User Logs In]
         │
         ├─> Redirected to station dashboard
         │   [Load time: ~2s]
         │
         ├─> Sees platform cards with instruments preview
         │   👁️  Visual scan of all platforms
         │
         ├─> Identifies platform needing instrument
         │   🎯 "I need to add a phenocam to SVB_FOR_P02"
         │
         ├─> Spots "Add Instrument" button (GREEN, PROMINENT)
         │   ✅ Button clearly labeled with icon + text
         │   ✅ Green color signals creation action
         │
         ├─> CLICKS "Add Instrument"
         │   [Action time: <1s]
         │
         ├─> Create Instrument Modal Opens
         │   ├─> Platform ID pre-filled: SVB_FOR_P02
         │   ├─> Form fields empty and ready for input
         │   └─> Clear instructions visible
         │
         ├─> Fills Form Fields
         │   ├─> Display Name: "Phenocam - East View"
         │   ├─> Type: Selects "Phenocam" from dropdown
         │   ├─> Make: "StarDot Technologies"
         │   ├─> Model: "NetCam SC 5MP"
         │   ├─> Serial: "SC5MP-2025-101"
         │   ├─> Status: "Active"
         │   └─> Camera specs (resolution, FoV, etc.)
         │   [Form completion: ~30-45s]
         │
         ├─> Reviews form data
         │   👀 Quick sanity check
         │
         ├─> CLICKS "Save Instrument"
         │   [Submit action: <1s]
         │
         ├─> Backend Processing
         │   ├─> Validates input
         │   ├─> Generates normalized name: SVB_FOR_PHE_02
         │   ├─> Inserts into database
         │   └─> Returns success response
         │   [Processing: ~500ms]
         │
         ├─> Success Notification Appears
         │   ✅ "Instrument created successfully!"
         │   [Notification duration: 3s]
         │
         ├─> Modal Closes Automatically
         │
         ├─> Platform Card Updates
         │   ├─> Instrument count increments (3 → 4)
         │   ├─> New instrument chip appears in preview
         │   └─> Fresh data loaded from database
         │   [Refresh: ~1s]
         │
         └─> USER SUCCESS
             ✅ Task completed
             😊 User feels capable and efficient

✅ RESULT: Instrument created successfully
⏱️  TOTAL TIME: ~45-60 seconds (from viewing dashboard to saved)
🎯 CLICKS: 3 (identify platform → click button → save)
😊 USER EMOTION: Satisfied, confident, empowered
```

### Click-by-Click Breakdown

| Step | Action | Element | Time | Cumulative |
|------|--------|---------|------|------------|
| 1 | View Dashboard | Platform cards displayed | 2s | 2s |
| 2 | Identify Platform | Visual scan | 3s | 5s |
| 3 | Click "Add Instrument" | Green button on platform card | <1s | 6s |
| 4 | Modal opens | Create Instrument form appears | <1s | 7s |
| 5 | Fill form fields | Text inputs + dropdowns | 30-45s | 37-52s |
| 6 | Click "Save" | Submit button | <1s | 38-53s |
| 7 | Processing + Success | Backend + notification | 3-4s | 41-57s |
| 8 | View updated card | Platform refreshes | 1-2s | 42-59s |

**Target Completion Time:** Under 60 seconds

---

## Flow 2: Manage Instruments from Platform Details Modal (Secondary Flow)

### Scenario: User needs comprehensive platform context

```
┌──────────────────────────────────────────────────────────────────┐
│              FLOW 2: PLATFORM DETAILS MODAL APPROACH              │
└──────────────────────────────────────────────────────────────────┘

[Station User at Dashboard]
         │
         ├─> Wants to see all instruments on a platform
         │   🎯 Goal: Comprehensive view + management
         │
         ├─> CLICKS "View Details" on Platform Card
         │   [Action: <1s]
         │
         ├─> Platform Details Modal Opens
         │   ├─> Shows general information
         │   ├─> Shows location data
         │   ├─> Shows technical specs
         │   └─> [NEW] Shows INSTRUMENTS section
         │   [Modal load: ~1s]
         │
         ├─> Scrolls to INSTRUMENTS Section
         │   [Scroll: 1-2s]
         │
         ├─> Sees Complete Instruments List
         │   ├─> Instrument 1: SVB_FOR_PHE_01 [Active]
         │   ├─> Instrument 2: SVB_FOR_RAD_01 [Active]
         │   └─> Instrument 3: SVB_FOR_FLU_01 [Maintenance]
         │
         ├─> Reviews instrument details at a glance
         │   ├─> Each card shows key specs
         │   ├─> Status badges clearly visible
         │   └─> ROI count for phenocams
         │
         └─> USER HAS 3 ACTION PATHS:

PATH A: Add New Instrument
─────────────────────────────
         │
         ├─> CLICKS "Add Instrument" button (section header)
         │
         ├─> Create Instrument modal opens
         │   (over platform details modal)
         │
         ├─> Fills form and saves
         │
         ├─> Returns to platform modal (refreshed)
         │
         └─> New instrument visible in list
             ✅ Success in context

PATH B: Edit Existing Instrument
─────────────────────────────────
         │
         ├─> Identifies instrument needing update
         │   (e.g., change status from Active to Maintenance)
         │
         ├─> CLICKS [Edit] icon button on instrument card
         │
         ├─> Edit Instrument modal opens
         │   (pre-populated with current data)
         │
         ├─> Modifies fields:
         │   ├─> Changes Status: Active → Maintenance
         │   └─> Adds maintenance notes
         │
         ├─> CLICKS "Save Changes"
         │
         ├─> Returns to platform modal (refreshed)
         │
         └─> Instrument card shows updated status badge
             ✅ Quick edit without losing context

PATH C: View Instrument Details
────────────────────────────────
         │
         ├─> Wants full information about instrument
         │
         ├─> CLICKS [View] icon button on instrument card
         │
         ├─> Instrument Details modal opens
         │   ├─> Full specifications
         │   ├─> Camera details
         │   ├─> ROI information
         │   └─> Maintenance history
         │
         ├─> Reviews information
         │
         ├─> Can take actions from here:
         │   ├─> Edit instrument
         │   ├─> Manage ROIs
         │   └─> Export data
         │
         └─> Closes modal, returns to platform view
             ✅ Comprehensive information access

⏱️  TIME: 20s (view) to 2min (edit)
🎯 ADVANTAGE: All platform context in one place
😊 EMOTION: Organized, in control
```

### Information Architecture of Platform Modal

```
╔════════════════════════════════════════════════════════════════╗
║  Platform Details Modal - Information Hierarchy                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  1. GENERAL INFORMATION (Overview)                             ║
║     ├─ Platform name, normalized ID                            ║
║     ├─ Legacy name (if exists)                                 ║
║     └─ Status badge                                            ║
║                                                                 ║
║  2. LOCATION & POSITIONING (Where)                             ║
║     ├─ Coordinates (lat/lon)                                   ║
║     └─ Platform height                                         ║
║                                                                 ║
║  3. TECHNICAL SPECIFICATIONS (How)                             ║
║     ├─ Mounting structure                                      ║
║     ├─ Deployment date                                         ║
║     └─ Station association                                     ║
║                                                                 ║
║  4. ⭐ INSTRUMENTS (What) - NEW SECTION ⭐                     ║
║     ├─ Section Header:                                         ║
║     │   └─ "INSTRUMENTS (count)" + [Add Instrument] button    ║
║     │                                                           ║
║     ├─ Instrument Cards (compact):                             ║
║     │   ├─ Normalized name (prominent)                         ║
║     │   ├─ Legacy name (if exists)                             ║
║     │   ├─ Status badge (color-coded)                          ║
║     │   ├─ Key specs (type, make, model, serial)              ║
║     │   ├─ ROI indicator (for phenocams)                       ║
║     │   └─ Action buttons: [View] [Edit] [Delete]             ║
║     │                                                           ║
║     └─ Empty state (if no instruments):                        ║
║         └─ Message + [Add Instrument] button                   ║
║                                                                 ║
║  5. ADDITIONAL INFORMATION (Notes)                             ║
║     └─ Description field                                       ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
```

---

## Flow 3: Quick Status Update (Tertiary Flow)

### Scenario: Field technician updates instrument status after maintenance

```
┌──────────────────────────────────────────────────────────────────┐
│             FLOW 3: QUICK INSTRUMENT STATUS UPDATE                │
└──────────────────────────────────────────────────────────────────┘

[Technician Returns from Field]
         │
         ├─> Just performed maintenance on SVB_FOR_FLU_01
         │   🎯 Goal: Update status from Maintenance → Active
         │
         ├─> Logs into dashboard
         │   [Login: ~5s]
         │
         ├─> Navigates to platform SVB_FOR_P02
         │   [Navigation: ~3s]
         │
         ├─> CLICKS "View Details" on platform card
         │   [Modal opens: ~1s]
         │
         ├─> Scrolls to INSTRUMENTS section
         │   [Scroll: ~2s]
         │
         ├─> Locates SVB_FOR_FLU_01 instrument
         │   👁️  Visual scan with status badges
         │   [Scan: ~3s]
         │
         ├─> CLICKS [Edit] icon button
         │   [Edit modal opens: ~1s]
         │
         ├─> Modifies Two Fields:
         │   ├─> Status: Maintenance → Active
         │   └─> Maintenance Notes: "Lens cleaning completed, recalibrated"
         │   [Edit: ~15s]
         │
         ├─> CLICKS "Save Changes"
         │   [Processing: <1s]
         │
         ├─> Success Notification
         │   ✅ "Instrument updated successfully!"
         │
         ├─> Platform Modal Refreshes
         │   ├─> SVB_FOR_FLU_01 now shows green "Active" badge
         │   └─> Maintenance notes saved in database
         │
         └─> Technician Closes Modal
             ✅ Status updated
             ⏱️  Total time: ~30 seconds
             😊 Quick, efficient workflow

ALTERNATIVE: Batch Updates
───────────────────────────
If multiple instruments need status updates:

[Same setup as above]
         │
         ├─> Opens platform details modal
         │
         ├─> For each instrument:
         │   ├─> Click [Edit]
         │   ├─> Update status
         │   ├─> Save
         │   └─> Return to modal (stays open)
         │
         └─> All updates complete in one session
             ✅ No need to navigate away
             ✅ Context maintained throughout
```

---

## Flow 4: Mobile/Responsive Flow

### Scenario: Field technician using tablet in field

```
┌──────────────────────────────────────────────────────────────────┐
│              FLOW 4: MOBILE/TABLET RESPONSIVE DESIGN              │
└──────────────────────────────────────────────────────────────────┘

[Technician Using Tablet in Field]
         │
         ├─> Opens dashboard on tablet (768px viewport)
         │
         ├─> Platform cards stack vertically
         │   ├─> Each card full width
         │   └─> Touch-friendly button sizing
         │
         ├─> Platform Actions Stack:
         │   ┌─────────────────────────┐
         │   │ [View Details]          │ ← Full width
         │   │ [Add Instrument]        │ ← Full width
         │   │ [Edit Platform]         │ ← Full width
         │   └─────────────────────────┘
         │
         ├─> Taps "View Details" (touch target ≥44px)
         │
         ├─> Platform Modal Adapts:
         │   ├─> Full screen overlay
         │   ├─> Scrollable content
         │   └─> Touch-optimized buttons
         │
         ├─> Instruments Section:
         │   ├─> Cards stack vertically
         │   ├─> Action buttons grouped at bottom
         │   └─> Larger touch targets
         │
         ├─> Taps instrument [Edit] button
         │
         ├─> Edit modal full screen
         │   ├─> Large form fields
         │   ├─> Dropdown selectors optimized for touch
         │   └─> Save button prominent at bottom
         │
         └─> Updates saved successfully
             ✅ Mobile-optimized workflow
             ✅ No pinch-zoom needed
             😊 Efficient field work

RESPONSIVE BREAKPOINTS:
─────────────────────────
• Desktop (>1024px):  Grid layout, side-by-side buttons
• Tablet (768-1024px): Narrower grid, stacked buttons in cards
• Mobile (<768px):     Single column, full-width buttons
```

---

## Flow 5: Error Handling & Recovery

### Scenario: User encounters validation error

```
┌──────────────────────────────────────────────────────────────────┐
│           FLOW 5: ERROR HANDLING & GRACEFUL RECOVERY              │
└──────────────────────────────────────────────────────────────────┘

[User Creating New Instrument]
         │
         ├─> Fills form quickly
         │
         ├─> Forgets to fill required field (Serial Number)
         │
         ├─> CLICKS "Save Instrument"
         │
         ├─> Validation Error Triggered
         │   ├─> Form does NOT close
         │   ├─> Error message appears at top:
         │   │   ⚠️  "Please complete all required fields"
         │   ├─> Missing field highlighted in red
         │   └─> Focus moves to first error field
         │
         ├─> User Corrects Error
         │   └─> Types serial number
         │
         ├─> Error highlighting clears
         │
         ├─> CLICKS "Save Instrument" again
         │
         └─> Success! Instrument created
             ✅ No data lost
             ✅ Error clearly explained
             😊 User learns requirement

ALTERNATIVE ERROR: Duplicate Name
──────────────────────────────────
         │
         ├─> User enters display name that already exists
         │
         ├─> Backend rejects with 409 Conflict
         │
         ├─> Error displayed:
         │   ⚠️  "An instrument with this name already exists"
         │   💡 "Try: 'Phenocam - East View 2' or similar"
         │
         ├─> User modifies name
         │
         └─> Saves successfully
             ✅ Helpful suggestion provided
             ✅ Clear resolution path

NETWORK ERROR SCENARIO:
───────────────────────
         │
         ├─> User in remote field location
         │
         ├─> Network timeout during save
         │
         ├─> Error displayed:
         │   ⚠️  "Connection lost. Your data has been saved locally."
         │   💡 "Retry when connection is restored"
         │
         ├─> Form remains open with data intact
         │
         ├─> [Retry] button visible
         │
         └─> User retries when signal improves
             ✅ Data not lost
             ✅ Clear recovery path
             😊 Graceful degradation
```

---

## Flow Comparison Matrix

| Flow | Primary Use Case | User Type | Time | Complexity | Context Preserved |
|------|-----------------|-----------|------|------------|-------------------|
| **Flow 1: Platform Card** | Quick instrument creation | Station User | ~60s | Low | Partial (card view) |
| **Flow 2: Platform Modal** | Comprehensive management | All Users | ~2min | Medium | Full (platform context) |
| **Flow 3: Quick Status** | Field updates | Technician | ~30s | Low | Full (stays in modal) |
| **Flow 4: Mobile** | Field work | Mobile Users | Variable | Medium | Optimized for touch |
| **Flow 5: Error Recovery** | Handle mistakes | All Users | +10-20s | Low | Complete (no data loss) |

---

## Success Metrics by Flow

### Flow 1 Metrics
- **Task Completion Rate:** >95% (currently ~0%)
- **Time to Complete:** <60 seconds (target)
- **Error Rate:** <5% of attempts
- **User Satisfaction:** 4.5/5 stars

### Flow 2 Metrics
- **Modal Usage:** 70% of users access platform modal
- **Instrument Actions from Modal:** >50% of all edits
- **Context Switching:** <1 per instrument operation
- **Discovery Rate:** >90% find instruments section

### Flow 3 Metrics
- **Quick Edit Time:** <30 seconds for status change
- **Batch Updates:** 3+ instruments per session
- **Abandonment Rate:** <2%

### Flow 4 Metrics
- **Mobile Completion Rate:** >90% (same as desktop)
- **Touch Target Success:** >98% first tap
- **Pinch-Zoom Usage:** <5% (should be unnecessary)

### Flow 5 Metrics
- **Error Recovery Rate:** >95% (users fix and continue)
- **Data Loss Events:** 0 (zero tolerance)
- **Help Requests After Error:** <10%

---

## Conclusion

These five user flows cover the complete lifecycle of instrument management for station users:

1. **Primary Flow (Platform Card)**: Fast, obvious, 3-click creation
2. **Secondary Flow (Platform Modal)**: Comprehensive context and management
3. **Tertiary Flow (Quick Update)**: Efficient status changes
4. **Responsive Flow (Mobile)**: Field-optimized experience
5. **Recovery Flow (Errors)**: Graceful handling and user guidance

By implementing these flows, station users will move from **complete inability** to manage instruments to **efficient, confident mastery** of the interface. The water will flow naturally from source (dashboard) to sea (successful instrument management).

---

**Document Version:** 1.0
**Last Updated:** 2025-09-30
**Status:** Ready for Implementation
**Next Step:** Review with development team