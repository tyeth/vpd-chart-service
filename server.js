const express = require('express');
const { createCanvas, fontInitPromise } = require('./canvas-compat');
const { loadFontFromURL, registerFontWithPureImage } = require('./font-loader');
const axios = require('axios');

const app = express();
app.use(express.json());

// Handle favicon requests to avoid 404 errors
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Crop-specific VPD configurations (in kPa)
// Easy to extend with new crops and their specific requirements
const CROP_CONFIGS = {
  general: {
    name: 'General',
    stages: {
      seedling: { min: 0.4, max: 0.8, color: '#4CAF50', label: 'Seedling' },
      veg: { min: 0.8, max: 1.2, color: '#2196F3', label: 'Vegetative' },
      flower: { min: 1.0, max: 1.5, color: '#FF9800', label: 'Flowering' },
      'sick-dry': { min: 0.9, max: 1.3, color: '#FF5722', label: 'Recovery (Dry Stress)' },
      'sick-wet': { min: 1.2, max: 1.6, color: '#9C27B0', label: 'Recovery (Wet Stress)' },
      'sick-pest': { min: 0.8, max: 1.2, color: '#795548', label: 'Recovery (Pest)' },
      'sick-chemical': { min: 0.6, max: 1.0, color: '#607D8B', label: 'Recovery (Chemical)' },
      'sick-unknown': { min: 0.7, max: 1.1, color: '#9E9E9E', label: 'Recovery (Unknown)' }
    }
  },
  cannabis: {
    name: 'Cannabis',
    stages: {
      seedling: { min: 0.4, max: 0.8, color: '#4CAF50', label: 'Seedling' },
      veg: { min: 0.8, max: 1.2, color: '#2196F3', label: 'Vegetative' },
      flower: { min: 1.2, max: 1.6, color: '#FF9800', label: 'Flowering' },
      'sick-dry': { min: 1.0, max: 1.4, color: '#FF5722', label: 'Recovery (Dry)' },
      'sick-wet': { min: 1.3, max: 1.7, color: '#9C27B0', label: 'Recovery (Wet)' },
      'sick-pest': { min: 0.9, max: 1.3, color: '#795548', label: 'Recovery (Pest)' },
      'sick-chemical': { min: 0.7, max: 1.1, color: '#607D8B', label: 'Recovery (Chem)' },
      'sick-unknown': { min: 0.8, max: 1.2, color: '#9E9E9E', label: 'Recovery' }
    }
  },
  tomato: {
    name: 'Tomato',
    stages: {
      seedling: { min: 0.4, max: 0.7, color: '#4CAF50', label: 'Seedling' },
      veg: { min: 0.7, max: 1.1, color: '#2196F3', label: 'Vegetative' },
      flower: { min: 0.9, max: 1.3, color: '#FF9800', label: 'Flowering/Fruiting' },
      'sick-dry': { min: 0.9, max: 1.3, color: '#FF5722', label: 'Recovery (Dry)' },
      'sick-wet': { min: 1.1, max: 1.5, color: '#9C27B0', label: 'Recovery (Wet)' },
      'sick-pest': { min: 0.8, max: 1.2, color: '#795548', label: 'Recovery (Pest)' },
      'sick-chemical': { min: 0.6, max: 1.0, color: '#607D8B', label: 'Recovery (Chem)' },
      'sick-unknown': { min: 0.7, max: 1.1, color: '#9E9E9E', label: 'Recovery' }
    }
  },
  lettuce: {
    name: 'Lettuce',
    stages: {
      seedling: { min: 0.4, max: 0.7, color: '#4CAF50', label: 'Seedling' },
      veg: { min: 0.6, max: 1.0, color: '#2196F3', label: 'Vegetative' },
      flower: { min: 0.7, max: 1.1, color: '#FF9800', label: 'Bolting' },
      'sick-dry': { min: 0.8, max: 1.2, color: '#FF5722', label: 'Recovery (Dry)' },
      'sick-wet': { min: 1.0, max: 1.4, color: '#9C27B0', label: 'Recovery (Wet)' },
      'sick-pest': { min: 0.7, max: 1.1, color: '#795548', label: 'Recovery (Pest)' },
      'sick-chemical': { min: 0.5, max: 0.9, color: '#607D8B', label: 'Recovery (Chem)' },
      'sick-unknown': { min: 0.6, max: 1.0, color: '#9E9E9E', label: 'Recovery' }
    }
  },
  orchid: {
    name: 'Orchid',
    stages: {
      seedling: { min: 0.3, max: 0.6, color: '#4CAF50', label: 'Seedling' },
      veg: { min: 0.5, max: 0.9, color: '#2196F3', label: 'Vegetative' },
      flower: { min: 0.7, max: 1.1, color: '#FF9800', label: 'Flowering' },
      'sick-dry': { min: 0.7, max: 1.1, color: '#FF5722', label: 'Recovery (Dry)' },
      'sick-wet': { min: 0.9, max: 1.3, color: '#9C27B0', label: 'Recovery (Wet)' },
      'sick-pest': { min: 0.6, max: 1.0, color: '#795548', label: 'Recovery (Pest)' },
      'sick-chemical': { min: 0.5, max: 0.9, color: '#607D8B', label: 'Recovery (Chem)' },
      'sick-unknown': { min: 0.5, max: 0.9, color: '#9E9E9E', label: 'Recovery' }
    }
  }
};

