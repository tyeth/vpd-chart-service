# Canvas Compatibility Fix

## The Problem

Cloudflare Workers don't support the standard `canvas` npm package because it tries to use browser DOM APIs like `document`, which don't exist in the Workers runtime.

**Error:** `ReferenceError: document is not defined`

## The Solution

We've added a compatibility layer that automatically detects the environment and uses the appropriate canvas library:

- **Node.js** → Uses `canvas` (node-canvas)
- **Cloudflare Workers** → Uses `@napi-rs/canvas` (Workers-compatible)

## Files Changed

### 1. `canvas-compat.js` (NEW)
A smart wrapper that tries `@napi-rs/canvas` first (for Workers), then falls back to `canvas` (for Node.js).

### 2. `server.js`
Changed from:
```javascript
const { createCanvas } = require('canvas');
```

To:
```javascript
const { createCanvas } = require('./canvas-compat');
```

### 3. `package.json`
Added `@napi-rs/canvas` as a dependency:
```json
"dependencies": {
  "@napi-rs/canvas": "^0.1.58",
  "canvas": "latest",
  ...
}
```

## Installation

Install both canvas packages:

```bash
npm install
```

This installs both:
- `canvas` - for Node.js (`npm start`)
- `@napi-rs/canvas` - for Cloudflare Workers (`npm run cf:dev`, `npm run deploy`)

## How It Works

The compatibility layer detects which environment it's running in:

1. **First tries** `@napi-rs/canvas` (Workers-compatible)
2. **Falls back to** `canvas` if @napi-rs/canvas not found
3. **Exports** the same API regardless of which one is used

This means:
- ✅ Works in Node.js with `npm start`
- ✅ Works in Workers with `wrangler dev`
- ✅ Works when deployed to Cloudflare
- ✅ No code changes needed anywhere else!

## Testing

### Test Node.js:
```bash
npm start
# Should use 'canvas' library
```

### Test Cloudflare Workers (local):
```bash
npm run cf:dev
# Should use '@napi-rs/canvas' library
```

### Test Cloudflare Workers (deployed):
```bash
npm run deploy
# Uses '@napi-rs/canvas' library
```

## API Compatibility

Both canvas libraries support the same API for our use case:
- `createCanvas(width, height)`
- `canvas.getContext('2d')`
- All Canvas 2D drawing operations
- `canvas.toBuffer('image/png')`

## Why Two Libraries?

- **`canvas`** (node-canvas) - Full-featured, works great in Node.js, but has native dependencies and DOM assumptions
- **`@napi-rs/canvas`** - Lighter weight, specifically designed for edge runtimes like Cloudflare Workers

Having both ensures maximum compatibility! ✨
