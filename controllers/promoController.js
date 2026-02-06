const { createPromotionEntry, getPromotionEntryByName, deletePromotionEntry } = require('../services/promoService');
const { AppError } = require('../utils/error');


// Create Promo Transaction
const createPromoTransaction = async (req, res, next) => {
    try {
        const { name, rewardTokens, limit } = req.body;

        if (!name || rewardTokens === undefined || limit === undefined) {
            throw new AppError('Name, reward tokens, and limit are required', 400);
        }

        const userEmail = req.user.email; // Get user email from authenticated request

        // Check if user is authorized to create promotion (e.g., check if user is admin)
        if (userEmail !== process.env.ADMIN_EMAIL) {
            throw new AppError('Unauthorized to create promotion', 403);
        }

        // Check if promotion with the same name already exists
        const existingPromotion = await getPromotionEntryByName(name).catch(err => {
            if (err.statusCode !== 404) {
                throw err; // Rethrow if error is not "Promotion not found"
            }
        });
        if (existingPromotion) {
            throw new AppError('Promotion with this name already exists', 400);
        }

        const newPromotion = await createPromotionEntry(name, rewardTokens, limit);
        res.status(201).json({ success: true, promotion: newPromotion });
    } catch (error) {
        next(error);
    }
};


// Delete Promotion Entry
const deletePromotionEntryController = async (req, res, next) => {
    try {
        const { name } = req.params;

        if (!name) {
            throw new AppError('Promotion name is required', 400);
        }

        const userEmail = req.user.email; // Get user email from authenticated request

        // Check if user is authorized to delete promotion (e.g., check if user is admin)
        if (userEmail !== process.env.ADMIN_EMAIL) {
            throw new AppError('Unauthorized to delete promotion', 403);
        }

        await deletePromotionEntry(name);
        res.status(200).json({ success: true, message: 'Promotion deleted successfully' });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    createPromoTransaction,
    deletePromotionEntryController
};