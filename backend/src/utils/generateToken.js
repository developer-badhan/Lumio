import jwt from "jsonwebtoken"

// ─────────────────────────────────────────────────────────────────────────────
//  Token Generators (JWT-based Authentication)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a short-lived access token.
 * Used for authenticating API requests.
 *
 * @param {string|ObjectId} userId
 * @returns {string} JWT access token (expires in 15 minutes)
 */
export const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.ACCESS_TOKEN,
        { expiresIn: "15m" }
    )
}

/**
 * Generates a long-lived refresh token.
 * Used to issue new access tokens without re-login.
 *
 * @param {string|ObjectId} userId
 * @returns {string} JWT refresh token (expires in 7 days)
 */
export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.REFRESH_TOKEN,
        { expiresIn: "7d" }
    )
}

/**
 * Generates a short-lived verification token.
 * Typically used for email verification or sensitive actions.
 *
 * @param {string|ObjectId} userId
 * @returns {string} JWT verify token (expires in 10 minutes)
 */
export const generateVerifyToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.VERIFY_TOKEN,   
        { expiresIn: "10m" }
    )
}

/**
 * Convenience helper to generate both access & refresh tokens together.
 *
 * @param {string|ObjectId} userId
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export const generateTokens = (userId) => {

    const accessToken = generateAccessToken(userId)
    const refreshToken = generateRefreshToken(userId)

    return { accessToken, refreshToken }   
    
}