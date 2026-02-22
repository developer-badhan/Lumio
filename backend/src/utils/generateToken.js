import jwt from "jsonwebtoken"

export const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.ACCESS_TOKEN,
        { expiresIn: "15m" }
    )
}

export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRETE,
        { expiresIn: "7d" }
    )
}

export const generateTokens = (userId) => {
    const accessToken = generateAccessToken(userId)
    const refreshToken = generateRefreshToken(userId)
    return { accessToken, refreshToken }
}
