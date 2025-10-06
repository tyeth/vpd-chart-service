# Custom Font Support

The VPD Chart Service now supports loading custom fonts from web URLs (CDNs).

## Usage

Add these query parameters to your VPD chart request:

- `font_url` - URL to a TTF font file (required)
- `font_name` - Optional font family name override (default: extracted from font file)

## Examples

### Google Fonts

```bash
# Using Montserrat font
curl "http://localhost:8787/vpd-chart?air_temp=25&rh=60&font_url=https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Regular.ttf" -o chart.png

# Using Open Sans
curl "http://localhost:8787/vpd-chart?air_temp=25&rh=60&font_url=https://github.com/googlefonts/opensans/raw/main/fonts/ttf/OpenSans-Regular.ttf" -o chart.png

# Using Lato
curl "http://localhost:8787/vpd-chart?air_temp=25&rh=60&font_url=https://github.com/latofonts/lato-source/raw/master/fonts/lato-regular/Lato-Regular.ttf&font_name=Lato" -o chart.png
```

# Arial
https://github.com/kavin808/arial.ttf/raw/refs/heads/master/arial.ttf

### Direct CDN URLs

```bash
# jsdelivr CDN (example)
curl "http://localhost:8787/vpd-chart?air_temp=25&rh=60&font_url=https://cdn.jsdelivr.net/npm/@fontsource/roboto-mono@5.0.0/files/roboto-mono-latin-400-normal.woff2" -o chart.png
```

## Font Caching

- Fonts are cached in memory after first load
- Same font URL will be reused without re-downloading
- Cache persists for the lifetime of the worker/server process

## Supported Formats

- **TTF** (TrueType Font) - ✅ Fully supported
- **OTF** (OpenType Font) - ✅ Should work (uses OpenType.js)
- **WOFF/WOFF2** - ❌ Not supported (browser formats, not compatible with OpenType.js)

## Error Handling

If font loading fails:
- Returns 400 error with details
- Check that URL is accessible
- Ensure font is in TTF/OTF format
- Verify CORS headers allow access (if applicable)

## Performance Notes

- First request with a new font will be slower (download + parse time)
- Subsequent requests use cached font
- Consider using a CDN URL for better reliability
- Larger fonts (300KB+) may take longer to load

## Cloudflare Workers Limitations

When deploying to Cloudflare Workers:
- Font must be publicly accessible (no authentication)
- Font download counts toward CPU time limits
- Consider embedding commonly-used fonts instead of loading from URLs

## Default Font

If no `font_url` is provided, the service uses the embedded Roboto font.
