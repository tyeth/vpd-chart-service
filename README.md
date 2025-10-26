# VPD Chart Service

A microservice for generating Vapor Pressure Deficit (VPD) charts with crop-specific guidance and growth stage zones.

## Features

- **Accurate VPD curves**: Zones properly curve with temperature (not flat bands!)
- **Crop-specific configurations**: Pre-configured for cannabis, tomato, lettuce, orchid, and general use
- **Growth stage awareness**: Different VPD ranges for seedling, vegetative, flowering, and recovery stages
- **Smart band display**: Shows relevant zones based on your input
- **Adafruit IO integration**: Post charts directly to your IoT dashboard

## Installation

### Local Development

```bash
npm install
npm start
```

Server runs on `http://localhost:3000` by default.

### Deploy to Cloudflare Workers

This service can be deployed to Cloudflare's global edge network with zero code changes!

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/tyeth/vpd-chart-service)

Or manually:
```bash
npm install -g wrangler
wrangler login
wrangler deploy
```

See [CLOUDFLARE.md](./CLOUDFLARE.md) for complete deployment instructions.

## API Usage

### Basic Request

```bash
GET /vpd-chart?air_temp=24&rh=65&crop_type=cannabis&stage=veg
```

### Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `air_temp` | **Yes** | Air temperature in °C | `24` |
| `rh` | No | Relative humidity (%) | `65` |
| `leaf_temp` | No | Leaf temperature in °C | `22` |
| `vpd` | No | Direct VPD value (kPa) | `1.1` |
| `crop_type` | No | Crop type (see list below) | `cannabis` |
| `stage` | No | Growth stage (see below) | `veg` |
| `show_timestamp` | No | Show last updated timestamp | `true`, `false`, or custom string |
| `timezone_offset` | No | Timezone offset in hours (alias: `tz_offset`) | `5` (UTC+5), `-8` (UTC-8) |
| `callback_url` | No | Adafruit IO webhook URL | (see integration) |
| `feed_url` | No | Adafruit IO feed URL | (see integration) |
| `aio_key` | No | Adafruit IO API key | (see integration) |

**Timestamp Parameters:**
- If `show_timestamp=true`, displays current UTC time (or with offset if `timezone_offset` is provided)
- If `show_timestamp` is a custom string, displays that string as-is
- `timezone_offset` accepts positive or negative hour offsets (e.g., `5` for UTC+5, `-8` for UTC-8)

**VPD Calculation Priority:**
- If `vpd` is provided, it's used directly (other params are informational only)
- If `rh` is provided, VPD is calculated from air temp and RH (most accurate)
- If only `leaf_temp` is provided, VPD is calculated from temp difference
- If neither `rh` nor `leaf_temp` is provided, leaf temp defaults to air_temp - 2°C

You can provide both `rh` and `leaf_temp` if you have both measurements - RH will be used for VPD calculation while leaf temp will be displayed on the chart.

### Crop Types

Available crop types:
- `general` (default)
- `cannabis`
- `tomato`
- `lettuce`
- `orchid`

See `crop_config_template.md` for adding custom crops.

### Growth Stages

Each crop has these stages configured:
- `seedling` - Early growth, high humidity needs
- `veg` - Vegetative growth
- `flower` - Flowering/fruiting phase
- `sick-dry` - Recovery from dry/heat stress
- `sick-wet` - Recovery from overwatering
- `sick-pest` - Recovery from pest damage
- `sick-chemical` - Recovery from nutrient burn
- `sick-unknown` - General recovery mode

### Chart Display Logic

The chart shows different VPD zones depending on what you specify:

**When `stage` is NOT specified:**
- Shows all 3 main growth stages: seedling, veg, flower
- Clean overview of healthy growth ranges
- Perfect for general monitoring

**When `stage` IS specified:**
- Shows ONLY that one specific stage (whether normal growth or recovery)
- Maximum clarity and focus
- Examples:
  - `stage=veg` → Shows only the vegetative zone
  - `stage=sick-dry` → Shows only the dry-stress recovery zone

**Why this design?**
- **No clutter**: Maximum 3 zones on any chart
- **Clear focus**: See exactly what you need for your situation  
- **Sick stages are standalone**: Each recovery zone is independent - only shown when specifically requested

## Response Format

```json
{
  "vpd": "1.234",
  "air_temp": 24,
  "rh": 65,
  "crop_type": "Cannabis",
  "stage": "veg",
  "status": "optimal",
  "image": "iVBORw0KGgoAAAANS...",
  "image_format": "png"
}
```

The `image` field contains a base64-encoded PNG chart.

