const { AppError } = require('./error');
const { convertSVGToPNG } = require('./helper');
const { generateRunwareImage } = require('../services/getAIDeckContentService');


/**
 * Searches iconify API for icons with fallback support
 * @param {string} keyword - Icon keyword(s) to search for (can be comma-separated: "clock-fast,timer,clock")
 * @returns {Promise<{found: boolean, iconData: object|null, usedKeyword?: string}>}
 */
const searchIconifyIcons = async (keyword) => {
  const ICONIFY_API = 'https://api.iconify.design';
  
  // Preferred icon sets (priority order)
  const preferredSets = ['lucide', 'heroicons', 'tabler', 'carbon', 'mdi'];
  
  // ✅ Split keywords by comma and trim whitespace
  const keywords = keyword.includes(',') 
    ? keyword.split(',').map(k => k.trim()) 
    : [keyword];
  
  console.log(`🔍 Searching with fallback keywords: ${keywords.join(' → ')}`);
  
  // ✅ Try each keyword in order (primary, secondary, tertiary)
  for (let i = 0; i < keywords.length; i++) {
    const currentKeyword = keywords[i];
    const keywordLabel = i === 0 ? 'PRIMARY' : i === 1 ? 'SECONDARY' : 'TERTIARY';
    
    console.log(`🔎 Trying ${keywordLabel} keyword: "${currentKeyword}"`);
    
    try {
      // Search across all preferred sets in ONE API call
      const searchUrl = `${ICONIFY_API}/search?query=${encodeURIComponent(currentKeyword)}&limit=50`;
      
      const searchResponse = await fetch(searchUrl, { 
        signal: AbortSignal.timeout(5000),
        headers: { 'Accept': 'application/json' }
      });
      
      if (!searchResponse.ok) {
        throw new Error(`HTTP ${searchResponse.status}: ${searchResponse.statusText}`);
      }
      
      const searchData = await searchResponse.json();
      
      // ✅ Check if any icons were found
      if (searchData?.icons && searchData.icons.length > 0) {
        // ✅ Filter results by preferred icon sets (in priority order)
        let selectedIcon = null;
        
        for (const preferredSet of preferredSets) {
          // Find first icon from this preferred set
          selectedIcon = searchData.icons.find(iconId => 
            iconId.startsWith(`${preferredSet}:`)
          );
          
          if (selectedIcon) {
            console.log(`✅ Found icon from preferred set '${preferredSet}': ${selectedIcon}`);
            break;
          }
        }
        
        // If no preferred set match, use first result
        if (!selectedIcon) {
          selectedIcon = searchData.icons[0];
          console.log(`⚠️ Using first available icon: ${selectedIcon}`);
        }
        
        // ✅ Icon ID already includes prefix (e.g., "lucide:home")
        const fullIconId = selectedIcon;
        const [iconSet, iconName] = fullIconId.split(':');
        
        // ✅ Fetch SVG data
        const svgUrl = `${ICONIFY_API}/${fullIconId}.svg`;
        console.log(`📥 Fetching SVG: ${svgUrl}`);
        
        const svgResponse = await fetch(svgUrl, { 
          signal: AbortSignal.timeout(5000),
          headers: { 'Accept': 'image/svg+xml' }
        });
        
        if (!svgResponse.ok) {
          throw new Error(`SVG fetch failed: HTTP ${svgResponse.status}`);
        }
        
        const svgContent = await svgResponse.text();
        console.log(svgContent);
        
        console.log(`✅ Successfully found icon using ${keywordLabel} keyword: ${currentKeyword}`);
        
        return {
          found: true,
          iconData: {
            iconId: fullIconId,           // Full ID: "lucide:home"
            iconName: iconName,            // Just name: "home"
            iconSet: iconSet,              // Just prefix: "lucide"
            svgContent: svgContent,
            keyword: currentKeyword,       // Which keyword worked
            originalKeyword: keyword,      // Original input with all fallbacks
            source: 'iconify',
            totalResults: searchData.total || searchData.icons.length
          },
          usedKeyword: currentKeyword
        };
      }
      
      console.log(`⚠️ No icons found for ${keywordLabel} keyword: "${currentKeyword}"`);
      
    } catch (err) {
      console.error(`❌ Search failed for ${keywordLabel} keyword '${currentKeyword}':`, err.message);
      // Continue to next keyword
    }
  }
  
  // ✅ No icon found with any keyword
  console.log(`❌ No icon found for any keyword in: ${keyword}`);
  return { found: false, iconData: null };
};

/**
 * Desaturate color for premium feel (88% saturation)
 */
