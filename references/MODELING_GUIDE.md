# 3D Modeling Guide from Reference Drawings

## Quick Reference
- **Total Width**: 13,101 mm (13.1 m)
- **Total Depth**: 9,900 mm (9.9 m)  
- **Total Height**: 4,158 mm (4.2 m)
- **Base Foundation**: 1,150 mm
- **Main Interior**: 3,900 mm tall
- **Roof Structure**: 1,568 mm

---

## Modeling Workflow

### Phase 1: Foundation & Base Platform
- Create platform 1,150 mm high
- Width: 13,101 mm × Depth: 9,900 mm
- Source: `front-elevation.jpg` base line, `transverse-section.jpg` foundation

### Phase 2: Column Structure
**Layout Pattern** (9 columns across front):
```
1,564.5 | 775.5 | 2,475 | 825 | 4,950 | 825 | 2,475 | 775.5 | 1,564.5 mm
```

**Column Specs**:
- Height: 3,800 mm (base to eave connection point)
- All columns are load-bearing timber posts
- Source: `transverse-section.jpg` shows column positioning and proportions

### Phase 3: Dougong Bracket System
**Critical for authentic appearance**
- Location: At column capitals, supporting roof beams
- Complexity: 4-level stepped bracket system
- Width: 1,881 mm (extends from center column)
- Base: 1,155 × 1,155 mm platform
- Depth progression: Multiple tiers step outward
- Source: `dougong-bracket-detail.jpg` - use for layer-by-layer construction

**Implementation tip**: Model as modular assembly with repeated elements at each tier. Center finial detail visible at top.

### Phase 4: Roof Frame
**Roof Line Details**:
- Ridge peak height: 4,158 mm total
- Eave overhang: ~1,568 mm front and sides
- Roof tiles: Traditional curved ceramic pattern
- Upturned wing corners with decorative finials

**Structural Support**:
- Roof beams sit on top of dougong brackets
- Interior ceiling shows coffered grid pattern
- Source: `longitudinal-section.jpg` and `front-elevation.jpg`

### Phase 5: Fenestration & Doors

**Central Entrance** (front):
- Dimensions: 4,950 mm wide × 3,000 mm tall
- Double wooden doors with brass hardware
- 8 horizontal door panels visible in sketches

**Side Windows** (both sides):
- Dimensions: 3,300 mm wide × 2,800 mm tall
- Vertical louver/shutter pattern
- Appears to be functional ventilation design

**Upper Windows**:
- Small rectangular windows in upper wall section
- Source: `front-elevation.jpg`

---

## Scale Verification

**Use human figure as scale check**:
- Figure height in `longitudinal-section.jpg` ≈ 1,600 mm
- Compare with surrounding elements for accuracy
- Main entrance should be about 1.9× human height

---

## Data File Reference
All measurements extracted into: `measurements.json`

**Use JSON for**:
- Parametric modeling
- Automated placement of repeated elements
- Easy updates if reference data changes

---

## Source Drawing Cross-References

| Element | Best Source | Notes |
|---------|------------|-------|
| Overall proportions | front-elevation.jpg | Shows complete facade |
| Column layout | transverse-section.jpg | Clear column spacing |
| Bracket detail | dougong-bracket-detail.jpg | Use for accurate replication |
| Interior space | longitudinal-section.jpg | Shows depth & height relationships |
| Sketch reference | temple-front-elevation-sketch.jpg | Artistic proportion guide |

---

## Material & Color Notes
- **Roof**: Gray-glazed ceramic tiles with red accents
- **Walls**: Brick/stone base (light gray), wood frame (red-brown)
- **Woodwork**: Deep red lacquered timber
- **Accents**: Gold/brass hardware, yellow ornamental elements
- **Finials**: Glazed ceramic, typically green-gray

---

## Common Pitfalls to Avoid
1. **Under-modeling the dougong**: This is the most visually distinctive element
2. **Roof overhang too shallow**: 1,568 mm is substantial - don't undersell it
3. **Window proportions**: Vertical louver pattern is critical to authenticity
4. **Column taper**: Original likely has slight taper - verify from detail photos
5. **Interior ceiling**: Don't skip the coffered grid - visible from exterior angles

---

## Next Steps
1. ✓ Create base platform with correct proportions
2. ✓ Place columns at exact spacing from measurements.json
3. ✓ Build dougong bracket system (most complex element)
4. ✓ Construct roof frame geometry
5. ✓ Add fenestration with proper detailing
6. ✓ Verify scale against human figure reference
7. ✓ Apply materials and textures from reference photos
