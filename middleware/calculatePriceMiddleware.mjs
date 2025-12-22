import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { facilitator } from '@coinbase/x402';

/**
 * Middleware to process payment using X402 v2.
 * Returns the x402 payment middleware
 */

const walletAddress = "0x32893f02Ac4835592a27D630c51aAA5E5f19B7CA";

// Create facilitator client for testnet
const facilitatorClient = new HTTPFacilitatorClient({
    url: "https://api.cdp.coinbase.com/platform/v2/x402"
});

// Create resource server and register EVM scheme
const server = new x402ResourceServer(facilitator)
    .register("eip155:8453", new ExactEvmScheme()); // Base mainnet

export default function x402(req, res, next) {
    // Get price from request context
    const price = req.x402?.price || "0.015"; // Default price if not set
    
    const middleware = paymentMiddleware(
        {
            "POST /purchase": {
                accepts: [
                    {
                        scheme: "exact",
                        price: `$${price}`,
                        network: "eip155:8453", // Base mainnet (CAIP-2)
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