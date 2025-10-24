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
    // Check if instance exists and is connected
    if (browserInstance && browserInstance.isConnected()) return browserInstance;

    console.log('🚀 Launching new Puppeteer browser instance...');
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
            // Added max-old-space-size to help prevent memory-related crashes
            '--max-old-space-size=4096' 
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

/**
 * Dedicated function to generate the PDF file.
 * Manages its own page lifecycle and cleanup.
 */
const generatePdf = async (exportUrl, startupName) => {
    let page;
    // CRITICAL FIX: Get the browser instance internally, ignoring the passed argument (which is now defunct)
    const browser = await getBrowser(); 
    try {
        page = await browser.newPage();
        
        // Use a standard slide viewport size initially
        await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });

        // Retry load if first attempt fails
        try {
            await page.goto(exportUrl, { waitUntil: 'networkidle0', timeout: 40000 });
        } catch {
            console.warn('⚠️ PDF load retry attempt failed — retrying page...');
            await new Promise(r => setTimeout(r, 3000));
            await page.goto(exportUrl, { waitUntil: 'networkidle0', timeout: 40000 });
        }
        
        await waitForSlidesToRender(page);

        // Measure total height of all slides dynamically
        const bodyHeight = await page.evaluate(() => {
            const slides = document.querySelectorAll('[id^="slide-"]');
            if (!slides.length) return document.body.scrollHeight;
            const lastSlide = slides[slides.length - 1];
            return lastSlide.offsetTop + lastSlide.offsetHeight + 100; // extra padding
        });

        // Expand viewport to match full height for PDF printing
        await page.setViewport({ width: 1600, height: Math.min(bodyHeight, 20000), deviceScaleFactor: 2 });
        await page.emulateMediaType('screen');

        // Generate full-length PDF
        const pdfBuffer = await page.pdf({
            printBackground: true,
            landscape: false,
            width: '1600px',
            height: `${bodyHeight}px`,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            preferCSSPageSize: true,
        });

        const pdfFile = {
            buffer: pdfBuffer,
            mimetype: 'application/pdf',
            originalname: `${startupName}-pitch-deck.pdf`,
        };

        return await uploadFileService(pdfFile);

    } finally {
        // Crucial: Close the page on success or error
        if (page) {
            await page.close().catch(() => console.warn('⚠️ PDF page cleanup failed'));
        }
    }
};

/**
 * Dedicated function to generate the PPTX file (screenshots).
 * Ensures full-height, full-width slide images in the PPTX export.
 */
const generatePptx = async (exportUrl, startupName) => {
    let page;
    const PX_TO_INCH = 10 / 1600; // 1600px → 10in (16:9 PowerPoint layout)
    const browser = await getBrowser();

    try {
        page = await browser.newPage();
        await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });
        await page.emulateMediaType('screen');

        // Load export page (with retry)
        try {
            await page.goto(exportUrl, { waitUntil: 'networkidle0', timeout: 40000 });
        } catch {
            console.warn('⚠️ PPTX load retry attempt failed — retrying...');
            await new Promise(r => setTimeout(r, 3000));
            await page.goto(exportUrl, { waitUntil: 'networkidle0', timeout: 40000 });
        }

        await waitForSlidesToRender(page);

        // Normalize all slide DOMs to consistent 1600x900 size
        await page.evaluate(() => {
            const slides = document.querySelectorAll('[id^="slide-"]');
            slides.forEach(slide => {
                slide.style.width = '1600px';
                slide.style.height = '900px';
                slide.style.margin = '0';
                slide.style.padding = '0';
                slide.style.transform = 'none';
                slide.style.overflow = 'hidden';
                if (slide.parentElement) {
                    slide.parentElement.style.width = '1600px';
                    slide.parentElement.style.height = '900px';
                    slide.parentElement.style.display = 'block';
                }
            });
        });

        const slides = await page.$$('[id^="slide-"]');
        if (!slides.length) throw new AppError('No slides found on export page', 404);

        const pptxDoc = new PptxGenJS({
            layout: 'LAYOUT_16X9', // 10x5.625 in layout
        });

        const slideImages = [];

        for (let i = 0; i < slides.length; i++) {
            const el = slides[i];
            let imgBase64 = null;

            try {
                imgBase64 = await el.screenshot({ encoding: 'base64' });
            } catch (err) {
                console.warn(`⚠️ Slide ${i + 1} initial screenshot failed: ${err.message}. Retrying...`);
                await new Promise(r => setTimeout(r, 1000));
                const freshSlides = await page.$$('[id^="slide-"]');
                const retryEl = freshSlides[i];
                if (retryEl) {
                    imgBase64 = await retryEl.screenshot({ encoding: 'base64' });
                } else {
                    console.error(`❌ Slide ${i + 1} not found during retry.`);
                    continue;
                }
            }

            if (!imgBase64) {
                console.error(`❌ Skipping slide ${i + 1} due to screenshot failure.`);
                continue;
            }

            // Compress image
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

        // Add each screenshot as a full-bleed image (fills slide completely)
        for (const { data, type } of slideImages) {
            const slide = pptxDoc.addSlide();
            slide.addImage({
                data: `data:image/${type};base64,${data}`,
                x: 0,
                y: 0,
                w: 10,        // fill full slide width
                h: 5.625,     // fill full slide height
            });
        }

        const pptxBuffer = await pptxDoc.write('arraybuffer');
        const pptxFile = {
            buffer: Buffer.from(pptxBuffer),
            mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            originalname: `${startupName}-pitch-deck.pptx`,
        };

        return await uploadFileService(pptxFile);

    } finally {
        if (page) {
            await page.close().catch(() => console.warn('⚠️ PPTX page cleanup failed'));
        }
    }
};




