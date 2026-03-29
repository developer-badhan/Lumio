// ─────────────────────────────────────────────────────────────────────────────
//  OTP Generator Utility
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a 6-digit numeric OTP (One-Time Password).
 * Commonly used for email or phone verification.
 *
 * Range: 100000 - 999999
 *
 * @returns {string} 6-digit OTP as a string
 */
export const generateOtp = () => {

  return Math.floor(100000 + Math.random() * 900000).toString()
  
}