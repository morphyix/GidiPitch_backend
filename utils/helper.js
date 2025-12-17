const sanitizeHtml = require('sanitize-html');
const puppeteer = require('puppeteer');
const sharp = require('sharp');
const uuid = require('uuid').v4;
const { AppError } = require('./error');
const { uploadImageService } = require('../services/uploadService');


const sanitize = (input) => {
  if (typeof input !== 'string' && typeof input !== 'number' && typeof input !== 'boolean') {
    throw new AppError('Input must be a string, number or boolean', 400);
  }

  const cleanInput = sanitizeHtml(String(input), {
    allowedTags: [],
    allowedAttributes: {},
  });
  return cleanInput.trim();
};


const extractFileKey = (url) => {
  try {
    const urlParts = new URL(url);
    const bucketPath = `/gidiPitch/`;
    if (urlParts.pathname.startsWith(bucketPath)) {
      return urlParts.pathname.replace(bucketPath, '');
    }
    return null;
  } catch (error) {
    console.error('Invalid URL:', error);
    return null;
  }
};


// Function to generate a PDF from HTML content
const generatePdfFromHtml = async (deckId) => {
  try {
    if (!deckId) {
      throw new AppError('Deck ID is required to generate PDF', 400);
    }

    const exportUrl = `https://gidipitch.app/deck-export/${deckId}`;
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto(exportUrl, { waitUntil: 'networkidle0', timeout: 10000 });

    await page.waitForTimeout(2000); // wait for 2 seconds to ensure all content is loaded

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      landscape: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (error instanceof AppError) {
      throw error; // Re-throw custom errors
    }
    throw new AppError('Failed to generate PDF', 500);
  }
};


// Sanitize gemini response
const sanitizeGeminiResponse = (rawResponse) => {
  if (!rawResponse || typeof rawResponse !== 'string') {
    throw new AppError('Invalid response from AI model', 500);
  }

  // Remove markdown code fences if present
  let cleanResponse = rawResponse.trim();
  if (cleanResponse.startsWith('```')) {
    cleanResponse = cleanResponse.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
  }

  // try parsing at first
  cleanResponse = cleanResponse.trim();
  try {
    return JSON.parse(cleanResponse);
  } catch (_) {
    
  }

  // Identify the first and last curly braces to extract JSON
  const firstBraceIndex = Math.min(
    cleanResponse.indexOf('{') !== -1 ? cleanResponse.indexOf('{') : Infinity,
    cleanResponse.indexOf('[') !== -1 ? cleanResponse.indexOf('[') : Infinity
  );
  const lastBraceIndex = Math.max(
    cleanResponse.lastIndexOf('}'), cleanResponse.lastIndexOf(']')
  );

  if (firstBraceIndex === Infinity || lastBraceIndex === -1 || lastBraceIndex <= firstBraceIndex) {
    console.log('AI response did not contain valid JSON:', rawResponse);
    throw new AppError('No valid JSON found in AI response', 500);
  }

  cleanResponse = cleanResponse.substring(firstBraceIndex, lastBraceIndex + 1);

  // Parse the cleaned JSON string
  let parsedData;
  try {
    parsedData = JSON.parse(cleanResponse);
  } catch (error) {
    console.error('Error parsing JSON from AI response:', error);
    throw new AppError('Failed to parse JSON from AI response', 500);
  }

  return parsedData;
};


const convertSVGToPNG = async (svgString, size = 512, retries = 2, quality = 100) => {
  if (!svgString || typeof svgString !== 'string') {
    throw new AppError('Invalid SVG string provided', 400);
  }

  // validate SVG format
  if (!svgString.includes('<svg')) {
    throw new AppError('Invalid SVG format: must contain <svg> tag', 400);
  }

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      let processedSVG = svgString.trim();
      console.log(`Converting SVG to PNG, attempt ${attempt + 1}`);

      // CRITICAL FIX: Add width and height attributes if missing
      // librsvg (used by Sharp) requires explicit dimensions to render properly
      if (!processedSVG.includes('width=') || !processedSVG.includes('height=')) {
        // Extract viewBox dimensions if present
        const viewBoxMatch = processedSVG.match(/viewBox=["']([^"']+)["']/);
        let width = size;
        let height = size;
        
        if (viewBoxMatch) {
          const viewBoxValues = viewBoxMatch[1].split(/\s+/);
          if (viewBoxValues.length === 4) {
            width = parseFloat(viewBoxValues[2]);
            height = parseFloat(viewBoxValues[3]);
          }
        }
        
        // Insert width and height into the SVG tag
        processedSVG = processedSVG.replace(
          /<svg/,
          `<svg width="${width}" height="${height}"`
        );
      }

      // Convert SVG to PNG buffer using Sharp
      const buffer = Buffer.from(processedSVG);

      const pngBuffer = await sharp(buffer, { 
        density: 300 // High density for quality rendering
      })
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // transparent background
          kernel: sharp.kernel.lanczos3,
        })
        .png({
          quality: quality,
          compressionLevel: 9,
          palette: false,
        })
        .toBuffer();

      const uid = uuid();
      const imageFile = {
        buffer: pngBuffer,
        mimetype: 'image/png',
        originalname: `icon_${uid}.png`,
      };
      console.log('PNG buffer created successfully, uploading to S3...');

      // upload image to S3
      const key = await uploadImageService(imageFile);
      console.log(`Successfully uploaded PNG to S3 with key: ${key}`);
      return { key };
    } catch (error) {
      console.warn(`Attempt ${attempt + 1} to convert SVG to PNG failed:`, error);
      lastError = error;
      if (attempt < retries) {
        // exponential backoff before retrying
        await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 100));
        continue;
      }
      console.error('All attempts to convert SVG to PNG failed:', lastError);
      throw new AppError('Failed to convert SVG to PNG after multiple attempts', 500);
    }
  }
};


module.exports = {
    sanitize,
    extractFileKey,
    generatePdfFromHtml,
    sanitizeGeminiResponse,
    convertSVGToPNG,
}