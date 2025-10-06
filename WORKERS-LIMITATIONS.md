# Cloudflare Workers Limitations

## Canvas Library Issue

**Problem**: Cloudflare Workers cannot run native Node.js modules like `canvas` or `@napi-rs/canvas` because:
- Both require native `.node` binary files (Cairo, Skia)
- esbuild cannot bundle native binary files
- Workers runtime doesn't support native Node.js addons
- `nodejs_compat` flag only provides JavaScript polyfills, not native module support

## Solutions

### Option 1: Hybrid Architecture (Recommended)
Keep chart generation on a Node.js server, deploy other endpoints to Workers:
- **Workers**: Serve `/crops`, `/health`, and other JSON endpoints
- **Node.js Server**: Handle `/vpd-chart` generation with canvas library
- **Routing**: Use Workers to proxy chart requests to Node.js origin server

### Option 2: Client-Side Chart Generation
Generate charts in the browser using pure JavaScript:
- Return VPD calculation data from Workers API
- Use Chart.js, D3.js, or HTML5 Canvas in browser to render
- No server-side image generation needed

### Option 3: External Chart Service
Use a third-party service for chart generation:
- QuickChart.io
- Cloudflare Images API
- External microservice for PNG generation

### Option 4: Node.js Only Deployment
Skip Workers entirely and deploy to:
- Traditional Node.js hosting (Heroku, Render, Railway)
- Cloudflare Pages Functions (supports limited Node.js)
- AWS Lambda / Google Cloud Functions

## Current Implementation Status

The codebase is set up for **Option 1 (Hybrid)**:
- `server.js` - Full Express app with canvas (runs on Node.js)
- `worker.js` - Workers wrapper using httpServerHandler
- Local development: Use `npm start` for full functionality
- Workers deployment: Currently blocked by canvas dependency

## Recommendation

For your use case, **keep it as a Node.js-only service** since:
1. Chart generation is a core feature, not optional
2. Setting up a hybrid architecture adds complexity
3. Node.js hosting is cheap and widely available
4. You can still use Cloudflare in front as a CDN/proxy

If you want Workers deployment, you'll need to implement Option 2 (client-side rendering).
