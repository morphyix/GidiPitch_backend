const PromoCount = require('../models/promotion');
const { AppError } = require('../utils/error');
const { modifyUserTokensService } = require('./authService');


// Create promotion entry
const createPromotionEntry = async (name, rewardTokens, limit) => {
    try {
        if (!name) {
            throw new AppError('Promotion name is required', 400);
        }
        if (rewardTokens < 0) {
            throw new AppError('Reward tokens must be a non-negative number', 400);
        }
        if (limit <= 0) {
            throw new AppError('Limit must be a positive number', 400);
        }
        
        const newPromotion = new PromoCount({
            name,
            rewardTokens,
            limit
        });
        await newPromotion.save();
        return newPromotion;
    } catch (error) {
        if (error instanceof AppError) throw error;

        console.error('Error creating promotion entry:', error);
        throw new AppError('Error creating promotion entry', 500);
    }
};


// Get promotion entry by name
const getPromotionEntryByName = async (name) => {
    try {
        if (!name) {
            throw new AppError('Promotion name is required', 400);
        }
        
        const promotion = await PromoCount.findOne({ name });
        if (!promotion) {
            throw new AppError('Promotion not found', 404);
        }
        return promotion;
    } catch (error) {
        if (error instanceof AppError) throw error;

        console.error('Error retrieving promotion entry:', error);
        throw new AppError('Error retrieving promotion entry', 500);
    }
};


// Apply promotion to user
const applyPromotionToUser = async (userId, promotionName) => {
    try {
        if (!userId || !promotionName) {
            throw new AppError('User ID and promotion name are required', 400);
        }

        // Check if promotion exists and is within limit
        const promotion = await getPromotionEntryByName(promotionName);
        if (promotion.count >= promotion.limit) {
            throw new AppError('Promotion limit reached', 400);
        }

        // Increment promotion count atomic level
        const updatedPromotion = await PromoCount.findOneAndUpdate(
            { name: promotionName, $expr: { $lt: ['$count', '$limit'] } },
            { $inc: { count: 1 } },
            { new: true }
        );

        if (!updatedPromotion) {
            throw new AppError('Promotion limit reached or promotion not found', 400);
        }

        // Apply promotion reward to user
        await modifyUserTokensService(userId, 'add', updatedPromotion.rewardTokens, `Applied promotion: ${promotionName}`);

        console.log(`Promotion "${promotionName}" with reward of ${updatedPromotion.rewardTokens} tokens applied to user ${userId}. Total count: ${updatedPromotion.count}`);

        return updatedPromotion;
    } catch (error) {
        if (error instanceof AppError) throw error;

        console.error('Error applying promotion to user:', error);
        throw new AppError('Error applying promotion to user', 500);
    }
};


// Delete promotion entry
const deletePromotionEntry = async (name) => {
    try {
        if (!name) {
            throw new AppError('Promotion name is required', 400);
        }
        
        const deletedPromotion = await PromoCount.findOneAndDelete({ name });
        if (!deletedPromotion) {
            throw new AppError('Promotion not found', 404);
        }
        return deletedPromotion;
    } catch (error) {
        if (error instanceof AppError) throw error;

        console.error('Error deleting promotion entry:', error);
        throw new AppError('Error deleting promotion entry', 500);
    }
};


module.exports = {
    createPromotionEntry,
    getPromotionEntryByName,
    applyPromotionToUser,
    deletePromotionEntry
};