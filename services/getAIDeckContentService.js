// Module to generate AI content and images using google gemini and other AI models
const { GoogleGenAI, Modality } = require("@google/genai");
const { validateSlideSchema } = require("../utils/slideSchemaValidator");
const { AppError } = require("../utils/error");
const { sanitizeGeminiResponse } = require("../utils/helper");
const { uploadImageService } = require("./uploadService");

const ai = new GoogleGenAI({});
const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Generate slide content using Google Gemini AI
 * @param {string} prompt - The prompt to send to the AI model
 * @param {Object} options - { retries: number, model: string, generationConfig: Object }
 */

const generateSlideContent = async (
    prompt, { retries = 2, model = DEFAULT_MODEL, generationConfig = {} } = {}) => {
        if (!prompt || typeof prompt !== 'string') {
            throw new AppError('Prompt must be a non empty string', 400);
        }
        let lastError = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig,
                });

                const raw = response.text;
                if (!raw) throw new AppError('Empty response from GEMINI AI model', 500);

                const parsedResponse = sanitizeGeminiResponse(raw);
                
                // Validate the parsed response against the slide schema
                const { valid, errors } = validateSlideSchema(parsedResponse);
                if (!valid) {
                    throw new AppError(`Invalid slide schema: ${JSON.stringify(errors)}`, 500);
                }

                return parsedResponse;
            } catch (error) {
                lastError = error;
                if (attempt < retries) {
                    console.warn(`Attempt ${attempt + 1} failed. Retrying...`, error);
                    await new Promise(res => setTimeout(res, 500 * Math.pow(2, attempt))); // Exponential backoff
                    continue;
                }
            }
        }
        throw new AppError(`Failed to generate slide content after ${retries + 1} attempts: ${lastError.message}`, 500);
    };


// Generate image using Google Gemini AI
const generateSlideImage = async (
  prompt,
  { caption = "", retries = 2, model = "gemini-2.5-flash-image", generationConfig = {} } = {}
) => {
  if (!prompt || typeof prompt !== "string") {
    throw new AppError("Prompt must be a non-empty string", 400);
  }

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt, // ✅ docs use raw string too
        generationConfig: {
          ...generationConfig,
          responseModalities: [Modality.IMAGE],
        },
      });

      const candidate = response.candidates?.[0];
      if (!candidate) {
        throw new AppError("No candidate in image generation response", 500);
      }

      // ✅ use camelCase inlineData (docs)
      const imagePart = candidate.content.parts.find((p) => p.inlineData?.data);
      if (!imagePart) {
        throw new AppError("No image data found in response parts", 500);
      }

      const buffer = Buffer.from(imagePart.inlineData.data, "base64");

      const mimeType = imagePart.inlineData.mimeType || "image/png";
      if (!mimeType.startsWith("image/")) {
        throw new AppError(`Invalid MIME type for image: ${mimeType}`, 500);
      }

      const imageFile = {
        buffer,
        mimeType: mimeType,
        originalname: `slide-image-${Date.now()}.png`,
      };

      const key = await uploadImageService(imageFile);

      return { prompt, caption, key, status: "completed" };
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        throw new AppError(
          `Failed to generate image after ${retries + 1} attempts: ${lastError.message}`,
          500
        );
      }
      console.warn(`Image generation attempt ${attempt + 1} failed. Retrying...`, error);
      await new Promise((res) => setTimeout(res, 500 * Math.pow(2, attempt))); // exponential backoff
    }
  }

  throw new AppError(
    `Image generation failed after all retries: ${lastError?.message || "unknown error"}`,
    500
  );
};


// Generate Brand Kit
const generateBrandKit = async (
    prompt, { retries = 2, model = DEFAULT_MODEL, generationConfig = {} } = {}) => {
        if (!prompt || typeof prompt !== 'string') {
            throw new AppError('Prompt must be a non empty string', 400);
        }
        let lastError = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig,
                });

                const raw = response.text;
                if (!raw) throw new AppError('Empty response from GEMINI AI model', 500);

                const parsedResponse = sanitizeGeminiResponse(raw);

                return parsedResponse;
            } catch (error) {
                lastError = error;
                if (attempt < retries) {
                    console.warn(`Attempt ${attempt + 1} failed. Retrying...`, error);
                    await new Promise(res => setTimeout(res, 500 * Math.pow(2, attempt))); // Exponential backoff
                    continue;
                }
            }
        }
        throw new AppError(`Failed to generate Brand Kit after ${retries + 1} attempts: ${lastError.message}`, 500);
  };


// Export function
module.exports = { generateSlideContent, generateSlideImage, generateBrandKit };