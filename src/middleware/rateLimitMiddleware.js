const requestCountStore = new Map();

/**
 * Middleware function for rate limiting based on user's tier.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - Callback to the next middleware function.
 */
export function rateLimitMiddleware(req, res, next) {
  const { userId, tier } = req;
  const requestLimit = getRequestLimitByTier(tier);

  if (hasExceededRequestLimit(userId, requestLimit)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  incrementRequestCount(userId);

  setTimeout(() => {
    resetRequestCount(userId);
  }, 24 * 60 * 60 * 1000);

  next();
}

/**
 * Retrieves the request limit for a given user tier.
 * @param {string} tier - The user's subscription tier.
 * @return {number} The number of requests a user can make based on their tier.
 */
function getRequestLimitByTier(tier) {
  const tierLimits = {
    Tier1: 1000,
    Tier2: 100,
  };

  return tierLimits[tier] || 0;
}

/**
 * Checks if a user has exceeded their rate limit.
 * @param {string} userId - The user's unique identifier.
 * @param {number} requestLimit - The maximum number of requests the user is allowed to make.
 * @return {boolean} True if the user has exceeded their rate limit, false otherwise.
 */
function hasExceededRequestLimit(userId, requestLimit) {
  const requestCount = requestCountStore.get(userId) || 0;
  return requestCount >= requestLimit;
}

/**
 * Increments the request count for a given user.
 * @param {string} userId - The user's unique identifier.
 */
function incrementRequestCount(userId) {
  const currentCount = requestCountStore.get(userId) || 0;
  requestCountStore.set(userId, currentCount + 1);
}

/**
 * Resets the request count for a given user.
 * @param {string} userId - The user's unique identifier.
 */
function resetRequestCount(userId) {
  requestCountStore.delete(userId);
}
