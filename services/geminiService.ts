
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types";

// Initializing the Google GenAI client using process.env.API_KEY directly as per guidelines
const createAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const SYSTEM_INSTRUCTION = `You are the AI Engine for the "NEXUS Smart Issue Reporter" app. 
Your goal is to act as an automated dispatcher. When a student provides a description of a campus problem (broken lights, water leaks, etc.), you must analyze the data and provide a structured technical report.

ANALYSIS CRITERIA:
1. Issue Identification: Precisely name the problem.
2. Department Routing: Categorize the issue into (Maintenance, Electrical, Plumbing, Security, or Custodial).
3. Severity Score: Rate from 1 (Low) to 5 (Critical).
4. Urgency Logic: If severity is 4 or 5, set 'requires_immediate_action' to true.
5. Location Context: Extract location details from the description if provided.

You MUST respond ONLY in valid JSON format.`;

export const analyzeIssue = async (base64Image: string): Promise<GeminiResponse> => {
  const ai = createAIClient();
  const model = 'gemini-3-flash-preview';

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        { text: "Analyze this campus issue and provide the technical report in JSON format." }
      ],
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          issue_detected: { type: Type.STRING },
          category: { 
            type: Type.STRING,
            enum: ['Maintenance', 'Electrical', 'Plumbing', 'Security', 'Custodial']
          },
          severity_level: { type: Type.INTEGER },
          action_required: { type: Type.STRING },
          requires_immediate_action: { type: Type.BOOLEAN },
          safety_warning_for_student: { type: Type.STRING }
        },
        required: [
          'issue_detected', 
          'category', 
          'severity_level', 
          'action_required', 
          'requires_immediate_action', 
          'safety_warning_for_student'
        ]
      }
    },
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return data as GeminiResponse;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Invalid response format from AI engine.");
  }
};

export const analyzeIssueText = async (description: string): Promise<GeminiResponse> => {
  const ai = createAIClient();
  const model = 'gemini-3-flash-preview';

  const response = await ai.models.generateContent({
    model,
    contents: `Analyze this campus issue description and provide a technical report: "${description}"`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          issue_detected: { type: Type.STRING },
          category: { 
            type: Type.STRING,
            enum: ['Maintenance', 'Electrical', 'Plumbing', 'Security', 'Custodial']
          },
          severity_level: { type: Type.INTEGER },
          action_required: { type: Type.STRING },
          requires_immediate_action: { type: Type.BOOLEAN },
          safety_warning_for_student: { type: Type.STRING }
        },
        required: [
          'issue_detected', 
          'category', 
          'severity_level', 
          'action_required', 
          'requires_immediate_action', 
          'safety_warning_for_student'
        ]
      }
    },
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return data as GeminiResponse;
  } catch (error) {
    throw new Error("Voice analysis failure.");
  }
};

export const suggestPollOptions = async (topic: string): Promise<string[]> => {
  const ai = createAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest 3-4 catchy and distinct poll options for a campus survey about: ${topic}. Respond ONLY with a JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return ["Option 1", "Option 2", "Option 3"];
  }
};

export const verifyCollegeContent = async (caption: string, base64Data?: string, mimeType: string = 'image/jpeg'): Promise<boolean> => {
  const ai = createAIClient();
  const model = 'gemini-3-flash-preview';
  
  const prompt = `You are a strict campus content moderator for "Campus Vibe". 
  Evaluate if the content is related to college life, specifically:
  - Sports events (football, cricket, etc.)
  - Tech Fests, Hackathons, or Seminars
  - Cultural Fests or Concerts
  - Academic life (Classes, Labs, Library)
  - Campus Tours or Landmarks
  
  If the content is unrelated (random memes, personal non-campus photos, off-campus street food with no context, or general internet content), you must block it.
  
  Respond ONLY with a JSON object { "isRelated": boolean, "reason": "short explanation" }.
  Caption: "${caption}"`;

  const contentParts: any[] = [{ text: prompt }];
  
  if (base64Data) {
    contentParts.unshift({
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      }
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts: contentParts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isRelated: { type: Type.BOOLEAN },
          reason: { type: Type.STRING }
        },
        required: ['isRelated', 'reason']
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{"isRelated": false}');
    return data.isRelated;
  } catch (e) {
    return false;
  }
};
