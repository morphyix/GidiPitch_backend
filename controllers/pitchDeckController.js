const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const modifyPitchDeck = async (req, res) => {
  try {
    const { slides } = req.body;

    if (!Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({
        message: 'Slides is required no slide choosen.',
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const chat = model.startChat();
    const modifiedSlides = [];

    for (const slide of slides) {
      const { slideTitle, slideText, instruction } = slide;

      if (!slideTitle || !slideText || !instruction) {
        continue; // Skip invalid slides
      }

      const prompt = `
        You are an expert in pitch deck editing.
        Your task: improve the content for a pitch deck slide titled "${slideTitle}".
        Original text: "${slideText}"
        Instruction: "${instruction}"
        Please return only the improved version of the slide text with no extra commentary.
      `;

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      const updatedText = await response.text();

      modifiedSlides.push({
        slideTitle,
        originalText: slideText,
        updatedText,
      });
    }

    res.status(200).json({
      message: 'Slides updated successfully',
      modifiedSlides,
    });
  } catch (error) {
    console.error('Error modifying pitch deck:', error.message);
    res.status(500).json({
      message: 'Something went wrong!',
      error: error.message,
    });
  }
};

module.exports = { modifyPitchDeck };
