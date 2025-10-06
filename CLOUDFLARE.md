# Deploying to Cloudflare Workers

This service can run **both** as a traditional Node.js server AND as a Cloudflare Worker with minimal changes!

## How It Works

The service uses Cloudflare's [`httpServerHandler`](https://blog.cloudflare.com/bringing-node-js-http-servers-to-cloudflare-workers/) to run the Express app directly on Cloudflare Workers with Node.js compatibility.

**Files:**
- `server.js` - The main Express app (works in Node.js)
- `worker.js` - Cloudflare Workers wrapper (imports server.js and wraps it with httpServerHandler)
- `wrangler.toml` - Cloudflare configuration

**Changes made:**
1. `server.js` exports the Express app: `module.exports = app;`
2. `worker.js` wraps it for Cloudflare: `export default httpServerHandler(app);`
3. `wrangler.toml` points to `worker.js` as the entry point

This keeps the Node.js server code clean and separate from the Workers-specific wrapper!

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Install Wrangler**:

```bash
npm install -g wrangler
# or use the local version
npm install
```

3. **Login to Cloudflare**:

```bash
wrangler login
```

## Local Development

### Run as Node.js server (traditional):
```bash
npm start
# or
npm run dev  # with auto-reload
```

### Run as Cloudflare Worker (local):
```bash
npm run cf:dev
# or
wrangler dev
```

The Worker version runs at `http://localhost:8787` by default.

## Deployment

### Deploy to Cloudflare Workers:

```bash
npm run deploy
# or
wrangler deploy
```

Your service will be available at:
```
https://vpd-chart-service.YOUR-SUBDOMAIN.workers.dev
```

### Deploy to Development Environment:

```bash
npm run deploy:dev
# or
wrangler deploy --env development
```

## API Usage

Once deployed, the API works exactly the same:

```bash
# Replace with your actual Workers URL
BASE_URL="https://vpd-chart-service.YOUR-SUBDOMAIN.workers.dev"

# Generate a VPD chart
curl "${BASE_URL}/vpd-chart?air_temp=24&rh=65&crop_type=cannabis&stage=veg"

# List available crops
curl "${BASE_URL}/crops"

# Health check
curl "${BASE_URL}/health"
```

## Monitoring

### View real-time logs:
```bash
npm run cf:tail
# or
wrangler tail
```

### View analytics:
Go to your Cloudflare dashboard → Workers & Pages → vpd-chart-service

## Environment-Specific Configuration

Edit `wrangler.toml` to add environment-specific settings:

```toml
[env.development]
name = "vpd-chart-service-dev"

[env.production]
name = "vpd-chart-service-prod"
```

Then deploy to specific environments:
```bash
wrangler deploy --env development
wrangler deploy --env production
```

## Custom Domain

To use a custom domain:

1. Add your domain to Cloudflare
2. Add a route in `wrangler.toml`:

```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

3. Deploy:
```bash
wrangler deploy
```

## Troubleshooting

### Canvas/Image Generation Issues

The `canvas` package works in Workers with Node.js compatibility enabled. If you encounter issues:

1. Ensure `nodejs_compat` is enabled in `wrangler.toml`
2. Check that you're using Wrangler v3.0.0 or later
3. Verify the compatibility_date is recent

### Module Not Found Errors

Make sure all dependencies are installed:
```bash
npm install
```

### Import/Export Issues

The service uses ES modules for the Cloudflare export while maintaining CommonJS compatibility. This is intentional and works in both environments.

## Benefits of Cloudflare Workers

- ⚡ **Global edge deployment** - 300+ locations worldwide
- 🚀 **Ultra-fast** - <50ms latency globally
- 💰 **Free tier** - 100,000 requests/day
- 📈 **Auto-scaling** - No server management
- 🔒 **DDoS protection** - Built-in security

## Limits

**Free tier:**
- 100,000 requests/day
- 10ms CPU time per request
- 128MB memory

**Paid tier ($5/month):**
- 10M requests included
- 50ms CPU time per request
- 128MB memory

## Keeping Both Versions

You can run both versions simultaneously:
- **Node.js server** for development/testing
- **Cloudflare Workers** for production

Both use the same `server.js` file!

## Learn More

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Node.js Compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)
- [HTTP Servers Blog Post](https://blog.cloudflare.com/bringing-node-js-http-servers-to-cloudflare-workers/)
