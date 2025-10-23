/**
 * Module to generate PDF and PPTX pitch decks using Puppeteer and PptxGenJS.
 */
const puppeteer = require('puppeteer');
const PptxGenJS = require('pptxgenjs');
const sharp = require('sharp');
const { AppError } = require('../utils/error');
const { uploadFileService } = require('../services/uploadService');

let browserInstance;

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

/** Helper: wait for all slides and assets to finish rendering */
const waitForSlidesToRender = async (page, timeout = 45000) => {
  console.log('🧭 Waiting for slides and assets to fully render...');

  // Wait for slides to stabilize (count stops changing)
  await page.waitForFunction(
    () => {
      if (!window.__slideCheck) {
        window.__slideCheck = { count: 0, stableSince: Date.now() };
      }
      const slides = document.querySelectorAll('.slide, [id^="slide-"]');
      const count = slides.length;

      if (count !== window.__slideCheck.count) {
        window.__slideCheck = { count, stableSince: Date.now() };
      }

      // Wait until count stable for 2 seconds
      return count > 0 && Date.now() - window.__slideCheck.stableSince > 2000;
    },
    { timeout }
  );

  // Wait for all images and fonts to decode
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    await Promise.all(imgs.map(img => img.decode().catch(() => {})));
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });

  // Scroll through entire page to trigger lazy-load content
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 300));
    }
    window.scrollTo(0, 0);
  });

  // Let animations finish rendering
  await new Promise(r => setTimeout(r, 2000));

  const count = await page.evaluate(
    () => document.querySelectorAll('.slide, [id^="slide-"]').length
  );
  console.log(`✅ Found ${count} slides ready for export.`);
};


/** Generate both PDF and PPTX files from one render */
const generateDeckFiles = async (deckId, startupName, { pdf = true, pptx = false } = {}) => {
  if (!deckId) throw new AppError('Deck ID is required to generate files', 400);
  if (!pdf && !pptx) throw new AppError('At least one of PDF or PPTX generation must be requested', 400);

  startupName = (startupName || 'Startup')
    .replace(/[^a-z0-9-_ ]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();

  const exportUrl = `https://gidipitch.app/export-slide/${deckId}`;
  const results = {};
  let browser;
  let page;

  try {
    browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });

    // Retry load if first attempt fails
    try {
      await page.goto(exportUrl, { waitUntil: 'networkidle0', timeout: 40000 });
    } catch {
      console.warn('⚠️ First attempt failed — retrying deck export page...');
      await new Promise(r => setTimeout(r, 3000));
      await page.goto(exportUrl, { waitUntil: 'networkidle0', timeout: 40000 });
    }

    /** -------- Generate PDF -------- **/
    if (pdf) {
      await waitForSlidesToRender(page);

      // Measure total height of all slides dynamically
      const bodyHeight = await page.evaluate(() => {
        const slides = document.querySelectorAll('.slide, [id^="slide-"]');
        if (!slides.length) return document.body.scrollHeight;
        const lastSlide = slides[slides.length - 1];
        return lastSlide.offsetTop + lastSlide.offsetHeight + 100; // extra padding
      });

      // Expand viewport to match full height
      await page.setViewport({ width: 1600, height: Math.min(bodyHeight, 20000), deviceScaleFactor: 2 });
      await page.emulateMediaType('screen');

      // Generate full-length PDF
      const pdfBuffer = await page.pdf({
        printBackground: true,
        landscape: false,
        width: '1600px',
        height: `${bodyHeight}px`,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: false,
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
      await page.close().catch(() => {});
      page = await browser.newPage();
      await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });
      await page.goto(exportUrl, { waitUntil: 'networkidle0', timeout: 40000 });
      await waitForSlidesToRender(page);

      const slides = await page.$$('.slide, [id^="slide-"]');
      if (!slides.length) throw new AppError('No slides found on export page', 404);

      const pptxDoc = new PptxGenJS();
      const slideImages = [];

      for (let i = 0; i < slides.length; i++) {
        const el = slides[i];
        let imgBase64;

        try {
          imgBase64 = await el.screenshot({ encoding: 'base64' });
        } catch (err) {
          console.warn(`⚠️ Slide ${i + 1} screenshot failed: ${err.message}`);
          await page.reload({ waitUntil: 'networkidle0' });
          await new Promise(r => setTimeout(r, 2000));
          await waitForSlidesToRender(page);
          const retryEl = (await page.$$('.slide, [id^="slide-"]'))[i];
          imgBase64 = await retryEl.screenshot({ encoding: 'base64' });
        }

        try {
          const compressed = await sharp(Buffer.from(imgBase64, 'base64'))
            .jpeg({ quality: 80 })
            .toBuffer();
          slideImages.push({ data: compressed.toString('base64'), type: 'jpeg' });
        } catch {
          console.warn(`⚠️ JPEG compression failed on slide ${i + 1}, using PNG fallback.`);
          const fallback = await sharp(Buffer.from(imgBase64, 'base64'))
            .png({ compressionLevel: 6 })
            .toBuffer();
          slideImages.push({ data: fallback.toString('base64'), type: 'png' });
        }

        await new Promise(r => setTimeout(r, 100));
      }

      for (const { data, type } of slideImages) {
        const slide = pptxDoc.addSlide();
        slide.addImage({
          data: `data:image/${type};base64,${data}`,
          x: 0,
          y: 0,
          w: pptxDoc.width,
          h: pptxDoc.height,
        });
      }

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