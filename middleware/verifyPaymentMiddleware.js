// Verify Paystack Payment Middleware
const { AppError } = require('../utils/error');

/**
 * Verify Paystack payment before granting access
 */
const verifyPaymentMiddleware = async (req, res, next) => {
    try {
        const { reference } = req.body;

        if (!reference) {
            throw new AppError("Reference is required", 400);
        }

        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: `/transaction/verify/${reference}`,
            method: "GET",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            }
        }

        const response = await new Promise((resolve, reject) => {
            const request = https.request(options, (pRes) => {
                let data = '';

                pRes.on('data', (chunk) => {
                    data += chunk;
                });

                pRes.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (err) {
                        reject(err);
                    }
                });
            });
            request.on('error', (err) => {
                reject(err);
            });
            request.end();
        });

        if (!response?.status) {
            throw new AppError("An error occured while verifying payment", 400);
        }
        req.paymentMethod = 'paystack';

        next();
    } catch (error) {
        if (error instanceof AppError) {
            return next(error); // Pass custom AppError to error handling middleware
        }
        console.error('Error verifying payment:', error);
        return next(new AppError('An error occurred while verifying payment', 500));
    }
};


module.exports = {
    verifyPaymentMiddleware
};