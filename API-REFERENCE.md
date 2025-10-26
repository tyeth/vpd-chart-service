# VPD Chart Service - Quick Reference

## Endpoints

### GET /vpd-chart
### POST /vpd-chart
Generate a VPD (Vapor Pressure Deficit) chart image.

## Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `air_temp` | float | Air temperature in °C |

## Optional Parameters - VPD Calculation

At least ONE of these must be provided:

| Parameter | Type | Description |
|-----------|------|-------------|
| `rh` | float | Relative humidity (%) |
| `leaf_temp` | float | Leaf temperature in °C |
| `vpd` | float | VPD value in kPa (if pre-calculated) |

## Optional Parameters - Chart Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `crop_type` | string | `general` | Crop type: `general`, `cannabis`, `tomato`, `lettuce` |
| `stage` | string | none | Growth stage (see crop-specific stages below) |
| `show_timestamp` | string/boolean | none | Show last updated timestamp: `true`, `false`, or custom string |
| `timezone_offset` | float | none | Timezone offset in hours (alias: `tz_offset`): e.g., `5` for UTC+5, `-8` for UTC-8 |

## Optional Parameters - Customization

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `font_url` | string | none | URL to TTF/OTF font file |
| `font_name` | string | auto | Font family name override |

## Optional Parameters - Callbacks

| Parameter | Type | Description |
|-----------|------|-------------|
| `callback_url` | string | POST full response to this URL |
| `feed_url` | string | Adafruit IO feed URL (requires `aio_key`) |
| `aio_key` | string | Adafruit IO API key |

## Growth Stages by Crop

### General
- `seedling`, `veg`, `flower`
- Recovery: `sick-dry`, `sick-wet`, `sick-pest`, `sick-chemical`, `sick-unknown`

### Cannabis
- `seedling`, `veg`, `flower`
- Recovery: `sick-dry`, `sick-wet`, `sick-pest`, `sick-chemical`, `sick-unknown`

### Tomato
- `seedling`, `veg`, `flower`
- Recovery: `sick-dry`, `sick-wet`, `sick-pest`, `sick-chemical`, `sick-unknown`

### Lettuce  
- `seedling`, `veg`, `flower`
- Recovery: `sick-dry`, `sick-wet`, `sick-pest`, `sick-chemical`, `sick-unknown`

## Examples

### Basic Usage (GET)
```bash
# Simple RH-based VPD
curl "http://localhost:8787/vpd-chart?air_temp=25&rh=60"

# With crop and stage
curl "http://localhost:8787/vpd-chart?air_temp=24&rh=65&crop_type=tomato&stage=flower"

# Using leaf temperature
curl "http://localhost:8787/vpd-chart?air_temp=26&leaf_temp=24"
```

### POST Requests
```powershell
# PowerShell
Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8787/vpd-chart?air_temp=25&rh=60" `
  -OutFile chart.png

# curl (bash)
curl -X POST "http://localhost:8787/vpd-chart?air_temp=25&rh=60" -o chart.png
```

### Custom Fonts
```bash
# Montserrat font
curl "http://localhost:8787/vpd-chart?air_temp=25&rh=60&font_url=https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Regular.ttf"

# Open Sans font
curl "http://localhost:8787/vpd-chart?air_temp=25&rh=60&font_url=https://github.com/googlefonts/opensans/raw/main/fonts/ttf/OpenSans-Regular.ttf"
```

### With Timestamp
```bash
# Show current UTC timestamp
curl "http://localhost:8787/vpd-chart?air_temp=25&rh=60&show_timestamp=true"

# Show timestamp with timezone offset (UTC+5)
curl "http://localhost:8787/vpd-chart?air_temp=25&rh=60&show_timestamp=true&timezone_offset=5"

# Show timestamp with negative offset (UTC-8)
curl "http://localhost:8787/vpd-chart?air_temp=25&rh=60&show_timestamp=true&tz_offset=-8"

# Show custom timestamp string
curl "http://localhost:8787/vpd-chart?air_temp=25&rh=60&show_timestamp=2025-10-26%2010:30:00"
```

### With Callbacks
```bash
# Adafruit IO
curl "http://localhost:8787/vpd-chart?air_temp=25&rh=60&feed_url=https://io.adafruit.com/USERNAME/feeds/FEED&aio_key=YOUR_KEY"

# Custom webhook
curl "http://localhost:8787/vpd-chart?air_temp=25&rh=60&callback_url=https://example.com/webhook"
```

## Response Format

```json
{
  "vpd": 1.23,
  "air_temp": 25,
  "leaf_temp": null,
  "rh": 60,
  "crop_type": "general",
  "stage": null,
  "status": "unknown",
  "image": "data:image/png;base64,iVBORw0KGg...",
  "timestamp": "2025-10-06T22:10:00.000Z"
}
```

## Status Values

| Status | Description |
|--------|-------------|
| `optimal` | VPD is within the optimal range for the stage |
| `too_low` | VPD is below optimal (too humid) |
| `too_high` | VPD is above optimal (too dry) |
| `unknown` | No stage specified, cannot determine status |

## Other Endpoints

### GET /crops
List all available crops and their stages.

```bash
curl "http://localhost:8787/crops"
```

Response:
```json
{
  "general": {
    "name": "General",
    "stages": ["seedling", "veg", "flower", "sick-dry", ...]
  },
  "cannabis": {
    "name": "Cannabis",
    "stages": ["seedling", "veg", "flower", ...]
  }
}
```

### GET /health
Health check endpoint.

```bash
curl "http://localhost:8787/health"
```

Response:
```json
{
  "status": "ok"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "air_temp is required and must be a number"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error message",
  "stack": "Error stack trace"
}
```

## Performance Notes

- **First request**: ~500ms (font initialization)
- **Subsequent requests**: ~400ms (font cached)
- **Custom font (first)**: ~800ms (download + parse)
- **Custom font (cached)**: ~400ms

## Deployment

### Local Development
```bash
# Node.js server
npm start
# Available at http://localhost:3000

# Cloudflare Workers (local)
npm run cf:dev
# Available at http://localhost:8787
```

### Production
```bash
# Deploy to Cloudflare Workers
npm run cf:deploy
```

## Supported Fonts

- **TTF** (TrueType Font) ✅
- **OTF** (OpenType Font) ✅
- **WOFF/WOFF2** ❌ (browser formats, not supported)

## Links

- Documentation: See `CUSTOM-FONTS.md` for detailed font usage
- Success story: See `CLOUDFLARE-SUCCESS.md` for implementation details
