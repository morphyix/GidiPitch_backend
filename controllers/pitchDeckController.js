const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// small helper to pause between requests if needed
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const now = () => new Date().toISOString();

const modifyPitchDeck = async (req, res) => {
  try {
    console.log(`${now()} Received request`);

    const { slides } = req.body;
    if (!Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({ message: 'Slides is required. No slide chosen.' });
    }

    console.log(`Processing ${slides.length} slides...`);

  
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const chat = model.startChat();

    const modifiedSlides = [];

  // rate limit
    const delayMs = process.env.GEMINI_DELAY_MS ? Number(process.env.GEMINI_DELAY_MS) : 0;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      console.log(`\n--- Slide ${i + 1}/${slides.length} start ---`);
      try {
        const { slideTitle, slideText, instruction } = slide;

        if (!slideTitle || !slideText || !instruction) {
          console.warn(`Skipping slide ${i + 1} — missing title/text/instruction`);
          continue;
        }

        console.log('2. Sending to Gemini AI for slide:', slideTitle);

        const prompt = `
You are an expert in pitch deck editing.
Your task: improve the content for a pitch deck slide titled "${slideTitle}".
Original text: "${slideText}"
Instruction: "${instruction}"
Please return only the improved version of the slide text with no extra commentary.
        `;

        // Send message and wait for response
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const updatedText = await response.text();

        console.log('3. Got AI response for slide:', slideTitle);

        modifiedSlides.push({
          slideTitle,
          originalText: slideText,
          updatedText,
        });

        console.log('4. Saved modified slide in memory:', slideTitle);
      } catch (slideErr) {
        // Per-slide error: capture and continue
        console.error(`Error processing slide ${i + 1}:`, slideErr && slideErr.message ? slideErr.message : slideErr);
        modifiedSlides.push({
          slideTitle: slide && slide.slideTitle ? slide.slideTitle : `Slide ${i + 1}`,
          originalText: slide && slide.slideText ? slide.slideText : '',
          updatedText: null,
          error: slideErr && slideErr.message ? slideErr.message : String(slideErr),
        });
      }

      // optional backoff to avoid rate limits
      if (delayMs > 0) {
        console.log(`Sleeping ${delayMs}ms before next slide to avoid rate limits...`);
        await sleep(delayMs);
      }

      console.log(`--- Slide ${i + 1}/${slides.length} done ---`);
    }

    console.log('5. Sending final response');
    return res.status(200).json({
      message: 'Slides updated (see results).',
      modifiedSlides,
    });
  } catch (error) {
    console.error('Error modifying pitch deck (controller):', error && error.message ? error.message : error);
    return res.status(500).json({
      message: 'Something went wrong!',
      error: error && error.message ? error.message : String(error),
    });
  }
};

module.exports = { modifyPitchDeck };
