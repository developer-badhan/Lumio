/**
 * This module provides a function to check if a given prompt is safe by looking for certain keywords and patterns that may indicate an attempt to bypass the system's rules or reveal sensitive information.
 * The function `isPromptSafe` takes a string input and returns a boolean indicating whether the prompt is considered safe or not.
 * It checks for specific blocked keywords and patterns that are commonly associated with prompt injection attacks.
 */


const blockedKeywords = [
  "ignore previous instructions",
  "reveal system prompt",
  "act as system",
  "bypass rules",
  "expose secret"
]

// Checks if the given text is safe by looking for blocked keywords and patterns that may indicate prompt injection attempts.
export const isPromptSafe = (text) => {
  const lowerText = text.toLowerCase()

  for (const word of blockedKeywords) {
    if (lowerText.includes(word)) {
      return false
    }
  }

  // Check for patterns that may indicate prompt injection attempts, such as "system:", "assistant:", or "developer:".
  const injectionRegex = /(system:|assistant:|developer:)/i
  if (injectionRegex.test(text)) {
    return false
  }

  return true
}