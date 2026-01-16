
import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { Donor, EmergencyRequest, AIRecommendation } from './types';

/**
 * Professional Clinical Matchmaking
 */
export async function matchDonors(request: EmergencyRequest, availableDonors: Donor[]): Promise<AIRecommendation[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Analyze this emergency blood request and suggest the top 3 matches.
        Request: ${JSON.stringify(request)}
        Available Donors: ${JSON.stringify(availableDonors)}
        
        CRITICAL THINKING TASK:
        1. Evaluate compatibility risks.
        2. Prioritize universal donors (O-) for critical cases.
        3. Consider geographical proximity.
        4. Check donor recovery cycles.
        
        Return a JSON array of recommendations.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              donorId: { type: Type.STRING },
              reason: { type: Type.STRING },
              priorityScore: { type: Type.NUMBER }
            },
            required: ["donorId", "reason", "priorityScore"]
          }
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("AI Matchmaking failed:", error);
    return [];
  }
}

/**
 * Gemini 2.5 TTS for Professional Medical Alerts
 */
export async function speakEmergencyAlert(text: string): Promise<Uint8Array | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Clinical Alert: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    return null;
  } catch (error) {
    console.error("TTS failed:", error);
    return null;
  }
}

export async function getHealthGuidelines(isPlateletRequest: boolean): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide 3-4 bullet points of essential medical advice for someone preparing to donate ${isPlateletRequest ? 'platelets' : 'whole blood'}. Focus on hydration, nutrition, and rest. Keep it professional and concise.`,
    });
    return response.text || "Standard clinical guidelines apply: Hydrate well, eat a light meal, and ensure 7-8 hours of sleep.";
  } catch (error) {
    console.error("Guidelines fetch failed:", error);
    return "Standard clinical guidelines apply: Hydrate well, eat a light meal, and ensure 7-8 hours of sleep.";
  }
}

/**
 * findNearbyBanks with robust grounding fallback using Gemini 2.5 Flash.
 */
export async function findNearbyBanks(latitude: number, longitude: number, radius: number): Promise<{ chunks: any[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: `Find blood banks and hospitals near lat ${latitude.toFixed(4)}, lng ${longitude.toFixed(4)} within ${radius}km in Tamil Nadu, India.`,
      config: {
        systemInstruction: "Strictly focus on medical facilities within Tamil Nadu. Strictly exclude Vinayagar Temple and Nandha Engineering College from all results. Only return verified medical facilities like hospitals and blood banks. Do not return colleges, temples, or non-medical landmarks.",
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: latitude,
              longitude: longitude
            }
          }
        }
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    if (chunks.length > 0) return { chunks };
  } catch (error) {
    console.warn("Google Maps tool failed or model not found. Falling back to Search...", error);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `What are the nearest blood banks and hospitals to coordinates ${latitude.toFixed(4)}, ${longitude.toFixed(4)} in Tamil Nadu? List results.`,
      config: {
        systemInstruction: "Important: Strictly prioritize results in Tamil Nadu. Exclude Vinayagar Temple and Nandha Engineering College from results. Only list hospitals and blood donation centers.",
        tools: [{ googleSearch: {} }],
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { chunks };
  } catch (error) {
    console.error("All grounding tools failed:", error);
    return { chunks: [] };
  }
}

/**
 * searchBloodBanksByQuery - Unified Search for any location
 */
export async function searchBloodBanksByQuery(query: string): Promise<{ chunks: any[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a professional medical search for blood banks, hospitals, and donation centers in Tamil Nadu matching the query: "${query}". Focus on high-quality, verified facilities. List their names and locations.`,
      config: {
        systemInstruction: "Ensure search is restricted to the Tamil Nadu region. Exclude results related to Vinayagar Temple or Nandha Engineering College. Only show medical facilities.",
        tools: [{ googleSearch: {} }],
      },
    });

    return { chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (error) {
    console.error("Search query failed:", error);
    return { chunks: [] };
  }
}

export async function extractLicenseDetails(base64Image: string): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  if (!base64Image || typeof base64Image !== 'string') return null;
  
  try {
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: "Extract: full_name, sex, date_of_birth, license_number, address, expiry_date, institution_name as JSON. If it is an Aadhaar card, extract the name, sex (Male/Female/Other), DOB (YYYY-MM-DD), UID number as license_number, and the address.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            full_name: { type: Type.STRING },
            sex: { type: Type.STRING },
            date_of_birth: { type: Type.STRING },
            license_number: { type: Type.STRING },
            address: { type: Type.STRING },
            expiry_date: { type: Type.STRING },
            institution_name: { type: Type.STRING },
          }
        }
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("ID extraction failed:", error);
    return null;
  }
}

export async function verifyClinicalEligibility(formData: any): Promise<{ eligible: boolean; reason: string; advice: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Verify blood donation eligibility based on: ${JSON.stringify(formData)}. Return JSON with eligible (boolean), reason (string), advice (string).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eligible: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            advice: { type: Type.STRING }
          },
          required: ["eligible", "reason", "advice"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Eligibility verification failed:", error);
    return {
      eligible: false,
      reason: "Error in verification system.",
      advice: "Consult site medical officer."
    };
  }
}

/**
 * Generate Campaign Poster using Imagen 4.0 as indicated in the UI
 */
export async function generateCampaignPoster(prompt: string): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `Professional blood donation campaign poster: ${prompt}`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64EncodeString = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64EncodeString}`;
  } catch (error) {
    console.error("Poster generation failed:", error);
    return null;
  }
}

export function createAIChatSession(): Chat {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'You are the Red Connect Pro Chief Medical Officer. Provide precise, professional, and authoritative advice.',
    },
  });
}
