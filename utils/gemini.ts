import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

/**
 * generateAgriAdvice
 * =================
 * Uses Gemini 2.0 Flash to translate raw Fact Sheet JSON into professional,
 * human-readable agronomic or veterinary advice.
 */
export const generateAgriAdvice = async (factSheet: any, type: 'CROP' | 'ANIMAL') => {
  if (!apiKey) return "AI Key not configured.";

  try {
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

    // Using standard fetch instead of the SDK to avoid React Native APK polyfill issues
    // Using v1 endpoint with gemini-2.0-flash for best availability
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Free Tier limit reached. Please wait a minute before trying again.");
      }
      const errorText = await response.text();
      throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const text = data.candidates[0].content.parts[0].text;
        // Safety check: Strip any remaining asterisks or double-asterisks
        return text.replace(/\*/g, '').trim();
    } else {
        throw new Error("Invalid response structure from Gemini API");
    }

  } catch (error) {
    if (error instanceof Error && error.message.includes("Free Tier")) {
      return error.message;
    }
    console.error("Gemini Error:", error);
    return "The AI Oracle is currently resting. Please check the raw data below.";
  }
};
/**
 * chatWithOracle
 * ==============
 * Free-form agricultural AI chat.
 * If a factSheet is provided, the answer is grounded in real weather/location data.
 * Otherwise, Gemini answers from its general agricultural knowledge.
 */
export const chatWithOracle = async (
  userMessage: string,
  factSheet?: any,
  type?: 'CROP' | 'ANIMAL'
): Promise<string> => {
  if (!apiKey) return "AI Key not configured.";

  try {
    const systemContext = factSheet
      ? `You are Terra Oracle, an expert ${type === 'ANIMAL' ? 'Veterinary Scientist' : 'Agronomist'} AI assistant.
         You have access to REAL-TIME environmental data for the user's location.
         Use this data to give precise, location-specific advice.
         
         LIVE ENVIRONMENTAL DATA:
         ${JSON.stringify(factSheet, null, 2)}`
      : `You are Terra Oracle, an expert agricultural AI assistant for farmers.
         You provide practical, actionable advice on crops, livestock, soil, weather, and farming in general.`;

    const prompt = `${systemContext}
    
    RULES:
    1. Be concise but professional.
    2. Do NOT use Markdown formatting. No asterisks (**), no hashes (#). Plain text with simple line breaks only.
    3. Use a friendly, expert tone.
    4. If you have live data, reference specific numbers (temperature, humidity etc.).
    
    USER: ${userMessage}
    
    ORACLE:`;

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Free Tier limit reached. Please wait a minute before trying again.");
      }
      const errorText = await response.text();
      throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.replace(/\*/g, '').trim();
    }
    throw new Error("Invalid response from Gemini");

  } catch (error) {
    if (error instanceof Error && error.message.includes("Free Tier")) {
      return error.message;
    }
    console.error("Gemini Chat Error:", error);
    return "Oracle is temporarily unavailable. Please try again shortly.";
  }
};
