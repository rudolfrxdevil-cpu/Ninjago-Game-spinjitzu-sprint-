import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MissionData, Realm } from "../types";

export const generateMission = async (ninjaName: string, element: string, realm?: Realm): Promise<MissionData> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing, using offline fallback");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      missionTitle: realm ? `Journey to ${realm}` : "Offline Dojo",
      introText: realm ? `The portal to ${realm} is open. Watch out for enemies!` : "The Spirit Realm is quiet today.",
      environmentType: realm || "DOJO",
      difficulty: realm ? 6 : 3,
      obstacleTheme: realm ? "Realm Defenders" : "Training Dummies"
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const missionSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      missionTitle: { type: Type.STRING, description: "A cool Ninjago-style mission name." },
      introText: { type: Type.STRING, description: "A brief 2-sentence briefing from Master Wu." },
      // Note: We don't ask AI for environmentType if a realm is set, we force it.
      difficulty: { type: Type.INTEGER, description: "Difficulty level from 1 (easy) to 10 (hard)." },
      obstacleTheme: { type: Type.STRING, description: "A short description of what enemies appear." }
    },
    required: ["missionTitle", "introText", "difficulty", "obstacleTheme"]
  };

  let prompt = `
    You are Master Wu from Lego Ninjago. 
    I am a ninja named ${ninjaName} with the element of ${element}.
  `;

  if (realm) {
    prompt += `
      I am traveling to the realm: ${realm}.
      Generate a story mission for me in this realm.
      The enemies should be specific to this realm (e.g. Ghosts for Cursed Realm, Sky Pirates for Djinjago).
    `;
  } else {
    prompt += `
      Generate a general training mission for me.
      The mission should fit my element if possible.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: missionSchema,
        systemInstruction: "You are the wise Master Wu. Speak with wisdom."
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Force the environment type to match the realm if provided, otherwise default or use what AI suggests (if we added it back to schema)
      // Since we removed environmentType from schema to enforce realm, we add it here.
      return {
        ...data,
        environmentType: realm || "DOJO" 
      } as MissionData;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini Mission Generation Error:", error);
    return {
      missionTitle: realm ? `Escape from ${realm}` : "The Lost Scroll",
      introText: "The API connection is severed, but the training must continue. Run fast, Ninja!",
      environmentType: realm || "DOJO",
      difficulty: 5,
      obstacleTheme: "Unknown Shadows"
    };
  }
};