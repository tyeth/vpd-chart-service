// Cloudflare Workers entry point
// Simple fetch handler that manually routes to Express-style handlers
import app from './server.js';

// Helper to convert Express app to Workers fetch handler
function expressToFetch(expressApp) {
  return async (request, env, ctx) => {
    const url = new URL(request.url);
    
    // Mock Express request and response objects
    return new Promise((resolve) => {
      const chunks = [];
      
      const req = {
        method: request.method,
        url: url.pathname + url.search,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        headers: Object.fromEntries(request.headers.entries()),
        get: function(header) {
          return this.headers[header.toLowerCase()];
        }
      };
      
      const res = {
        statusCode: 200,
        _headers: {},
        
        status(code) {
          this.statusCode = code;
          return this;
        },
        
        setHeader(name, value) {
          this._headers[name.toLowerCase()] = String(value);
          return this;
        },
        
        getHeader(name) {
          return this._headers[name.toLowerCase()];
        },
        
        json(data) {
          this.setHeader('Content-Type', 'application/json');
          const body = JSON.stringify(data);
          resolve(new Response(body, {
            status: this.statusCode,
            headers: this._headers
          }));
          return this;
        },
        
        send(data) {
          if (!this.getHeader('content-type')) {
            this.setHeader('Content-Type', 'text/html');
          }
          resolve(new Response(data, {
            status: this.statusCode,
            headers: this._headers
          }));
          return this;
        },
        
        end(data) {
          resolve(new Response(data || '', {
            status: this.statusCode,
            headers: this._headers
          }));
          return this;
        }
      };
      
      // Call Express app handler
      try {
        expressApp(req, res);
      } catch (error) {
        resolve(new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
    });
  };
}

export default {
  fetch: expressToFetch(app)
};
