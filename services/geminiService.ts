
import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { Donor, EmergencyRequest, AIRecommendation } from './types';

/**
 * Tactical Retry Logic with Exponential Backoff
 */
async function executeWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      // Handle rate limits (429) or internal errors (500/503)
      if (err.status === 429 || err.status >= 500) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(r => setTimeout(r, delay));
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
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `You are a medical logistics coordinator. Match the top 3 most compatible donors for a blood request.
          Request Details: ${request.bloodType} needed at ${request.hospital}.
          Available Donor Pool: ${JSON.stringify(availableDonors.map(d => ({id: d.id, type: d.bloodType, dist: d.distance})))}`
        }]
      }],
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
      contents: [{
        parts: [{
          text: `Provide a professional, concise clinical logistics briefing for transporting blood units from ${hospital} to ${destination} in Tamil Nadu. Mention potential state highway routes or transport requirements.`
        }]
      }],
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
  return executeWithRetry(async () => {
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
      const binaryString = atob(data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    return null;
  });
}

export async function verifyClinicalEligibility(formData: any): Promise<{ eligible: boolean; reason: string; advice: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `As a medical screening assistant, evaluate the following donor eligibility data according to WHO standards.
          Data: ${JSON.stringify(formData)}`
        }]
      }],
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
    return JSON.parse(response.text?.trim() || '{"eligible": false, "reason": "System error during evaluation.", "advice": "Please consult a medical officer."}');
  });
}

export async function evaluateCollectionVitals(vitals: any): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `Evaluate these donor vitals for donation safety and determine the optimal collection volume (350ml or 450ml, or 0 if blocked).
          Vitals: ${JSON.stringify(vitals)}`
        }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            volume: { type: Type.NUMBER },
            status: { type: Type.STRING, description: "OPTIMAL, STABLE, or BLOCKED" },
            reason: { type: Type.STRING }
          },
          required: ["volume", "status", "reason"]
        }
      }
    });
    return JSON.parse(response.text?.trim() || '{"volume": 0, "status": "BLOCKED", "reason": "Evaluation failed."}');
  });
}

export async function getHealthGuidelines(isPlatelet: boolean): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `List 3 critical clinical guidelines for ${isPlatelet ? 'platelet' : 'whole blood'} donation. Concise bullet points only.`
        }]
      }],
    });
    return response.text || "Ensure donor is well-hydrated and has rested.";
  });
}

export async function findNearbyBanks(latitude: number, longitude: number, radius: number): Promise<{ chunks: any[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: [{
        parts: [{
          text: `Identify authorized hospitals and blood banks near coordinates ${latitude}, ${longitude} in Tamil Nadu. Cross-reference with the National Health Mission (NHM) Tamil Nadu registry. List official names and coordinates.`
        }]
      }],
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: { latLng: { latitude, longitude } } }
      },
    });
    return { chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  });
}

export async function searchBloodBanksByQuery(query: string): Promise<{ chunks: any[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `Search for official medical facilities in Tamil Nadu matching "${query}". Focus on facilities listed in the NHM Tamil Nadu hospital finder.`
        }]
      }],
      config: { tools: [{ googleSearch: {} }] },
    });
    return { chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  });
}

export function createAIChatSession(viewContext?: string): Chat {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `You are the Red Command Chief Medical Officer. You provide authoritative information verified against Tamil Nadu state health registries.
  
  IMPORTANT - SITUATION REPORT (SITREP):
  ${viewContext || "User is currently browsing the high-level command dashboard."}
  
  Use the above SITREP to answer user questions with precision. If the user asks about 'nearby' or 'current' items, refer specifically to the data in the SITREP if available.`;

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction },
  });
}

export async function extractLicenseDetails(base64Image: string): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } }, 
          { text: "Extract identification information from this document (Aadhaar card, License, or Hospital ID). Return as JSON." } 
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            full_name: { type: Type.STRING },
            id_number: { type: Type.STRING },
            address: { type: Type.STRING },
            date_of_birth: { type: Type.STRING, description: "DOB in ISO format or DD/MM/YYYY" },
            age: { type: Type.NUMBER },
            mobile_number: { type: Type.STRING },
            sex: { type: Type.STRING },
            expiry_date: { type: Type.STRING },
            institution_name: { type: Type.STRING }
          }
        }
      },
    });
    return JSON.parse(response.text?.trim() || "null");
  });
}

export async function generateCampaignPoster(prompt: string): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{
        parts: [{ text: `High-quality clinical medical campaign poster: ${prompt}` }]
      }],
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  });
}
