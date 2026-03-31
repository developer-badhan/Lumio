import { GoogleGenerativeAI } from "@google/generative-ai"

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is not set")
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const generateAIResponse = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    })

    const result = await model.generateContent(prompt)

    const response = result?.response

    if (!response) {
      throw new Error("Empty response from Gemini")
    }

    // Safe extraction across Gemini response formats
    let text = ""

    if (typeof response.text === "function") {
      text = response.text()
    } else if (response.candidates?.length) {
      text = response.candidates[0]?.content?.parts
        ?.map(p => p.text)
        .join("") || ""
    }

    if (!text) {
      console.error("Gemini raw response:", JSON.stringify(response, null, 2))
      throw new Error("AI returned empty text")
    }

    return text.trim()

  } catch (error) {
    console.error("Gemini Error:", error.message)
    throw new Error("AI generation failed")
  }
}