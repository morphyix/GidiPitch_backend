/**
 * Module to generate PDF and PPTX pitch decks using Puppeteer and PptxGenJS.
 */
const puppeteer = require('puppeteer');
const PptxGenJS = require('pptxgenjs');
const sharp = require('sharp');
const { AppError } = require('../utils/error');
const { uploadFileService } = require('../services/uploadService');

let browserInstance; // Persistent Puppeteer browser for performance

/** Launch or reuse Puppeteer instance */
const getBrowser = async () => {
  if (browserInstance && browserInstance.isConnected()) return browserInstance;

  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--disable-software-rasterizer',
      '--single-process',
    ],
  });
  return browserInstance;
};

/** Generate both PDF and PPTX files from one render */
const generateDeckFiles = async (deckId, startupName, { pdf = true, pptx = true } = {}) => {
  if (!deckId) throw new AppError('Deck ID is required to generate files', 400);

  if (!pdf && !pptx) {
    throw new AppError('At least one of PDF or PPTX generation must be requested', 400);
  }

  if (!startupName) {
    startupName = 'Startup';
  }

  startupName = startupName
    .replace(/[^a-z0-9-_ ]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();

  const exportUrl = `https://gidipitch.app/export-slide/${deckId}`;
  let page;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });

    // Retry load once if it fails
    try {
      await page.goto(exportUrl, { waitUntil: 'networkidle0', timeout: 40000 });
    } catch {
      console.warn('⚠️ First attempt failed — retrying deck export page...');
      await new Promise((r) => setTimeout(r, 3000));
      await page.goto(exportUrl, { waitUntil: 'networkidle0', timeout: 40000 });
    }

    await page.waitForSelector('.slide', { timeout: 15000 });
    const results = {};

    /** -------- Generate PDF -------- **/
    if (pdf) {
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        landscape: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: true,
      });

      const pdfFile = {
        buffer: pdfBuffer,
        mimetype: 'application/pdf',
        originalname: `${startupName}-pitch-deck.pdf`,
      };

      results.pdfKey = await uploadFileService(pdfFile);
    }

    /** -------- Generate PPTX -------- **/
    if (pptx) {
      const slides = await page.$$('.slide');
      if (!slides.length) throw new AppError('No slides found on export page', 404);

      const pptxDoc = new PptxGenJS();

      // Screenshot + compress in parallel
      const slideImages = await Promise.all(
        slides.map(async (el, index) => {
          const imgBase64 = await el.screenshot({ encoding: 'base64' });

          // Use JPEG for smaller file size; fallback to PNG if something breaks
          try {
            const compressed = await sharp(Buffer.from(imgBase64, 'base64'))
              .jpeg({ quality: 80 })
              .toBuffer();
            return { data: compressed.toString('base64'), type: 'jpeg' };
          } catch (err) {
            console.warn(`⚠️ JPEG compression failed on slide ${index + 1}, falling back to PNG.`);
            const fallback = await sharp(Buffer.from(imgBase64, 'base64'))
              .png({ compressionLevel: 6 })
              .toBuffer();
            return { data: fallback.toString('base64'), type: 'png' };
          }
        })
      );

      slideImages.forEach(({ data, type }) => {
        const slide = pptxDoc.addSlide();
        slide.addImage({
          data: `data:image/${type};base64,${data}`,
          x: 0,
          y: 0,
          w: pptxDoc.width,
          h: pptxDoc.height,
        });
      });

      const pptxBuffer = await pptxDoc.write('arraybuffer');
      const pptxFile = {
        buffer: Buffer.from(pptxBuffer),
        mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        originalname: `${startupName}-pitch-deck.pptx`,
      };

      results.pptxKey = await uploadFileService(pptxFile);
    }

    return results;
  } catch (error) {
    console.error('❌ Deck File Generation Error:', error);
    throw new AppError('Failed to generate pitch deck files', 500);
  } finally {
    if (page) {
      try {
        await page.close();
      } catch {
        console.warn('⚠️ Page cleanup failed');
      }
    }
  }
};

/** Graceful shutdown handler */
const closeBrowser = async () => {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
};

process.on('SIGINT', closeBrowser);
process.on('SIGTERM', closeBrowser);
process.on('exit', closeBrowser);


module.exports = { generateDeckFiles };