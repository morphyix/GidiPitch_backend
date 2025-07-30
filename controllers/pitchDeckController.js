const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const modifyPitchDeck = async (req, res) => {
    try {
        const {slideTitle, slideText, instruction} = req.body;

        //basic validation
        if (!slideTitle || !slideText || !instruction) {
            return res.status(400).json({ message: 'Slide title, text, and instruction are required.' });
        }

        // to create the model and prompt
        const model = genAI.getGenerativeModel({model: 'gemini-pro'});


        const prompt = `You are an expert in pitch deck editor

        Your task: improve the content for a pitch deck slide titled "${slideTitle}" with the following text: "${slideText}".
        Instruction: "${instruction}"
        Please provide only the improved, professional and detailed version of the slides text without any commentary or extra words.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const updatedText = response.test();

        // respond
        res.status(200).json ({
            message: 'Slide updated so sucessfully',
            slideTitle,
            orignalText : slideText,
            updatedText,
        });
    } catch (error) {
        console.error('Error modifying pitch deck:', error.message);
        res.status(500).json({message: 'Something went wrong!', error:error.message});
    }
};