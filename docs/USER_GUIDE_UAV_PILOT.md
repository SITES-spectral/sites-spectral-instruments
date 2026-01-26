# SITES Spectral UAV Pilot User Guide

> **Version**: 15.6.0
> **Portal**: https://{station}.sitesspectral.work
> **Last Updated**: 2026-01-26

---

## Overview

This guide is for users with `uav-pilot` role who operate drones at SITES Spectral research stations. UAV pilots can view missions, log flights, and report incidents at stations where they are authorized.

---

## Getting Started

### Pilot Registration

Before accessing the system, you must be registered by a station admin:

1. Contact station admin with your details:
   - Full name
   - Email address
   - Organization
   - Certificate type and number
   - Insurance policy details
2. Admin creates your account
3. You receive access credentials

### Required Certifications

Swedish Transport Agency (Transportstyrelsen) requirements:

| Certificate | Use Case | Requirements |
|-------------|----------|--------------|
| A1/A3 | Basic open category | Online course + exam |
| A2 | Near people | A1/A3 + practical training |
| STS-01 | VLOS professional | Specific category training |
| STS-02 | BVLOS operations | Advanced training |

### Insurance Requirements

All pilots must maintain:
- Valid liability insurance
- Policy covering SITES operations
- Minimum coverage as per regulations

System tracks expiry dates and warns 30 days before expiration.

---

## Accessing the Portal

### Login

