# ADR-003: Legacy ROI System Preservation

## Status

**Accepted**

## Context

Regions of Interest (ROIs) are polygon definitions on phenocam images used for time-series analysis. The phenocam processing pipeline (L2/L3 products) references ROIs by their `roi_name` (e.g., `ROI_01`, `ROI_02`).

**Critical constraint**: If an ROI is modified (polygon changed), the historical time-series data becomes inconsistent. The same `ROI_01` would mean different polygons before and after the change.

Options when a user wants to modify an ROI:
1. Allow direct edit (breaks time-series integrity)
2. Prevent all edits (too restrictive)
3. Create new ROI, mark old as legacy (preserves integrity)

## Decision

Implement a **Legacy ROI System** with the following rules:

### Database Schema

```sql
ALTER TABLE instrument_rois ADD COLUMN is_legacy BOOLEAN DEFAULT false;
ALTER TABLE instrument_rois ADD COLUMN legacy_date DATETIME;
ALTER TABLE instrument_rois ADD COLUMN replaced_by_roi_id INTEGER;
ALTER TABLE instrument_rois ADD COLUMN timeseries_broken BOOLEAN DEFAULT false;
ALTER TABLE instrument_rois ADD COLUMN legacy_reason TEXT;
```

### Workflow by Role

| Role | Edit Behavior |
|------|---------------|
| Station User | Creates new ROI, old marked as legacy |
| Station Admin | Creates new ROI, old marked as legacy |
| Super Admin | Can override with warning (timeseries_broken=true) |

### Process

1. User clicks "Edit" on existing ROI
2. System creates a **copy** of the ROI with new `roi_name`
3. User modifies the copy
4. On save:
   - Original ROI: `is_legacy=true`, `legacy_date=now`, `replaced_by_roi_id=new.id`
   - New ROI: Active, new ROI number
5. Domain event `ROIModified` published for audit trail

### Super Admin Override

Super admins can directly edit ROIs with:
- Double confirmation dialog ("Type CONFIRM to proceed")
- `timeseries_broken=true` flag set on the ROI
- Domain event `TimeseriesBroken` published

## Consequences

### Positive

- **Data integrity**: L2/L3 products remain consistent
- **Audit trail**: Full history of ROI changes
- **Flexibility**: Super admins can override when necessary
- **User experience**: Station users can still modify ROIs

### Negative

- **Complexity**: More UI states, database fields
- **Storage**: Old ROIs retained (minor - polygons are small)

### Neutral

- ROI numbers increment over time as changes are made
- Phenocam processing must handle legacy ROIs appropriately

## Alternatives Considered

### Alternative 1: Version All ROI Edits

Store ROI versions in a separate table. Rejected as too complex and doesn't solve the naming problem for L2/L3 products.

### Alternative 2: Timestamp-Based ROI References

L2/L3 products reference ROI by (instrument_id, roi_name, timestamp). Rejected because it would require changes to the entire phenocam processing pipeline.

### Alternative 3: Immutable ROIs

Never allow edits, only delete and recreate. Rejected as poor UX - users want to "adjust" an ROI, not "delete and recreate."

## Related

- [[ADR-004-domain-events\|ADR-004: Domain Events]]
- [[../../docs/roi/ROI_README\|ROI Documentation]]

---

**Date**: 2025-11-25
**Author**: SITES Spectral Team
**Reviewers**: Phenocam Processing Team