function getDesaturatedColor(color) {
  const colorMap = {
    'blue': '#5B6CFF',
    'indigo': '#6366F1',
    'purple': '#8B5CF6',
    'pink': '#EC4899',
    'red': '#EF4444',
    'orange': '#F97316',
    'yellow': '#EAB308',
    'green': '#22C55E',
    'teal': '#14B8A6',
    'cyan': '#06B6D4'
  };
  
  let hex = colorMap[color.toLowerCase()] || color;
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;
  
  if (max === min) return `#${hex}`;
  
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
  let h;
  switch (max) {
    case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
    case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
    case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
  }
  
  const newS = s * 0.88; // 88% saturation for premium feel
  
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  const q = l < 0.5 ? l * (1 + newS) : l + newS - l * newS;
  const p = 2 * l - q;
  
  const newR = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const newG = Math.round(hue2rgb(p, q, h) * 255);
  const newB = Math.round(hue2rgb(p, q, h - 1/3) * 255);
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};


/**
 * Convert named color to hex
 */
function convertToHex(color) {
  const colorMap = {
    'blue': '#3B82F6',
    'indigo': '#6366F1',
    'purple': '#8B5CF6',
    'pink': '#EC4899',
    'red': '#EF4444',
    'orange': '#F97316',
    'yellow': '#EAB308',
    'green': '#22C55E',
    'teal': '#14B8A6',
    'cyan': '#06B6D4'
  };
  
  return colorMap[color.toLowerCase()] || color;
};


/**
 * Apply premium styling to SVG icons for pitch decks
 * @param {string} svgContent - Original SVG content
 * @param {string} brandColor - Brand color (hex or named)
 * @param {object} options - Styling options
 * @returns {string} Premium-styled SVG
 */
function applyPremiumIconStyling(svgContent, brandColor, options = {}) {
  const {
    strokeWidth = 2.5,
    linecap = 'round',
    linejoin = 'round',
    addDropShadow = true,
    desaturate = true,
    padding = 2,
  } = options;

  // Step 1: Get styled color
  const styledColor = desaturate 
    ? getDesaturatedColor(brandColor)
    : convertToHex(brandColor);

  // ✅ FIXED: Better detection logic - check CONTEXT of currentColor usage
  const hasFillCurrentColor = svgContent.includes('fill="currentColor"') || 
                               svgContent.includes('fill:currentColor');
  
  const hasStrokeCurrentColor = svgContent.includes('stroke="currentColor"') || 
                                 svgContent.includes('stroke:currentColor');
  
  const hasExplicitStroke = svgContent.includes('stroke=') || 
                             svgContent.includes('stroke:');
  
  const hasExplicitFill = svgContent.includes('fill=') || 
                           svgContent.includes('fill:');

  // Determine icon type based on context
  const isStrokeBased = hasStrokeCurrentColor || 
                        (hasExplicitStroke && !hasFillCurrentColor);
  
  const isFillBased = hasFillCurrentColor || 
                      (hasExplicitFill && !hasStrokeCurrentColor);

  let styledSVG = svgContent;

  console.log('Icon Detection:', { 
    isStrokeBased, 
    isFillBased, 
    hasFillCurrentColor, 
    hasStrokeCurrentColor 
  });

  // Step 3: Apply color styling based on icon type
  if (isStrokeBased) {
    console.log('Applying STROKE-BASED styling');
    
    // Handle currentColor for strokes
    styledSVG = styledSVG
      .replace(/stroke="currentColor"/g, `stroke="${styledColor}"`)
      .replace(/stroke:\s*currentColor/g, `stroke:${styledColor}`)
      
      // Replace explicit stroke colors (but not "none")
      .replace(/stroke="(?!none)[^"]*"/g, `stroke="${styledColor}"`)
      .replace(/stroke:\s*(?!none)[^;]+/g, `stroke:${styledColor}`)
      
      // Apply stroke width
      .replace(/stroke-width="[^"]*"/g, `stroke-width="${strokeWidth}"`)
      .replace(/stroke-width:\s*[^;]+/g, `stroke-width:${strokeWidth}`)
      
      // Apply rounded corners
      .replace(/stroke-linecap="[^"]*"/g, `stroke-linecap="${linecap}"`)
      .replace(/stroke-linejoin="[^"]*"/g, `stroke-linejoin="${linejoin}"`)
      
      // Ensure fill is none for outline icons
      .replace(/fill="(?!none)[^"]*"/g, 'fill="none"')
      .replace(/fill:\s*(?!none)[^;]+/g, 'fill:none');
      
  } else if (isFillBased) {
    console.log('Applying FILL-BASED styling');
    
    // Handle currentColor for fills
    styledSVG = styledSVG
      .replace(/fill="currentColor"/g, `fill="${styledColor}"`)
      .replace(/fill:\s*currentColor/g, `fill:${styledColor}`)
      
      // Replace explicit fill colors (but not "none")
      .replace(/fill="(?!none)[^"]*"/g, `fill="${styledColor}"`)
      .replace(/fill:\s*(?!none)[^;]+/g, `fill:${styledColor}`)
      
      // Remove any stroke attributes that might interfere
      .replace(/\s+stroke="[^"]*"/g, '')
      .replace(/;\s*stroke:[^;]+/g, '');
      
  } else {
    // Fallback: try to detect based on content
    console.warn('Could not determine icon type, applying safe defaults');
    
    styledSVG = styledSVG
      .replace(/currentColor/g, styledColor);
  }

  // Step 4: Ensure proper SVG attributes
  if (!styledSVG.includes('xmlns=')) {
    styledSVG = styledSVG.replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  if (!styledSVG.includes('viewBox=')) {
    styledSVG = styledSVG.replace(/<svg/, '<svg viewBox="0 0 24 24"');
  }

  if (!styledSVG.includes('width=')) {
    styledSVG = styledSVG.replace(/<svg/, '<svg width="24" height="24"');
  }

  // Step 5: Apply drop shadow filter
  if (addDropShadow) {
    const filterDef = `
      <filter id="premium-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
        <feOffset dx="0" dy="2" result="offsetblur"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.15"/>
        </feComponentTransfer>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>`;

    if (styledSVG.includes('<defs>')) {
      styledSVG = styledSVG.replace('<defs>', `<defs>${filterDef}`);
    } else {
      styledSVG = styledSVG.replace(/(<svg[^>]*>)/, `$1<defs>${filterDef}</defs>`);
    }

    // Apply filter to all drawable elements
    styledSVG = styledSVG
      .replace(/<path(?!\s+[^>]*filter=)(\s)/g, '<path filter="url(#premium-shadow)"$1')
      .replace(/<circle(?!\s+[^>]*filter=)(\s)/g, '<circle filter="url(#premium-shadow)"$1')
      .replace(/<rect(?!\s+[^>]*filter=)(\s)/g, '<rect filter="url(#premium-shadow)"$1')
      .replace(/<line(?!\s+[^>]*filter=)(\s)/g, '<line filter="url(#premium-shadow)"$1')
      .replace(/<polyline(?!\s+[^>]*filter=)(\s)/g, '<polyline filter="url(#premium-shadow)"$1')
      .replace(/<polygon(?!\s+[^>]*filter=)(\s)/g, '<polygon filter="url(#premium-shadow)"$1')
      .replace(/<ellipse(?!\s+[^>]*filter=)(\s)/g, '<ellipse filter="url(#premium-shadow)"$1');
  }

  // Step 6: Add padding for consistent optical size
  if (padding > 0) {
    const viewBoxMatch = styledSVG.match(/viewBox="([^"]+)"/);
    if (viewBoxMatch) {
      const [minX, minY, width, height] = viewBoxMatch[1].split(/\s+/).map(Number);
      const newMinX = minX - padding;
      const newMinY = minY - padding;
      const newWidth = width + (padding * 2);
      const newHeight = height + (padding * 2);
      
      styledSVG = styledSVG.replace(
        /viewBox="[^"]+"/,
        `viewBox="${newMinX} ${newMinY} ${newWidth} ${newHeight}"`
      );
    }
  }

  return styledSVG;
}