Status values:
- `optimal` - VPD is within the ideal range for this stage
- `too_low` - VPD is below optimal (too humid)
- `too_high` - VPD is above optimal (too dry)
- `unknown` - No stage specified, can't determine status

## Examples

### Basic chart with RH
```bash
curl "http://localhost:3000/vpd-chart?air_temp=24&rh=60&crop_type=tomato&stage=flower"
```

### Chart with leaf temperature
```bash
curl "http://localhost:3000/vpd-chart?air_temp=26&leaf_temp=24&crop_type=cannabis&stage=veg"
```

### Chart with both RH and leaf temperature
```bash
curl "http://localhost:3000/vpd-chart?air_temp=26&rh=65&leaf_temp=24&crop_type=cannabis&stage=veg"
```
When both are provided, RH is used for VPD calculation (more accurate), and leaf temp is shown on the chart.

### General overview (no stage)
```bash
curl "http://localhost:3000/vpd-chart?air_temp=22&rh=70&crop_type=lettuce"
```
This shows seedling, veg, and flower zones (3 zones total).

### Focused on vegetative growth
```bash
curl "http://localhost:3000/vpd-chart?air_temp=24&rh=60&crop_type=cannabis&stage=veg"
```
This shows ONLY the veg zone (1 zone).

### Recovery from dry stress
```bash
curl "http://localhost:3000/vpd-chart?air_temp=24&rh=55&crop_type=cannabis&stage=sick-dry"
```
This shows ONLY the sick-dry recovery zone (1 zone).

### Chart with timestamp
```bash
# Show current UTC timestamp
curl "http://localhost:3000/vpd-chart?air_temp=24&rh=60&crop_type=cannabis&stage=veg&show_timestamp=true"

# Show timestamp with timezone offset (UTC+5)
curl "http://localhost:3000/vpd-chart?air_temp=24&rh=60&crop_type=cannabis&stage=veg&show_timestamp=true&timezone_offset=5"

# Show timestamp with negative offset (UTC-8, Pacific Time)
curl "http://localhost:3000/vpd-chart?air_temp=24&rh=60&crop_type=cannabis&stage=veg&show_timestamp=true&tz_offset=-8"

# Show custom timestamp
curl "http://localhost:3000/vpd-chart?air_temp=24&rh=60&crop_type=cannabis&stage=veg&show_timestamp=2025-10-26%2010:30:00"
```

### List available crops and stages
```bash
curl "http://localhost:3000/crops"
```

## Adafruit IO Integration

### Method 1: Raw Webhook (Recommended)

1. Create a webhook in Adafruit IO
2. Use the webhook URL as `callback_url`:

```bash
curl "http://localhost:3000/vpd-chart?air_temp=24&rh=65&crop_type=cannabis&stage=veg&callback_url=https://io.adafruit.com/api/v2/webhooks/feed/YOUR_WEBHOOK_ID/raw"
```

### Method 2: Feed + API Key

```bash
curl "http://localhost:3000/vpd-chart?air_temp=24&rh=65&crop_type=cannabis&stage=veg&feed_url=https://io.adafruit.com/USERNAME/feeds/FEED_KEY&aio_key=YOUR_AIO_KEY"
```

Both methods return the chart image in the response AND post it to Adafruit IO.

## How VPD Zones Work

The charts display VPD zones as **curves, not flat bands**. This is scientifically accurate because:

1. VPD is calculated from temperature and relative humidity
2. At constant RH, higher temperatures produce higher VPD
3. Each zone represents a constant RH band
4. These RH bands create upward-sloping curves as temperature increases

For example, the vegetative zone (0.8-1.2 kPa at 24°C) represents approximately 72% RH to 56% RH. At 15°C, those same RH values produce lower VPD (~0.5-0.7 kPa), while at 35°C they produce higher VPD (~1.3-1.9 kPa).

## Chart Axes

The chart uses reversed axes for easier reading:

- **X-axis (Humidity)**: 100% (left) to 0% (right) - High humidity on left, low on right
- **Y-axis (Temperature)**: 35°C (bottom) to 15°C (top) - High temperature at bottom, low at top

This layout makes it intuitive to see that:
- Moving left = higher humidity = lower VPD (more humid conditions)
- Moving right = lower humidity = higher VPD (drier conditions)
- Moving down = higher temperature = higher VPD (hotter conditions)
- Moving up = lower temperature = lower VPD (cooler conditions)

## Development

```bash
# Install dependencies
npm install

# Run in dev mode with auto-reload
npm run dev

# Run tests
node test_chart.js
```

## License

MIT

## Contributing

See `crop_config_template.md` for instructions on adding new crop types.
