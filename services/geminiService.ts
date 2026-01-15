import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { Donor, EmergencyRequest, AIRecommendation } from './types';

/**
 * Professional Clinical Matchmaking with Thinking Budget
 */
export async function matchDonors(request: EmergencyRequest, availableDonors: Donor[]): Promise<AIRecommendation[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Analyze this emergency blood request and suggest the top 3 matches.
        Request: ${JSON.stringify(request)}
        Available Donors: ${JSON.stringify(availableDonors)}
        
        CRITICAL THINKING TASK:
        1. Evaluate HLA compatibility risks if platelet request.
        2. Prioritize universal donors (O-) for critical cases.
        3. Consider geographical latency and traffic.
        4. Check donor recovery cycles.
        
        Return a JSON array of recommendations.
      `,
      config: {
        thinkingConfig: { thinkingBudget: 16000 },
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
      // Manual decoding implementation following API examples
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

/**
 * Imagen 4.0 for Professional Institutional Campaigns
 */
export async function generateCampaignPoster(prompt: string): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A professional, high-impact medical donation campaign poster: ${prompt}. Minimalist, corporate healthcare aesthetic, high contrast, 4K.`,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
      },
    });

    const base64 = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("Image generation failed:", error);
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
 * findNearbyBanks with robust grounding fallback.
 * Uses gemini-flash-lite-latest for Maps as required by guidelines.
 */
export async function findNearbyBanks(latitude: number, longitude: number, radius: number): Promise<{ chunks: any[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Try Maps Grounding (Mandatory: use Gemini 2.5 series)
  try {
    const response = await ai.models.generateContent({
      // Updated model alias as per naming guidelines
      model: 'gemini-flash-lite-latest', 
      contents: `Find blood banks and hospitals near lat ${latitude.toFixed(4)}, lng ${longitude.toFixed(4)} within ${radius}km.`,
      config: {
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
    console.warn("Google Maps tool failed or disabled. Falling back to Google Search grounding...", error);
  }

  // Fallback: Google Search Grounding using Gemini 3 series
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `What are the nearest blood banks and hospitals to coordinates ${latitude.toFixed(4)}, ${longitude.toFixed(4)}? List at least 5 results.`,
      config: {
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

export async function extractLicenseDetails(base64Image: string): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: "Extract: full_name, license_number, address, expiry_date, institution_name as JSON.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            full_name: { type: Type.STRING },
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
      model: 'gemini-3-pro-preview',
      contents: `Verify blood donation eligibility: ${JSON.stringify(formData)}. Return JSON with eligible, reason, advice.`,
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

export function createAIChatSession(): Chat {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: 'You are the Red Connect Pro Chief Medical Officer. Provide precise, professional, and authoritative advice.',
    },
  });
}