/** Generate both PDF and PPTX files from one render (Orchestrator) */
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
    const errors = []; // Collect errors for better final error reporting

    try {
        // NOTE: We no longer call getBrowser() here. Each generator does it internally.

        /** -------- Generate PDF -------- **/
        if (pdf) {
            console.log('--- Starting PDF Generation ---');
            try {
                // We call generatePdf without passing a browser argument
                results.pdfKey = await generatePdf(exportUrl, startupName);
            } catch (error) {
                console.error('❌ Failed to generate PDF:', error.message || error);
                errors.push('PDF generation failed.');
            }
            
            /** --- CRITICAL FIX: FORCED BROWSER RESTART --- **/
            // Close the browser instance after the memory-intensive PDF job.
            // This guarantees a fresh, stable process for the PPTX job.
            await closeBrowser();
            console.log('✅ Browser instance closed for resource reset.');
        }


        /** -------- Generate PPTX -------- **/
        if (pptx) {
            console.log('--- Starting PPTX Generation ---');
            try {
                // The next call to getBrowser() inside generatePptx will launch a new process.
                results.pptxKey = await generatePptx(exportUrl, startupName);
            } catch (error) {
                console.error('❌ Failed to generate PPTX:', error.message || error);
                errors.push('PPTX generation failed.');
            }
            
            // Close browser after the PPTX job as well.
            await closeBrowser();
        }

        // Final Check: Determine success or total failure
        const requestedCount = (pdf ? 1 : 0) + (pptx ? 1 : 0);
        const succeededCount = (results.pdfKey ? 1 : 0) + (results.pptxKey ? 1 : 0);

        if (succeededCount > 0) {
            if (succeededCount < requestedCount) {
                // Partial success: Log a warning about the failure, but return the successful results
                console.warn(`⚠️ Export job partially succeeded. ${errors.join(' ')}`);
            }
            return results;
        } else {
            // Total failure: Throw a final error containing all collected errors
            throw new AppError(`Failed to generate any requested files. Errors: ${errors.join('; ')}`, 500);
        }

    } catch (error) {
        // This catch handles configuration errors or the final total failure check
        console.error('❌ Deck File Generation Orchestration Error:', error);
        throw new AppError('Failed to generate pitch deck files due to total failure or configuration error.', 500);
    } 
};

/** Graceful shutdown handler */
const closeBrowser = async () => {
    if (browserInstance) {
        console.log('🛑 Closing browser instance...');
        await browserInstance.close().catch(() => {
             console.warn('⚠️ Error during browser close, ignoring.');
        });
        browserInstance = null;
    }
};

process.on('SIGINT', closeBrowser);
process.on('SIGTERM', closeBrowser);
process.on('exit', closeBrowser);


module.exports = { generateDeckFiles };