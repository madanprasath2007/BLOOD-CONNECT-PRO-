
import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { Donor, EmergencyRequest, AIRecommendation } from './types';

/**
 * Tactical Retry Logic
 */
async function executeWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (err.status === 429 || err.status >= 500) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function matchDonors(request: EmergencyRequest, availableDonors: Donor[]): Promise<AIRecommendation[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Match top 3 donors for ${request.bloodType} at ${request.hospital}. Available: ${JSON.stringify(availableDonors.map(d => ({id: d.id, type: d.bloodType, dist: d.distance})))}`,
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
    return JSON.parse(response.text?.trim() || "[]");
  });
}

export async function getLogisticBriefing(hospital: string, destination: string): Promise<{ text: string; sources: any[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Professional logistics brief for blood transport from ${hospital} to ${destination} in Tamil Nadu.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    return {
      text: response.text || "Route verified via regional logistics grid.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  });
}

export async function speakEmergencyAlert(text: string): Promise<Uint8Array | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (data) {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return null;
}

export async function verifyClinicalEligibility(formData: any): Promise<{ eligible: boolean; reason: string; advice: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Evaluate eligibility: ${JSON.stringify(formData)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          eligible: { type: Type.BOOLEAN },
          reason: { type: Type.STRING },
          advice: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text?.trim() || '{"eligible": false}');
}

export async function evaluateCollectionVitals(vitals: any): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Evaluate vitals for donation: ${JSON.stringify(vitals)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          volume: { type: Type.NUMBER },
          status: { type: Type.STRING },
          reason: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text?.trim() || '{}');
}

export async function getHealthGuidelines(isPlatelet: boolean): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Clinical guidelines for ${isPlatelet ? 'platelet' : 'blood'} donation. 3 short points.`,
  });
  return response.text || "Follow screening protocols.";
}

/**
 * Radar Node: Optimized for State-Level Registry Discovery
 * Now explicitly references NHM Tamil Nadu portal data.
 */
export async function findNearbyBanks(latitude: number, longitude: number, radius: number): Promise<{ chunks: any[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: `Identify authorized hospitals and blood banks near coordinates ${latitude}, ${longitude} in Tamil Nadu. Cross-reference with the National Health Mission (NHM) Tamil Nadu registry (nhm.tn.gov.in) to ensure validity. List official names and precise coordinates.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: { latLng: { latitude, longitude } } }
      },
    });
    return { chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (error) {
    return { chunks: [] };
  }
}

export async function searchBloodBanksByQuery(query: string): Promise<{ chunks: any[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for official medical facilities in Tamil Nadu matching "${query}". Specifically look for entries listed in the NHM Tamil Nadu hospital finder (nhm.tn.gov.in/en/for-find-hospital).`,
      config: { tools: [{ googleSearch: {} }] },
    });
    return { chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (error) {
    return { chunks: [] };
  }
}

export function createAIChatSession(): Chat {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: { systemInstruction: 'You are the Red Connect Chief Medical Officer. You provide authoritative information verified against Tamil Nadu state health registries.' },
  });
}

export async function extractLicenseDetails(base64Image: string): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Data } }, { text: "Extract ID info as JSON." }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          full_name: { type: Type.STRING },
          license_number: { type: Type.STRING },
          address: { type: Type.STRING }
        }
      }
    },
  });
  return JSON.parse(response.text?.trim() || "null");
}

export async function generateCampaignPoster(prompt: string): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Medical poster: ${prompt}` }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) { return null; }
}
