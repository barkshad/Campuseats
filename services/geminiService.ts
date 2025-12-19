
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { UserPreferences } from "../types";

const SYSTEM_PROMPT = `You are CampusEats AI, a high-fidelity voice-first conversational AI designed specifically for university students. 
Your core mission is to help students eat well within their tight budget (e.g. KSh 100-500).

Operational Guidelines:
1. Always suggest practical, realistic meals for student life (hostel, limited tools).
2. If the user doesn't provide budget, location, or cooking access, ask politely but concisely.
3. Use Search and Maps tools to find specific local prices and nearby vendors.
4. For every meal suggestion, include:
   - Price breakdown (KSh)
   - Specific location/vendor type
   - Nutrition note (Protein/Energy balance)
5. Tone: Calm, supportive, human, practical. No jargon or complex slang. Use short, voice-assistant friendly sentences.`;

export class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async getMealAdvice(prompt: string, preferences: UserPreferences) {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User Preferences: Budget KSh ${preferences.budget}, Location: ${preferences.location}, Cooking: ${preferences.cookingAccess}. User Inquiry: "${prompt}"`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });
    return response;
  }

  async getLocalMarkets(query: string, lat: number, lng: number) {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the most affordable student-friendly food markets or grocery stores for: ${query}`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });
    return response;
  }

  async analyzeFoodImage(base64Image: string, prompt: string) {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: `Identify this food/receipt. ${prompt}` }
        ]
      }
    });
    return response.text;
  }

  async generateMealVisual(prompt: string) {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: `A realistic, appetizing photo of: ${prompt}. Served simply on a student dorm table, natural lighting.` }] },
      config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  }

  async textToSpeech(text: string) {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  }
}

export const gemini = new GeminiService();
