# Quick Fix Summary: "document is not defined"

## Problem
When accessing `/vpd-chart` via Cloudflare Workers, you got:
```
ReferenceError: document is not defined
```

But `/crops` worked fine, and everything worked with `npm start`.

## Root Cause
The `canvas` npm package tries to use browser DOM APIs (`document`, `window`) which don't exist in Cloudflare Workers runtime.

## Solution Applied

### 1. Created `canvas-compat.js`
A smart compatibility layer that auto-detects the environment and loads the right canvas library.

### 2. Updated `server.js`
Changed the import to use the compatibility layer:
```javascript
const { createCanvas } = require('./canvas-compat');
```

### 3. Updated `package.json`
Added `@napi-rs/canvas` (Workers-compatible) alongside `canvas` (Node.js):
```json
"@napi-rs/canvas": "^0.1.58"
```

## Next Steps

Install the new dependency:
```bash
npm install
```

## How It Works Now

The compatibility layer automatically chooses the right library:

- **`npm start`** → Uses `canvas` (Node.js)
- **`npm run cf:dev`** → Uses `@napi-rs/canvas` (Workers)
- **`npm run deploy`** → Uses `@napi-rs/canvas` (Workers)

Both libraries have the same API for our use case, so no other code changes needed! ✅

## Test It

### Local Node.js:
```bash
npm start
curl "http://localhost:3000/vpd-chart?air_temp=24&rh=65&crop_type=cannabis&stage=veg"
```

### Local Workers:
```bash
npm run cf:dev
curl "http://localhost:8787/vpd-chart?air_temp=24&rh=65&crop_type=cannabis&stage=veg"
```

Both should now work! 🎉
