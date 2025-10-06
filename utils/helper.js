const sanitizeHtml = require('sanitize-html');
const puppeteer = require('puppeteer');
const { AppError } = require('./error');


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
    const bucketPath = `/${process.env.S3_BUCKET}/`;
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
const generatePdfFromHtml = async (htmlContent) => {
  try {
    if (!htmlContent || typeof htmlContent !== 'string') {
      throw new AppError('Invalid HTML content provided', 400);
    }

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 10000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
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


module.exports = {
    sanitize,
    extractFileKey,
    generatePdfFromHtml,
    sanitizeGeminiResponse
}