// Helper to get crop config
function getCropConfig(cropType) {
  const key = cropType.toLowerCase().replace(/\s+/g, '');
  return CROP_CONFIGS[key] || CROP_CONFIGS.general;
}

// Post to Adafruit IO raw webhook
async function postToRawWebhook(webhookUrl, base64Image) {
  try {
    const response = await axios.post(webhookUrl, base64Image, {
      /* Don't send value: json, instead do raw body to avoid string values */
      // headers: {
      //   'Content-Type': 'application/json'
      // },
      timeout: 10000
    });
    return { success: true, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status 
    };
  }
}

// Post to Adafruit IO feed with API key
async function postToFeed(feedUrl, aioKey, base64Image) {
  try {
    // Parse feed URL to get username and feed key
    // Format: https://io.adafruit.com/{username}/feeds/{feed_key}
    const urlMatch = feedUrl.match(/io\.adafruit\.com\/([^\/]+)\/feeds\/([^\/\?]+)/);
    if (!urlMatch) {
      return { success: false, error: 'Invalid feed URL format' };
    }
    
    const username = urlMatch[1];
    const feedKey = urlMatch[2];
    
    // Construct API endpoint
    const apiUrl = `https://io.adafruit.com/api/v2/${username}/feeds/${feedKey}/data`;
    
    const response = await axios.post(apiUrl, {
      value: base64Image
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-AIO-Key': aioKey
      },
      timeout: 10000
    });
    
    return { success: true, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status 
    };
  }
}

// Calculate VPD from temperatures
function calculateVPD(airTemp, leafTemp) {
  // Saturation vapor pressure (SVP) using simplified formula
  const svpAir = 0.6108 * Math.exp((17.27 * airTemp) / (airTemp + 237.3));
  const svpLeaf = 0.6108 * Math.exp((17.27 * leafTemp) / (leafTemp + 237.3));
  
  // VPD = SVP at air temp - SVP at leaf temp
  return svpAir - svpLeaf;
}

// Calculate VPD for a given air temperature and relative humidity
function calculateVPDFromRH(airTemp, rh) {
  // Saturation vapor pressure at air temp (in kPa)
  const svpAir = 0.6108 * Math.exp((17.27 * airTemp) / (airTemp + 237.3));
  // Actual vapor pressure
  const avp = svpAir * (rh / 100);
  // VPD = SVP - AVP
  return svpAir - avp;
}

