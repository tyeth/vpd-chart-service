# VPD Chart Display Modes - Visual Guide

## Display Logic Summary

The chart filters VPD zones based on what you specify:
- **No stage**: Shows all 3 normal growth stages (seedling, veg, flower)
- **Specific stage**: Shows ONLY that one stage (whether normal or sick/recovery)

---

## Mode 1: No Stage Specified (General Overview)

**Request:** `?air_temp=24&rh=65&crop_type=cannabis`

**Shows:**
- ✅ Seedling zone
- ✅ Vegetative zone  
- ✅ Flowering zone
- ❌ sick-* zones (all hidden)

**Purpose:** Clean overview of all healthy growth ranges for general monitoring.

**Opacity:** All zones at 55% (medium)

---

## Mode 2: Normal Growth Stage Selected

**Request:** `?air_temp=24&rh=65&crop_type=cannabis&stage=veg`

**Shows:**
- ❌ Seedling zone (hidden)
- ✅ **Vegetative zone ONLY** (high opacity)
- ❌ Flowering zone (hidden)
- ❌ All sick-* zones (hidden)

**Purpose:** Focused view on your current growth stage. Clear and uncluttered.

**Opacity:** Selected stage at 99% (very high)

---

## Mode 3: Recovery/Sick Stage Selected

**Request:** `?air_temp=24&rh=65&crop_type=cannabis&stage=sick-dry`

**Shows:**
- ❌ All normal growth zones (hidden)
- ✅ **sick-dry zone ONLY** (high opacity)
- ❌ Other sick-* zones (hidden)

**Purpose:** When you know your plant is sick, show ONLY the recovery zone for that specific problem.

**Opacity:** Selected recovery stage at 99% (very high)

---

## Why This Design?

### 1. Maximum Clarity
Each chart shows exactly what you need to know:
- **General mode**: "What are the healthy ranges?" → 3 stages
- **Growth mode**: "Am I in the right zone for vegetative growth?" → 1 stage
- **Recovery mode**: "What VPD helps recovery from dry stress?" → 1 stage

### 2. Sick Stages Are Standalone
The `sick-*` stages are for **specific recovery situations**:
- If your plant has dry stress → use `stage=sick-dry` 
- If your plant has pest damage → use `stage=sick-pest`
- You only see the recovery zone relevant to YOUR specific problem
- Other sick stages are NOT shown (they're not relevant)

### 3. No Visual Clutter
- 1 or 3 zones maximum on any chart
- No confusing overlapping bands
- Clean, readable, actionable

---

## Quick Reference Table

| Scenario | Use This | Shows |
|----------|----------|-------|
| General monitoring | No `stage` param | 3 healthy growth stages |
| Growing seedlings | `stage=seedling` | Seedling zone ONLY |
| Vegetative growth | `stage=veg` | Veg zone ONLY |
| Flowering/fruiting | `stage=flower` | Flower zone ONLY |
| Recovering from dry stress | `stage=sick-dry` | Sick-dry zone ONLY |
| Recovering from overwatering | `stage=sick-wet` | Sick-wet zone ONLY |
| Recovering from pests | `stage=sick-pest` | Sick-pest zone ONLY |
| Recovering from nutrients | `stage=sick-chemical` | Sick-chemical zone ONLY |
| Unknown problem | `stage=sick-unknown` | Sick-unknown zone ONLY |

---

## Implementation Notes

The logic in `server.js`:

```javascript
const normalGrowthStages = ['seedling', 'veg', 'flower'];

if (stage) {
  // Show ONLY the specified stage (whether normal or sick)
  stagesToShow = [stage];
} else {
  // Show all normal growth stages
  stagesToShow = normalGrowthStages;
}
```

**Simple and clean!** 📊✨
