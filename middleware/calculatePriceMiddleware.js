const { paymentMiddleware, x402ResourceServer } = require('@x402/express');
const { ExactEvmScheme } = require('@x402/evm/exact/server');
const { HTTPFacilitatorClient } = require('@x402/core/server');

/**
 * Middleware to process payment using X402 v2.
 * Returns the x402 payment middleware
 */

const walletAddress = "0x32893f02Ac4835592a27D630c51aAA5E5f19B7CA";

// Create facilitator client for testnet
const facilitatorClient = new HTTPFacilitatorClient({
    url: "https://x402.org/facilitator"
});

// Create resource server and register EVM scheme
const server = new x402ResourceServer(facilitatorClient)
    .register("eip155:84532", new ExactEvmScheme()); // Base Sepolia

const x402 = (req, res, next) => {
    // Get price from request context
    const price = req.x402?.price || "0.015"; // Default price if not set
    
    const middleware = paymentMiddleware(
        {
            "POST /purchase": {
                accepts: [
                    {
                        scheme: "exact",
                        price: `$${price}`,
                        network: "eip155:84532", // Base Sepolia (CAIP-2 format)
                        payTo: walletAddress,
                    },
                ],
                description: `Purchase of ${price} tokens`,
                mimeType: "application/json",
            }
        },
        server
    );
    
    return middleware(req, res, next);
};

module.exports = x402;