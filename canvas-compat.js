// Canvas compatibility layer for Node.js and Cloudflare Workers
// Automatically uses the right canvas implementation

let createCanvas, loadImage, PureImage;

// Detect if we're in Cloudflare Workers environment
const isCloudflareWorkers = typeof globalThis.caches !== 'undefined' && 
                            typeof globalThis.WebSocketPair !== 'undefined';

console.log('Environment check:', {
  hasCaches: typeof globalThis.caches !== 'undefined',
  hasWebSocketPair: typeof globalThis.WebSocketPair !== 'undefined',
  isCloudflareWorkers
});

// Font initialization promise for Workers
let fontInitPromise = null;

// Detect environment and load appropriate canvas library
if (isCloudflareWorkers) {
  console.log('=== Loading pureimage for Cloudflare Workers ===');
  
  // Use our shim that forces the Node.js version (not browser version)
  PureImage = require('./pureimage-node.js');
  const opentype = require('opentype.js');
  
  // Load embedded font data (base64 encoded)
  const fontBase64 = require('./fonts/roboto-font-data.js');
  
  console.log('=== Starting font registration ===');
  
  // Initialize font synchronously using opentype.js directly
  try {
    // Convert base64 to ArrayBuffer for opentype.js
    const fontBuffer = Buffer.from(fontBase64, 'base64');
    const arrayBuffer = fontBuffer.buffer.slice(
      fontBuffer.byteOffset,
      fontBuffer.byteOffset + fontBuffer.byteLength
    );
    
    // Parse the font with opentype.js
    const font = opentype.parse(arrayBuffer);
    const fontFamily = font.names.fontFamily.en || 'Roboto';
    
    console.log(`Registering font: ${fontFamily}`);
    
    // Register the PARSED font object with pureimage
    // Pureimage's registerFont creates a wrapper object
    const registeredFont = PureImage.registerFont(font, fontFamily, null, null, 'normal');
    
    // Manually set the loaded flags since we already parsed it
    // This bypasses pureimage's loadSync which expects a file path
    registeredFont.loaded = true;
    registeredFont.font = font;
    
    console.log(`Font loaded: ${fontFamily} (from Roboto-Regular.ttf)`);
    console.log('Registered fonts:', Object.keys(PureImage.debug_list_of_fonts));
    console.log('=== Font registration complete ===');
    fontInitPromise = Promise.resolve(registeredFont);
  } catch (error) {
    console.error('=== Font registration FAILED ===', error);
    // Continue without font - text will be missing but charts will still work
    fontInitPromise = Promise.resolve(null);
  }
  
  createCanvas = (width, height) => {
    // Debug: Check font registry state when creating canvas
    console.log('Creating canvas, fonts available:', Object.keys(PureImage.debug_list_of_fonts));
    
    // PureImage.make returns a bitmap with getContext() method
    const bitmap = PureImage.make(width, height);
    
    // Add toBuffer method for compatibility with node-canvas API
    bitmap.toBuffer = async function(mimeType) {
      try {
        // Use PassThrough stream to collect data
        const { PassThrough } = require('stream');
        const stream = new PassThrough();
        const chunks = [];
        
        stream.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        const bufferPromise = new Promise((resolve, reject) => {
          stream.on('end', () => {
            resolve(Buffer.concat(chunks));
          });
          stream.on('error', reject);
        });
        
        // Encode based on mime type and wait for completion
        if (mimeType === 'image/png' || !mimeType) {
          await PureImage.encodePNGToStream(this, stream);
        } else if (mimeType === 'image/jpeg') {
          await PureImage.encodeJPEGToStream(this, stream);
        } else {
          throw new Error(`Unsupported mime type: ${mimeType}`);
        }
        
        // The encode promise resolves when done, but stream may still have data
        // Wait a bit for stream to finish, then end it
        stream.end();
        
        return await bufferPromise;
      } catch (error) {
        console.error('Error in pureimage.toBuffer:', error);
        throw error;
      }
    };
    
    return bitmap;
  };
  
  loadImage = async (source) => {
    // For Workers, we'd need to fetch and decode images
    // For now, return a stub since we don't load external images
    throw new Error('loadImage not implemented in Workers environment');
  };
  
} else {
  // In standard Node.js - use regular canvas
  try {
    const nodeCanvas = require('canvas');
    createCanvas = nodeCanvas.createCanvas;
    loadImage = nodeCanvas.loadImage;
    console.log('Using canvas (Node.js)');
  } catch (e) {
    console.error('No canvas library found. Install canvas package');
    throw new Error('Canvas library not available');
  }
}

// Export PureImage for custom font registration in Workers environment
module.exports = { 
  createCanvas, 
  loadImage, 
  fontInitPromise,
  PureImage: isCloudflareWorkers ? PureImage : null
};