/**
 * USAGE EXAMPLE - Replace in professionalIconService.js
 */
async function generatePremiumStyledIcon(keyword, brandColor) {
  try {
    // Step 1: Search Iconify
    const { found, iconData } = await searchIconifyIcons(keyword);
    
    if (found) {
      // Step 2: Apply premium styling (YOUR ENHANCEMENTS)
      const premiumSVG = applyPremiumIconStyling(iconData.svgContent, brandColor, {
        strokeWidth: 2.5,        // Your preference (2.5-3px)
        linecap: 'round',        // Rounded corners
        linejoin: 'round',       // Rounded joins
        addDropShadow: true,     // Subtle depth
        desaturate: true,        // Premium color treatment
        padding: 2,              // Optical size consistency
      });
      
      // Step 3: Convert to PNG
      const { key } = await convertSVGToPNG(premiumSVG);
      
      console.log(`✅ Generated PREMIUM icon from ${iconData.iconId}`);
      
      return {
        key,
        source: 'iconify-premium',
        iconId: iconData.iconId,
        keyword: iconData.keyword
      };
    }
    
    // Fallback to Runware
    console.log(`⚠️ No match, using Runware for: ${keyword}`);
    const runwarePrompt = `Minimalist ${brandColor} outline icon, 2.5px stroke width, rounded corners. 
Concept: ${keyword}. Style: Premium, clean, professional for business presentation.`;
    
    const { key } = await generateRunwareImage(runwarePrompt, {
      width: 512,
      height: 512,
    });
    
    return { key, source: 'runware' };
    
  } catch (err) {
    console.error(`Premium icon generation failed for "${caption}":`, err);
    throw err;
  }
};


// Export functions
module.exports = {
  generatePremiumStyledIcon,
};