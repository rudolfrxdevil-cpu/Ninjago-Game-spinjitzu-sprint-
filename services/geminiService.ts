import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MissionData } from "../types";

export const generateMission = async (ninjaName: string, element: string): Promise<MissionData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const missionSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      missionTitle: { type: Type.STRING, description: "A cool Ninjago-style mission name." },
      introText: { type: Type.STRING, description: "A brief 2-sentence briefing from Master Wu." },
      environmentType: { 
        type: Type.STRING, 
        enum: ["FOREST", "VOLCANO", "ICE", "DOJO"],
        description: "The setting of the mission."
      },
      difficulty: { type: Type.INTEGER, description: "Difficulty level from 1 (easy) to 10 (hard)." },
      obstacleTheme: { type: Type.STRING, description: "A short description of what enemies appear (e.g., 'Serpentine Warriors')." }
    },
    required: ["missionTitle", "introText", "environmentType", "difficulty", "obstacleTheme"]
  };

  const prompt = `
    You are Master Wu from Lego Ninjago. 
    I am a ninja named ${ninjaName} with the element of ${element}.
    Generate a training mission for me.
    The mission should fit my element if possible.
  `;

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
      return JSON.parse(response.text) as MissionData;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini Mission Generation Error:", error);
    // Fallback mission if API fails
    return {
      missionTitle: "The Lost Scroll",
      introText: "The API connection is severed, but the training must continue. Run fast, Ninja!",
      environmentType: "DOJO",
      difficulty: 5,
      obstacleTheme: "Training Dummies"
    };
  }
};
