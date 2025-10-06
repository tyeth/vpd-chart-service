/**
 * Font loading utility for pureimage
 * Supports loading fonts from URLs and caching them
 */

const opentype = require('opentype.js');

// In-memory font cache
const fontCache = new Map();

/**
 * Load a font from a URL
 * @param {string} url - URL to the TTF font file
 * @param {string} [familyName] - Optional family name override
 * @returns {Promise<Object>} Parsed font object
 */
async function loadFontFromURL(url, familyName = null) {
  // Check cache first
  const cacheKey = `${url}:${familyName || 'default'}`;
  if (fontCache.has(cacheKey)) {
    console.log(`Font cache HIT: ${url}`);
    return fontCache.get(cacheKey);
  }

  console.log(`Loading font from URL: ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const font = opentype.parse(arrayBuffer);
    
    // Use provided family name or extract from font
    const fontFamily = familyName || font.names.fontFamily.en || 'CustomFont';
    
    const fontData = {
      font: font,
      family: fontFamily,
      url: url
    };

    // Cache it
    fontCache.set(cacheKey, fontData);
    console.log(`Font loaded and cached: ${fontFamily} from ${url}`);
    
    return fontData;
  } catch (error) {
    console.error(`Error loading font from ${url}:`, error);
    throw error;
  }
}

/**
 * Register a font with pureimage
 * @param {Object} PureImage - The pureimage module
 * @param {Object} fontData - Font data from loadFontFromURL
 * @returns {Object} Registered font object
 */
function registerFontWithPureImage(PureImage, fontData) {
  const { font, family } = fontData;
  
  console.log(`Registering font with pureimage: ${family}`);
  
  // Register the parsed font object
  const registeredFont = PureImage.registerFont(font, family, null, null, 'normal');
  
  // Manually set loaded flags (pureimage's loadSync expects file paths)
  registeredFont.loaded = true;
  registeredFont.font = font;
  
  return registeredFont;
}

/**
 * Clear the font cache
 */
function clearFontCache() {
  fontCache.clear();
  console.log('Font cache cleared');
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    size: fontCache.size,
    entries: Array.from(fontCache.keys())
  };
}

module.exports = {
  loadFontFromURL,
  registerFontWithPureImage,
  clearFontCache,
  getCacheStats
};
