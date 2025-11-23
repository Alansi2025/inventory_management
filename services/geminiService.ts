import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

export const generateProductDescription = async (name: string, category: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Write a concise, professional marketing description (max 2 sentences) for a product named "${name}" in the category "${category}".`,
    });
    return response.text || "No description generated.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "Failed to generate description via AI.";
  }
};

export const analyzeInventoryRisks = async (products: Product[]): Promise<string> => {
  try {
    // Prepare a lightweight summary to avoid token limits if list is huge
    const inventorySummary = products.map(p => ({
      name: p.name,
      qty: p.quantity,
      cat: p.category,
      price: p.price
    }));

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze this inventory data and provide a strategic summary. 
      Identify low stock risks (quantity < 10), suggest potential restocking priorities, and comment on the portfolio balance.
      Format the output as a helpful Markdown summary with bullet points.
      
      Inventory Data: ${JSON.stringify(inventorySummary)}`,
      config: {
        systemInstruction: "You are an expert Inventory Operations Manager.",
      }
    });
    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Error analyzing inventory:", error);
    return "Unable to analyze inventory at this time.";
  }
};

export const suggestPricing = async (name: string, category: string): Promise<{ min: number, max: number, reasoning: string }> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Suggest a price range for a "${name}" in the category "${category}". Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        min: { type: Type.NUMBER },
                        max: { type: Type.NUMBER },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["min", "max", "reasoning"]
                }
            }
        });
        const text = response.text;
        if (text) {
            return JSON.parse(text);
        }
        throw new Error("No JSON returned");
    } catch (e) {
        console.error(e);
        return { min: 0, max: 0, reasoning: "AI unavailable" };
    }
}