1. Navigate to your authorized station portal (e.g., https://svb.sitesspectral.work)
2. Enter email for OTP authentication
3. Check email and enter OTP
4. Access granted to UAV operations

### Dashboard

Your UAV pilot dashboard shows:

- **Your Missions**: Assigned missions
- **Recent Flights**: Your flight log history
- **Certification Status**: Expiry warnings
- **Station Information**: Current station details

---

## Understanding Missions

### Mission Lifecycle

```
Draft → Planned → Approved → In Progress → Completed
                     ↓              ↓
                 Cancelled      Aborted
```

### Mission Statuses

| Status | Meaning | Your Actions |
|--------|---------|--------------|
| Draft | Being created | Wait |
| Planned | Details complete | Review |
| Approved | Ready to fly | Execute |
| In Progress | Currently active | Log flights |
| Completed | Successfully done | View only |
| Aborted | Stopped early | View only |
| Cancelled | Never started | View only |

### Viewing Your Missions

1. Go to **UAV Operations** section
2. Click **"Missions"** tab
3. Your assigned missions are highlighted
4. Filter by status if needed

### Mission Details

Each mission displays:

| Field | Description |
|-------|-------------|
| Mission Code | Unique identifier (e.g., SVB_2026-01-26_001) |
| Name | Descriptive title |
| Planned Date | Scheduled flight date |
| Flight Pattern | Grid, Crosshatch, Perimeter, POI |
| Target Altitude | Meters above ground |
| Target Overlap | Image overlap percentage |
| AOI | Area of interest (map view) |
| Objectives | What to capture |
| Weather Requirements | Conditions for flight |

---

## Flight Day Procedures

### Pre-Flight

1. **Check Mission Approval**: Ensure status is "Approved"
2. **Review Weather**: Verify conditions meet requirements
3. **Equipment Check**:
   - Aircraft condition
   - Battery charge levels
   - Controller connection
   - Camera/sensor status
4. **Airspace**: Confirm no restrictions

### Starting a Mission

Once on-site with equipment ready:

1. Select your mission from the list
2. Verify you're the assigned pilot
3. Click **"Start Mission"**
4. Confirm weather conditions
5. Mission status changes to **"In Progress"**

---

## Logging Flights

### When to Log

Create a flight log for:
- Each battery used
- Each takeoff/landing cycle
- Even partial flights

### Creating a Flight Log

1. Go to **"Flights"** tab
2. Click **"+ Log Flight"**
3. Fill in required fields:

#### Basic Information

| Field | Description |
|-------|-------------|
| Mission | Auto-selected if mission is active |
| Platform | Select the UAV used |
| Takeoff Time | Actual takeoff (local time) |
| Landing Time | Actual landing (local time) |

#### Location Data

| Field | Description |
|-------|-------------|
| Takeoff Latitude | GPS coordinates |
| Takeoff Longitude | GPS coordinates |
| Takeoff Altitude | Meters (if available) |

#### Flight Metrics

| Field | Description |
|-------|-------------|
| Max Altitude AGL | Maximum height in meters |
| Max Distance | Furthest point from takeoff |
| Total Distance | Path length flown |
| Average Speed | Meters per second |

#### Battery Data

| Field | Description |
|-------|-------------|
| Battery | Select from station inventory |
| Start Percentage | Battery level at takeoff |
| End Percentage | Battery level at landing |

#### Data Captured

| Field | Description |
|-------|-------------|
| Images Captured | Total photo count |
| Data Size (MB) | Total data collected |

4. Click **"Save Flight Log"**

### Flight Duration

Duration is automatically calculated from takeoff and landing times.

### Battery Usage

Battery consumption is automatically calculated and logged.

---

## Reporting Incidents

### What to Report

Report **ALL** incidents, including:
- GPS signal issues
- Wind gusts affecting flight
- Near misses
- Equipment malfunctions
- Property concerns
- Any safety-related events

### Incident Severity Levels

| Severity | Description | Examples |
|----------|-------------|----------|
| **Minor** | No damage, flight continued | GPS glitch, wind gust |
| **Moderate** | Flight affected | Forced landing, video loss |
| **Major** | Equipment damage | Crash, component failure |
| **Critical** | Safety incident | Near-miss, injury, property damage |

### Reporting an Incident

1. Open the flight log
2. Click **"Report Incident"**
3. Select severity level
4. Describe what happened:
   - What occurred
   - When it happened
   - Contributing factors
   - Actions taken
   - Outcome
5. Click **"Submit Report"**

### After Reporting

- Major/Critical incidents are flagged for admin review
- You may be contacted for additional details
- Do not modify the aircraft until cleared (for major/critical)

---

## Completing Missions

### When Mission is Done

After all planned flights are complete:

1. Verify all flight logs are entered
2. Contact mission coordinator
3. Station admin will mark mission complete

**Note**: Pilots cannot complete missions directly; this requires station admin authorization.

### Post-Mission Data

Station admin will record:
- Quality score
- Coverage percentage
- Overall notes

---

## Viewing Your Records

### Flight History

1. Go to **"Flights"** tab
2. Filter by date range
3. View your logged flights

### Flight Statistics

Your pilot profile shows:
- Total flight hours (SITES)
- Number of flights
- Last flight date
- Incidents logged

### Certification Status

1. Go to **"Profile"** or ask admin
2. View:
   - Certificate type
   - Certificate expiry
   - Insurance expiry
   - Authorized stations

---

## Battery Management

### Selecting Batteries

When logging flights, select from available batteries:

| Status | Meaning |
|--------|---------|
| Available | Ready to use |
| Charging | Being charged |
| In Use | Currently deployed |
| Maintenance | Under inspection |

### Battery Best Practices

- Always log accurate start/end percentages
- Report any unusual battery behavior
- Note if battery feels warm or swollen
- Don't use batteries showing degradation

---

## Weather Considerations

### Typical Requirements

| Condition | Typical Limit |
|-----------|---------------|
| Wind Speed | < 10-12 m/s |
| Precipitation | None |
| Visibility | > 5 km |
| Temperature | 0°C to 40°C |

### Recording Weather

When starting a mission, record:
- Temperature (°C)
- Wind speed (m/s)
- Wind direction (degrees)
- Cloud cover (%)
- Precipitation (none/light/moderate/heavy)

### Weather Holds

If conditions deteriorate:
1. Land safely
2. Log partial flight
3. Note weather change in logs
4. Wait for conditions to improve

---

## Safety Reminders

### Pre-Flight Checklist

- [ ] Mission approved
- [ ] Weather acceptable
- [ ] Airspace clear
- [ ] Equipment inspected
- [ ] Batteries charged
- [ ] Observer in place (if required)
- [ ] Emergency procedures reviewed

### During Flight

- Maintain visual line of sight (unless BVLOS certified)
- Monitor battery levels
- Watch for other aircraft
- Be aware of weather changes
- Keep communication with observer

### Emergency Procedures

If emergency occurs:
1. Attempt safe landing
2. Do not risk injury to recover aircraft
3. Secure scene if crash occurs
4. Report incident immediately
5. Do not modify evidence

---

## Communication

### Before Flight Day

- Confirm mission details with coordinator
- Report any certification changes
- Notify if unable to fly

### During Operations

- Maintain contact with station personnel
- Report any issues immediately
- Confirm data capture success

### After Flight

- Submit all flight logs same day
- Report any incidents promptly
- Note any equipment concerns

---

## Frequently Asked Questions

### Q: Can I create my own missions?

A: No. Missions are created by station admins. You execute approved missions.

### Q: What if weather prevents flying?

A: Log any partial flights, note the abort reason, and contact station admin to reschedule.

### Q: How do I extend my station authorization?

A: Contact station admin for additional station access.

### Q: What if my certification is expiring?

A: System warns 30 days before. Complete renewal and update admin with new details.

### Q: Can I edit a submitted flight log?

A: Contact station admin for corrections after submission.

---

## Getting Help

### Technical Issues

Contact station administrator for:
- Login problems
- Missing data
- System errors

### Flight Operations

Contact mission coordinator for:
- Mission questions
- Schedule changes
- Equipment issues

### Emergencies

In case of emergency:
1. Prioritize safety
2. Follow emergency procedures
3. Contact station immediately
4. Report incident in system

---

## Related Documentation

- [[USER_GUIDE_STATION_ADMIN]] - Station admin guide
- [[UAV_PILOT_SYSTEM]] - Technical UAV system documentation
- [[API_REFERENCE]] - API documentation (technical)
