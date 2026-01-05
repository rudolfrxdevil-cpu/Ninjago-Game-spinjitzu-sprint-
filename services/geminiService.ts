import { MissionData, Realm } from "../types";

// We remove the static import to prevent crashing if the module cannot be loaded from the CDN.
// import { GoogleGenAI, Type, Schema } from "@google/genai"; 

export const generateMission = async (ninjaName: string, element: string, realm?: Realm): Promise<MissionData> => {
  // Check for API Key. If missing, immediately return offline data without trying to load SDK.
  const hasKey = process.env.API_KEY && process.env.API_KEY.length > 0;
  
  // Check if SDK loaded successfully in index.html
  const GenAIClass = (window as any).GoogleGenAI;

  if (!hasKey || !GenAIClass) {
    console.log("Running in OFFLINE MODE (No API Key or SDK).");
    // Simulate a short loading delay for effect
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // OFFLINE FALLBACK DATA
    return {
      missionTitle: realm ? `Journey to ${realm}` : "Offline Dojo Training",
      introText: realm 
        ? `The portal to ${realm} is open! The API is offline, so you must rely on your instincts.` 
        : "The internet connection is severed. Train hard in the dojo!",
      environmentType: realm || "DOJO",
      difficulty: realm ? 5 : 2,
      obstacleTheme: realm ? "Realm Defenders" : "Training Dummies"
    };
  }

  // If we are here, we have a Key and the SDK.
  try {
    const ai = new GenAIClass({ apiKey: process.env.API_KEY });
    const TypeEnum = (window as any).SchemaType;

    const missionSchema = {
      type: TypeEnum.OBJECT,
      properties: {
        missionTitle: { type: TypeEnum.STRING, description: "A cool Ninjago-style mission name." },
        introText: { type: TypeEnum.STRING, description: "A brief 2-sentence briefing from Master Wu." },
        difficulty: { type: TypeEnum.INTEGER, description: "Difficulty level from 1 (easy) to 10 (hard)." },
        obstacleTheme: { type: TypeEnum.STRING, description: "A short description of what enemies appear." }
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
      return {
        ...data,
        environmentType: realm || "DOJO" 
      } as MissionData;
    }
    throw new Error("No response text generated");

  } catch (error) {
    console.error("Gemini Mission Generation Error:", error);
    // Silent fallback on API error
    return {
      missionTitle: realm ? `Escape from ${realm}` : "The Lost Scroll",
      introText: "The API connection is severed, but the training must continue. Run fast, Ninja!",
      environmentType: realm || "DOJO",
      difficulty: 5,
      obstacleTheme: "Unknown Shadows"
    };
  }
};