// calculatePriceMiddleware.mjs
import { paymentMiddleware } from 'x402-express';

/**
 * Middleware to process payment using X402 V1.
 * Returns the x402 payment middleware
 */

const walletAddress = "0x32893f02Ac4835592a27D630c51aAA5E5f19B7CA";
const facilitator = { url: "https://x402.org/facilitator" };

const x402 = (req, res, next) => {
  const middleware = paymentMiddleware(
    walletAddress,
    {
      "POST /purchase/crypto": {
        price: `$${req.x402?.price}`,
        network: "base-sepolia",
        config: {
          description: `Purchase of ${req.x402?.price} tokens`,
          inputSchema: {
            type: "object",
            properties: {
              quantity: { type: "number", minimum: 1 }
            },
            required: ["quantity"]
          },
          outputSchema: {
            type: "object",
            properties: {
              status: { type: "string" },
              message: { type: "string" },
              transactionId: { type: "string" },
              user: { type: "object" }
            }
          }
        }
      }
    },
    facilitator
  );
  
  return middleware(req, res, next);
};

export default x402;