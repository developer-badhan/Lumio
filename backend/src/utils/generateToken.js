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
        process.env.REFRESH_TOKEN,
        { expiresIn: "7d" }
    )
}

export const generateVerifyToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.VERIFY_TOKEN,   
        { expiresIn: "10m" }
    )
}

export const generateTokens = (userId) => {

    const accessToken = generateAccessToken(userId)
    const refreshToken = generateRefreshToken(userId)
    return { accessToken, refreshToken }   
    
}
