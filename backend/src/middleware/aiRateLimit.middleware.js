import rateLimit from "express-rate-limit"

/*
** This middleware limits AI-related requests to 2 per minute per IP address. If the limit is exceeded, it returns a JSON response indicating that the AI request limit has been exceeded and advises the user to try again in a minute. The standard headers are included in the response, and legacy headers are disabled.
** This helps prevent abuse of AI resources while allowing legitimate users to access the service without significant restrictions.
** Usage: Apply this middleware to routes that handle AI-related requests, such as those that generate responses using AI models or access AI services. This ensures that users cannot overwhelm the system with too many requests in a short period of time.
*/

// Rate limiter for AI-related requests
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  message: {
    success: false,
    message: "AI request limit exceeded. Try again in a minute."
  },
  standardHeaders: true,
  legacyHeaders: false
})