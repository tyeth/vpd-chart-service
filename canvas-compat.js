// Canvas compatibility layer for Node.js and Cloudflare Workers
// Automatically uses the right canvas implementation

let createCanvas, loadImage;

// Detect environment and load appropriate canvas library
try {
  // Try Workers-compatible canvas first
  const napiCanvas = require('@napi-rs/canvas');
  createCanvas = napiCanvas.createCanvas;
  loadImage = napiCanvas.loadImage;
  console.log('Using @napi-rs/canvas (Workers-compatible)');
} catch (e) {
  // Fall back to standard node-canvas
  try {
    const nodeCanvas = require('canvas');
    createCanvas = nodeCanvas.createCanvas;
    loadImage = nodeCanvas.loadImage;
    console.log('Using canvas (Node.js)');
  } catch (e2) {
    console.error('No canvas library found. Install either canvas or @napi-rs/canvas');
    throw new Error('Canvas library not available');
  }
}

module.exports = { createCanvas, loadImage };
