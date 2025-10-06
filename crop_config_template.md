# VPD Service Configuration Guide

## Adding New Crop Types

To add a new crop to the VPD service, add an entry to the `CROP_CONFIGS` object:

### Template

```javascript
cropname: {
  name: 'Display Name',
  stages: {
    seedling: { min: 0.4, max: 0.8, color: '#4CAF50', label: 'Seedling' },
    veg: { min: 0.8, max: 1.2, color: '#2196F3', label: 'Vegetative' },
    flower: { min: 1.0, max: 1.5, color: '#FF9800', label: 'Flowering' },
    'sick-dry': { min: 0.9, max: 1.3, color: '#FF5722', label: 'Recovery (Dry)' },
    'sick-wet': { min: 1.2, max: 1.6, color: '#9C27B0', label: 'Recovery (Wet)' },
    'sick-pest': { min: 0.8, max: 1.2, color: '#795548', label: 'Recovery (Pest)' },
    'sick-chemical': { min: 0.6, max: 1.0, color: '#607D8B', label: 'Recovery (Chem)' },
    'sick-unknown': { min: 0.7, max: 1.1, color: '#9E9E9E', label: 'Recovery' }
  }
}
```

### Example: Adding Basil

```javascript
basil: {
  name: 'Basil',
  stages: {
    seedling: { min: 0.4, max: 0.7, color: '#4CAF50', label: 'Seedling' },
    veg: { min: 0.7, max: 1.1, color: '#2196F3', label: 'Vegetative' },
    flower: { min: 0.8, max: 1.2, color: '#FF9800', label: 'Pre-Harvest' },
    'sick-dry': { min: 0.8, max: 1.2, color: '#FF5722', label: 'Recovery (Dry)' },
    'sick-wet': { min: 1.0, max: 1.4, color: '#9C27B0', label: 'Recovery (Wet)' },
    'sick-pest': { min: 0.7, max: 1.1, color: '#795548', label: 'Recovery (Pest)' },
    'sick-chemical': { min: 0.6, max: 1.0, color: '#607D8B', label: 'Recovery (Chem)' },
    'sick-unknown': { min: 0.7, max: 1.1, color: '#9E9E9E', label: 'Recovery' }
  }
}
```

## Available Stages

- `seedling` - Early growth phase
- `veg` - Vegetative growth
- `flower` - Flowering/fruiting phase
- `sick-dry` - Recovery from dry/heat stress
- `sick-wet` - Recovery from overwatering/humidity issues
- `sick-pest` - Recovery from pest damage
- `sick-chemical` - Recovery from nutrient burn or chemical damage
- `sick-unknown` - General recovery mode

## Color Palette

Standard stage colors (but you can customize):
- Seedling: `#4CAF50` (green)
- Vegetative: `#2196F3` (blue)
- Flowering: `#FF9800` (orange)
- Sick-Dry: `#FF5722` (red-orange)
- Sick-Wet: `#9C27B0` (purple)
- Sick-Pest: `#795548` (brown)
- Sick-Chemical: `#607D8B` (blue-grey)
- Sick-Unknown: `#9E9E9E` (grey)

## VPD Guidelines

Typical ranges by growth stage:
- **Seedlings/Clones**: 0.4-0.8 kPa (high humidity, gentle)
- **Vegetative**: 0.8-1.2 kPa (moderate humidity)
- **Flowering**: 1.0-1.6 kPa (lower humidity, varies by crop)
- **Recovery**: Adjust based on the stress type

## Adafruit IO Integration

The service supports two methods for posting charts to Adafruit IO:

### Method 1: Raw Webhook (Recommended for simplicity)

Set up a webhook trigger in Adafruit IO, then use the webhook URL:

```bash
curl "http://localhost:3000/vpd-chart?air_temp=24&crop_type=tomato&stage=veg&callback_url=https://io.adafruit.com/api/v2/webhooks/feed/YOUR_WEBHOOK_ID/raw"
```

**Response includes callback status:**
```json
{
  "vpd": "1.234",
  "status": "optimal",
  "image": "iVBORw0KGg...",
  "callback": {
    "method": "raw_webhook",
    "url": "https://io.adafruit.com/api/v2/webhooks/...",
    "success": true,
    "status": 200
  }
}
```

### Method 2: Feed URL + API Key

Directly post to a feed using your Adafruit IO API key:

```bash
curl "http://localhost:3000/vpd-chart?air_temp=24&crop_type=cannabis&stage=flower&feed_url=https://io.adafruit.com/USERNAME/feeds/FEEDNAME&aio_key=YOUR_AIO_KEY"
```

**Response includes callback status:**
```json
{
  "vpd": "1.456",
  "status": "optimal",
  "image": "iVBORw0KGg...",
  "callback": {
    "method": "feed_api",
    "feed_url": "https://io.adafruit.com/USERNAME/feeds/FEEDNAME",
    "success": true,
    "status": 200
  }
}
```

### Error Handling

If the callback fails, you'll still get the chart data with error details:

```json
{
  "vpd": "1.234",
  "image": "iVBORw0KGg...",
  "callback": {
    "method": "raw_webhook",
    "success": false,
    "error": "Request timeout",
    "status": null
  }
}
```

## Usage Examples

```bash
# View all available crops
curl http://localhost:3000/crops

# Basic usage (no callback)
curl "http://localhost:3000/vpd-chart?air_temp=24&crop_type=basil&stage=veg"

# With raw webhook callback
curl "http://localhost:3000/vpd-chart?air_temp=26&crop_type=cannabis&stage=flower&callback_url=https://io.adafruit.com/api/v2/webhooks/feed/b5q7nfGbkps3ZLeu9ojeuQvUhGVv/raw"

# With feed + API key callback
curl "http://localhost:3000/vpd-chart?air_temp=22&leaf_temp=20&crop_type=lettuce&stage=seedling&feed_url=https://io.adafruit.com/tyeth/feeds/image-base64-test&aio_key=cd73a7978e4244af83fb03881a34ba6f"
```