// Calculate RH needed for a target VPD at a given air temperature
function calculateRHForVPD(airTemp, targetVPD) {
  const svpAir = 0.6108 * Math.exp((17.27 * airTemp) / (airTemp + 237.3));
  const avp = svpAir - targetVPD;
  const rh = (avp / svpAir) * 100;
  return Math.max(0, Math.min(100, rh)); // Clamp between 0-100%
}

// Find temperature that produces a target VPD at given RH using binary search
function findTempForVPD(targetVPD, rh, tempMin, tempMax, tolerance = 0.001, maxIterations = 20) {
  let low = tempMin;
  let high = tempMax;
  let temp = (low + high) / 2;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const currentVPD = calculateVPDFromRH(temp, rh);
    if (Math.abs(currentVPD - targetVPD) < tolerance) break;
    if (currentVPD < targetVPD) {
      low = temp;
    } else {
      high = temp;
    }
    temp = (low + high) / 2;
  }
  
  return temp;
}

// Generate VPD chart
async function generateVPDChart(vpd, airTemp, leafTemp, cropType, stage, fontFamily = 'Roboto') {
  const width = 600;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  
  // Chart area
  const margin = { top: 40, right: 30, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // RH range: 0-100%
  const rhMin = 0;
  const rhMax = 100;
  // Temperature range: 15-35°C
  const tempMin = 15;
  const tempMax = 35;
  
  // Helper functions (swapped axes: x=RH, y=temp)
  const rhToX = (rh) => margin.left + ((rh - rhMin) / (rhMax - rhMin)) * chartWidth;
  const tempToY = (temp) => margin.top + chartHeight - ((temp - tempMin) / (tempMax - tempMin)) * chartHeight;
  
  // Get crop configuration
  const cropConfig = getCropConfig(cropType);
  
  // Determine which stages to display
  let stagesToShow = [];
  const normalGrowthStages = ['seedling', 'veg', 'flower'];
  const sickStages = ['sick-dry', 'sick-wet', 'sick-pest', 'sick-chemical', 'sick-unknown'];
  
  if (stage) {
    // If a specific stage is provided, show ONLY that stage
    // (whether it's a normal growth stage OR a sick/recovery stage)
    stagesToShow.push(stage);
  } else {
    // If no stage specified, show normal growth stages only
    normalGrowthStages.forEach(ngs => {
      if (cropConfig.stages[ngs]) stagesToShow.push(ngs);
    });
  }
  
  // Draw VPD zones - with curves based on temperature lines across RH values
  const rhSteps = 100; // Number of points to plot smooth curves
  
  stagesToShow.forEach(stageKey => {
    const range = cropConfig.stages[stageKey];
    if (!range) return; // Skip if stage doesn't exist for this crop
    
    const isCurrentStage = stageKey === stage;
    
    // For each VPD zone, we need to find the temperature curves at different RH values
    // that correspond to the min and max VPD of the range
    
    // Create path for the zone boundary
    ctx.save();
    ctx.beginPath();
    
    // Draw top boundary (max VPD curve)
    let firstPoint = true;
    for (let i = 0; i <= rhSteps; i++) {
      const rh = rhMin + (i / rhSteps) * (rhMax - rhMin);
      const temp = findTempForVPD(range.max, rh, tempMin, tempMax);
      
      const x = rhToX(rh);
      const y = tempToY(temp);
      
      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // Draw bottom boundary (min VPD curve) in reverse
    for (let i = rhSteps; i >= 0; i--) {
      const rh = rhMin + (i / rhSteps) * (rhMax - rhMin);
      const temp = findTempForVPD(range.min, rh, tempMin, tempMax);
      
      const x = rhToX(rh);
      const y = tempToY(temp);
      ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    
    // Fill the zone
    // If a specific stage is selected, show it prominently; otherwise medium opacity
    const opacity = isCurrentStage ? '99' : '55';
    ctx.fillStyle = range.color + opacity;
    ctx.fill();
    ctx.restore();
    
    // Zone label
    ctx.fillStyle = range.color;
    ctx.font = isCurrentStage ? `12px ${fontFamily}` : `11px ${fontFamily}`;
    // Calculate label position at middle RH
    const midRH = (rhMin + rhMax) / 2;
    const midVPD = (range.min + range.max) / 2;
    
    // Find temperature at midRH for midVPD
    const labelTemp = findTempForVPD(midVPD, midRH, tempMin, tempMax);
    
    const labelY = tempToY(labelTemp);
    ctx.textAlign = 'right';
    ctx.fillText(range.label, width - margin.right - 5, labelY + 4);
  });
  
  // Draw grid lines
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;
  
  // Horizontal grid (Temperature)
  for (let temp = tempMin; temp <= tempMax; temp += 5) {
    ctx.beginPath();
    ctx.moveTo(margin.left, tempToY(temp));
    ctx.lineTo(width - margin.right, tempToY(temp));
    ctx.stroke();
  }
  
  // Vertical grid (RH)
  for (let rh = 0; rh <= 100; rh += 10) {
    ctx.beginPath();
    ctx.moveTo(rhToX(rh), margin.top);
    ctx.lineTo(rhToX(rh), height - margin.bottom);
    ctx.stroke();
  }
  
  // Draw axes
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, height - margin.bottom);
  ctx.lineTo(width - margin.right, height - margin.bottom);
  ctx.stroke();
  
  // Y-axis labels (Temperature)
  ctx.fillStyle = '#000000';
  ctx.font = `12px ${fontFamily}`;
  ctx.textAlign = 'right';
  for (let temp = tempMin; temp <= tempMax; temp += 5) {
    ctx.fillText(temp + '°C', margin.left - 10, tempToY(temp) + 4);
  }
  
  // X-axis labels (RH)
  ctx.textAlign = 'center';
  for (let rh = 0; rh <= 100; rh += 10) {
    ctx.fillText(rh + '%', rhToX(rh), height - margin.bottom + 20);
  }
  
  // Axis titles
  ctx.save();
  ctx.translate(20, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `14px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText('Air Temperature (°C)', 0, 0);
  ctx.restore();
  
  ctx.font = `14px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText('Relative Humidity (%)', width / 2, height - 10);
  
  // Chart title
  ctx.font = `16px ${fontFamily}`;
  const title = stage ? 
    `VPD Chart - ${cropConfig.name} (${cropConfig.stages[stage]?.label || stage})` :
    `VPD Chart - ${cropConfig.name}`;
  ctx.fillText(title, width / 2, 25);
  
  // Plot current position
  // We need RH to plot the position - calculate it from VPD and airTemp if not provided
  let currentRH = null;
  if (vpd !== null && airTemp !== null) {
    currentRH = calculateRHForVPD(airTemp, vpd);
  }
  
  if (currentRH !== null && currentRH >= rhMin && currentRH <= rhMax && 
      airTemp >= tempMin && airTemp <= tempMax) {
    const x = rhToX(currentRH);
    const y = tempToY(airTemp);
    
    // Outer circle
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Inner circle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Current values label
    ctx.fillStyle = '#000000';
    ctx.font = `12px ${fontFamily}`;
    ctx.textAlign = 'left';
    // Show leaf temp if different from air temp
    const tempInfo = leafTemp !== null ? 
      `${airTemp.toFixed(1)}°C / ${leafTemp.toFixed(1)}°C` : 
      `${airTemp.toFixed(1)}°C`;
    ctx.fillText(
      `Current: ${vpd.toFixed(2)} kPa @ ${tempInfo}, ${currentRH.toFixed(1)}% RH`,
      margin.left + 10,
      margin.top + 15
    );
  }
  
  // Convert to optimized PNG buffer
  // Handle both sync (node-canvas) and async (OffscreenCanvas) APIs
  const toBufferResult = canvas.toBuffer('image/png');
  return toBufferResult instanceof Promise ? await toBufferResult : toBufferResult;
}

// Main endpoint
app.get('/vpd-chart', async (req, res) => {
  try {
    // Wait for font to load if in Workers environment
    if (fontInitPromise) {
      await fontInitPromise;
    }
    
    // Parse query parameters first
    const airTemp = parseFloat(req.query.air_temp);
    const rh = req.query.rh ? parseFloat(req.query.rh) : null;
    const leafTemp = req.query.leaf_temp ? parseFloat(req.query.leaf_temp) : null;
    const vpdInput = req.query.vpd ? parseFloat(req.query.vpd) : null;
    const cropType = req.query.crop_type || 'general';
    const stage = req.query.stage || null;
    const fontUrl = req.query.font_url || null;
    const fontName = req.query.font_name || null;
    
    // Load custom font if URL provided
    let customFontFamily = null;
    if (fontUrl) {
      try {
        const { loadFontFromURL: loadFont, registerFontWithPureImage: registerFont } = require('./font-loader');
        const PureImage = require('./canvas-compat').PureImage;
        
        const fontData = await loadFont(fontUrl, fontName);
        if (PureImage) {
          registerFont(PureImage, fontData);
        }
        customFontFamily = fontData.family;
        console.log(`Custom font loaded: ${customFontFamily}`);
      } catch (fontError) {
        console.error('Error loading custom font:', fontError);
        return res.status(400).json({ 
          error: 'Failed to load custom font', 
          details: fontError.message 
        });
      }
    }
    
    // Callback options
    const callbackUrl = req.query.callback_url;
    const feedUrl = req.query.feed_url;
    const aioKey = req.query.aio_key;
    
    // Validate inputs
    if (isNaN(airTemp)) {
      return res.status(400).json({ error: 'air_temp is required and must be a number' });
    }
    
    // Validate crop type
    const cropConfig = getCropConfig(cropType);
    
    // Validate stage if provided
    if (stage && !cropConfig.stages[stage]) {
      return res.status(400).json({ 
        error: `Invalid stage '${stage}' for crop '${cropType}'`,
        available_stages: Object.keys(cropConfig.stages)
      });
    }
    
    // Validate callback options
    if (feedUrl && !aioKey) {
      return res.status(400).json({ error: 'aio_key is required when feed_url is provided' });
    }
    if (aioKey && !feedUrl) {
      return res.status(400).json({ error: 'feed_url is required when aio_key is provided' });
    }
    if (callbackUrl && (feedUrl || aioKey)) {
      return res.status(400).json({ error: 'Cannot use both callback_url and feed_url/aio_key methods' });
    }
    
    // Calculate VPD based on available inputs
    let vpd;
    let actualLeafTemp;
    let actualRH;
    
    if (vpdInput !== null) {
      // VPD explicitly provided - use it directly
      vpd = vpdInput;
      actualLeafTemp = leafTemp !== null ? leafTemp : null;
      actualRH = rh !== null ? rh : null;
    } else if (rh !== null && leafTemp !== null) {
      // Both RH and leaf temp provided - use RH for VPD calculation (more accurate)
      vpd = calculateVPDFromRH(airTemp, rh);
      actualRH = rh;
      actualLeafTemp = leafTemp;
    } else if (rh !== null) {
      // Only RH provided - calculate VPD from air temp and RH
      vpd = calculateVPDFromRH(airTemp, rh);
      actualRH = rh;
      actualLeafTemp = null;
    } else if (leafTemp !== null) {
      // Only leaf temp provided - calculate VPD from temperature difference
      vpd = calculateVPD(airTemp, leafTemp);
      actualLeafTemp = leafTemp;
      actualRH = null;
    } else {
      // Neither provided - default: assume leaf temp 2°C below air temp
      actualLeafTemp = airTemp - 2;
      vpd = calculateVPD(airTemp, actualLeafTemp);
      actualRH = null;
    }
    
    // Generate chart with custom font if provided
    const pngBuffer = await generateVPDChart(
      vpd, 
      airTemp, 
      actualLeafTemp, 
      cropType, 
      stage,
      customFontFamily || 'Roboto'
    );
    const base64Image = pngBuffer.toString('base64');
    
    // Determine if VPD is in optimal range
    let status = 'unknown';
    if (stage && cropConfig.stages[stage]) {
      const range = cropConfig.stages[stage];
      if (vpd >= range.min && vpd <= range.max) {
        status = 'optimal';
      } else if (vpd < range.min) {
        status = 'too_low';
      } else {
        status = 'too_high';
      }
    }
    
    const responseData = {
      vpd: vpd.toFixed(3),
      air_temp: airTemp,
      crop_type: cropConfig.name,
      stage: stage,
      status: status,
      image: base64Image,
      image_format: 'png'
    };
    
    // Add RH or leaf_temp to response as appropriate
    if (actualRH !== null) {
      responseData.rh = actualRH;
    }
    if (actualLeafTemp !== null) {
      responseData.leaf_temp = actualLeafTemp;
    }
    
    // Handle callbacks
    if (callbackUrl) {
      // Raw webhook method
      const result = await postToRawWebhook(callbackUrl, base64Image);
      responseData.callback = {
        method: 'raw_webhook',
        url: callbackUrl,
        ...result
      };
      return res.json(responseData);
    } else if (feedUrl && aioKey) {
      // Feed + API key method
      const result = await postToFeed(feedUrl, aioKey, base64Image);
      responseData.callback = {
        method: 'feed_api',
        feed_url: feedUrl,
        ...result
      };
      return res.json(responseData);
    }
    
    // No callback - just return the data
    res.json(responseData);
    
  } catch (error) {
    console.error('Error generating VPD chart:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// POST endpoint - same functionality as GET, accepts query string parameters
app.post('/vpd-chart', async (req, res) => {
  try {
    // Wait for font to load if in Workers environment
    if (fontInitPromise) {
      await fontInitPromise;
    }
    
    // Parse query parameters first (same as GET)
    const airTemp = parseFloat(req.query.air_temp);
    const rh = req.query.rh ? parseFloat(req.query.rh) : null;
    const leafTemp = req.query.leaf_temp ? parseFloat(req.query.leaf_temp) : null;
    const vpdInput = req.query.vpd ? parseFloat(req.query.vpd) : null;
    const cropType = req.query.crop_type || 'general';
    const stage = req.query.stage || null;
    const fontUrl = req.query.font_url || null;
    const fontName = req.query.font_name || null;
    
    // Load custom font if URL provided
    let customFontFamily = null;
    if (fontUrl) {
      try {
        const { loadFontFromURL: loadFont, registerFontWithPureImage: registerFont } = require('./font-loader');
        const PureImage = require('./canvas-compat').PureImage;
        
        const fontData = await loadFont(fontUrl, fontName);
        if (PureImage) {
          registerFont(PureImage, fontData);
        }
        customFontFamily = fontData.family;
        console.log(`Custom font loaded: ${customFontFamily}`);
      } catch (fontError) {
        console.error('Error loading custom font:', fontError);
        return res.status(400).json({ 
          error: 'Failed to load custom font', 
          details: fontError.message 
        });
      }
    }
    
    // Callback options
    const callbackUrl = req.query.callback_url;
    const feedUrl = req.query.feed_url;
    const aioKey = req.query.aio_key;
    
    // Validate inputs
    if (isNaN(airTemp)) {
      return res.status(400).json({ error: 'air_temp is required and must be a number' });
    }
    
    // Validate crop type
    const cropConfig = getCropConfig(cropType);
    
    // Validate stage if provided
    if (stage && !cropConfig.stages[stage]) {
      return res.status(400).json({ 
        error: `Invalid stage '${stage}' for crop '${cropType}'`,
        available_stages: Object.keys(cropConfig.stages)
      });
    }
    
    // Validate callback options
    if (feedUrl && !aioKey) {
      return res.status(400).json({ error: 'aio_key is required when feed_url is provided' });
    }
    if (aioKey && !feedUrl) {
      return res.status(400).json({ error: 'feed_url is required when aio_key is provided' });
    }
    if (callbackUrl && (feedUrl || aioKey)) {
      return res.status(400).json({ error: 'Cannot use both callback_url and feed_url/aio_key methods' });
    }
    
    // Calculate VPD based on available inputs
    let vpd;
    let actualLeafTemp;
    let actualRH;
    
    if (vpdInput !== null) {
      vpd = vpdInput;
      actualLeafTemp = leafTemp !== null ? leafTemp : null;
      actualRH = rh !== null ? rh : null;
    } else if (rh !== null && leafTemp !== null) {
      vpd = calculateVPDFromRH(airTemp, rh);
      actualRH = rh;
      actualLeafTemp = leafTemp;
    } else if (rh !== null) {
      vpd = calculateVPDFromRH(airTemp, rh);
      actualRH = rh;
      actualLeafTemp = null;
    } else if (leafTemp !== null) {
      vpd = calculateVPD(airTemp, leafTemp);
      actualLeafTemp = leafTemp;
      actualRH = null;
    } else {
      return res.status(400).json({ 
        error: 'Must provide either: rh, leaf_temp, or vpd parameter' 
      });
    }
    
    // Generate chart with custom font if provided
    const pngBuffer = await generateVPDChart(
      vpd, 
      airTemp, 
      actualLeafTemp, 
      cropType, 
      stage,
      customFontFamily || 'Roboto'
    );
    const base64Image = pngBuffer.toString('base64');
    
    // Determine status
    let status = 'unknown';
    if (stage && cropConfig.stages[stage]) {
      const range = cropConfig.stages[stage];
      if (vpd >= range.min && vpd <= range.max) {
        status = 'optimal';
      } else if (vpd < range.min) {
        status = 'too_low';
      } else {
        status = 'too_high';
      }
    }
    
    const response = {
      vpd: parseFloat(vpd.toFixed(2)),
      air_temp: airTemp,
      leaf_temp: actualLeafTemp,
      rh: actualRH,
      crop_type: cropType,
      stage: stage,
      status: status,
      image: `data:image/png;base64,${base64Image}`,
      timestamp: new Date().toISOString()
    };
    
    // Handle callbacks if provided
    if (callbackUrl || feedUrl) {
      try {
        if (callbackUrl) {
          await axios.post(callbackUrl, base64Image);
        } else if (feedUrl && aioKey) {
          await axios.post(feedUrl, 
            { value: base64Image },
            { headers: { 'X-AIO-Key': aioKey } }
          );
        }
        //TODO: drop image from response if using callbacks
        // response.image = len(response.image); // avoid unnecessary data
      } catch (callbackError) {
        console.error('Callback error:', callbackError.message);
        response.callback_error = callbackError.message;
      }
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Error generating VPD chart (POST):', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// List available crops and stages
app.get('/crops', (req, res) => {
  const crops = {};
  Object.keys(CROP_CONFIGS).forEach(key => {
    crops[key] = {
      name: CROP_CONFIGS[key].name,
      stages: Object.keys(CROP_CONFIGS[key].stages)
    };
  });
  res.json(crops);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

// Only start the server if this file is run directly (not imported as a module)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`VPD Chart Service running on port ${PORT}`);
    console.log(`\nExamples:`);
    console.log(`  Basic: http://localhost:${PORT}/vpd-chart?air_temp=24&crop_type=tomato&stage=flower`);
    console.log(`  With raw webhook: ...&callback_url=https://io.adafruit.com/api/v2/webhooks/feed/YOUR_WEBHOOK_ID/raw`);
    console.log(`  With feed + key: ...&feed_url=https://io.adafruit.com/USERNAME/feeds/FEED&aio_key=YOUR_KEY`);
    console.log(`\n  List crops: http://localhost:${PORT}/crops`);
  });
}

// Export the app for Cloudflare Workers wrapper
module.exports = app;
