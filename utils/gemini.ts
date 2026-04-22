import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * generateAgriAdvice
 * =================
 * Uses Gemini 2.0 Flash to translate raw Fact Sheet JSON into professional,
 * human-readable agronomic or veterinary advice.
 */
export const generateAgriAdvice = async (factSheet: any, type: 'CROP' | 'ANIMAL') => {
  if (!apiKey) return "AI Key not configured.";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Using 2.5 flash as requested in prompt history for stability

    const prompt = `
      You are an expert ${type === 'CROP' ? 'Agronomist' : 'Veterinary Scientist'} for Terra Oracle.
      Based on the following Fact Sheet (JSON), provide a professional advisory for the farmer.
      
      RULES:
      1. Be concise but professional.
      2. Highlight any thermal stress or climate alerts.
      3. Provide 3 specific actionable tips.
      4. Do not mention "The JSON" or "The Fact Sheet". 
      5. Use a friendly, encouraging tone.
      6. IMPORTANT: Do NOT use Markdown formatting. No asterisks (**), no hashes (#), and no bullet points (-). Use plain text and simple new lines only.
      
      FACT SHEET DATA:
      ${JSON.stringify(factSheet, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Safety check: Strip any remaining asterisks or double-asterisks
    return text.replace(/\*/g, '').trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI Oracle is currently resting. Please check the raw data below.";
  }
};
