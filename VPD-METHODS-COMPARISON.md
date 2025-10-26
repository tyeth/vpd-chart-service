# VPD Calculation Methods: Air-Based vs Canopy-Based

## Two Valid VPD Measurements

There are **two scientifically valid ways** to calculate VPD, each measuring a different aspect of the plant-atmosphere system:

### 1. Air-Based VPD (Atmospheric VPD)

**Formula:**
```
VPD = SVP(air_temperature) - Actual_VP
```

**What it measures:** The evaporative demand of the atmosphere - how much more moisture the air can hold at its current temperature.

**Used for:**
- Climate control and HVAC systems
- General growing guides and recommendations
- Published VPD ranges in cultivation literature
- When leaf temperature is not measured

**With user's data (22.64°C air, 60.22% RH):**
- SVP at air temp: 2.748 kPa
- Actual VP: 1.655 kPa
- **Air VPD: 1.09 kPa**

### 2. Canopy-Based VPD (Leaf-to-Air VPD)

**Formula:**
```
VPD = SVP(leaf_temperature) - Actual_VP
```

**What it measures:** The vapor pressure gradient between the leaf surface and surrounding air - the actual driving force for transpiration.

**Used for:**
- Precision agriculture with leaf temperature sensors
- Greenhouse management with IR thermometers
- Optimizing transpiration for specific crops
- When leaf temperature differs significantly from air temperature

**With user's data (18.34°C leaf, 22.64°C air, 60.22% RH):**
- SVP at leaf temp: 2.108 kPa
- Actual VP: 1.655 kPa
- **Canopy VPD: 0.45 kPa**

## Which Method Does This Service Use?

**This service implements Air-Based VPD** because:
1. It follows the standard psychrometric definition from Wikipedia/ASHRAE
2. Most users don't have leaf temperature sensors
3. Published VPD ranges are based on air-based calculations
4. It matches commercial VPD calculators and climate controllers

## Which Method Does Adafruit Use?

**The Adafruit implementation calculates Canopy-Based VPD**, which is:
- ✅ **Valid and scientifically sound** for greenhouse applications
- ✅ **More accurate for predicting transpiration** when leaf sensors are available
- ✅ **Appropriate for precision agriculture** with IR temperature monitoring
- ⚠️ **Different from standard published VPD ranges**

## Comparison with Real Data

Using the user's actual sensor readings:
- Air temperature: 22.64°C
- Leaf temperature: 18.34°C
- Relative humidity: 60.22%

| Method | VPD Result | Use Case |
|--------|------------|----------|
| **Air-Based (this service)** | 1.09 kPa | General climate control, standard ranges |
| **Canopy-Based (Adafruit)** | 0.45 kPa | Precision transpiration management |

## Why the Difference Matters

In this case, the leaf is **4.3°C cooler** than the air (typical for transpiring plants). This creates a significant difference:

- **Air VPD (1.09 kPa)** tells you the air is moderately dry
- **Canopy VPD (0.45 kPa)** tells you the leaf isn't experiencing much water stress

Both measurements are correct - they're just measuring different things!

## Physical Interpretation

### Air-Based VPD
- Represents how "thirsty" the air is
- Higher values = drier air, more evaporative demand
- What environmental controls respond to

### Canopy-Based VPD  
- Represents the actual vapor gradient at the leaf surface
- Accounts for leaf cooling through transpiration
- More directly related to plant water stress
- Better for predicting stomatal behavior

## When Leaf Temperature Differs from Air

Plants actively transpiring often have leaf temperatures **2-5°C cooler** than air temperature due to evaporative cooling. In these conditions:

- Air VPD will be **higher** (shows atmospheric demand)
- Canopy VPD will be **lower** (shows actual leaf stress)

This is why precision growers prefer canopy VPD - it better represents what the plant is experiencing.

## Best Practices

### For General Growing (without leaf sensors)
Use **Air-Based VPD**:
- Easier to measure (just air temp + RH)
- Matches published growing guides
- Adequate for most applications
- **Use this service's implementation**

### For Precision Greenhouse (with IR sensors)
Use **Canopy-Based VPD**:
- More accurate for transpiration prediction
- Accounts for leaf temperature
- Better for optimization
- **Use the Adafruit implementation**

## Converting Published Ranges

Most published VPD ranges assume **air-based VPD**. If using canopy-based VPD:

**Approximate conversion** (when leaf is ~2-4°C cooler):
- Published range × 0.4-0.6 ≈ Equivalent canopy VPD

**Example:**
- Vegetative air VPD: 0.8-1.2 kPa
- Equivalent canopy VPD: ~0.3-0.7 kPa

**Note:** Exact conversion depends on the temperature difference between air and leaf.

## Conclusion

Both methods are valid! The choice depends on:

1. **Available sensors:** Leaf temp sensor? Use canopy VPD. Only air sensors? Use air VPD.
2. **Application:** Precision optimization? Canopy VPD. General growing? Air VPD.
3. **Reference ranges:** Published guides use air VPD.

**This service correctly implements air-based VPD** for standard applications.

**The Adafruit implementation correctly implements canopy-based VPD** for precision greenhouse applications.

They're measuring different but complementary aspects of the plant environment!

## References

1. **Wikipedia: Vapour-pressure deficit** - Describes both methods
2. **Wikipedia: Partial pressure** - Explains vapor pressure calculations
3. Jones, H.G. (2013). "Plants and Microclimate" - Discusses leaf-to-air gradients
4. Bailey, B.J. et al. (1993). "Canopy transpiration" - Applications in horticulture
