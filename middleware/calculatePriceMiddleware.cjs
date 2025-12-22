// calculatePriceMiddleware.cjs
let cachedMiddleware;

module.exports = async function x402Wrapper(req, res, next) {
  if (!cachedMiddleware) {
    const mod = await import('./calculatePriceMiddleware.mjs');
    cachedMiddleware = mod.default;
  }

  return cachedMiddleware(req, res, next);
};
