import { NinjaElement, Realm } from "./types";

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;
export const GROUND_HEIGHT = 50;

export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;
export const MOVE_SPEED_BASE = 5;

export const ELEMENT_COLORS: Record<NinjaElement, string> = {
  [NinjaElement.FIRE]: '#EF4444', // Red
  [NinjaElement.LIGHTNING]: '#3B82F6', // Blue
  [NinjaElement.ICE]: '#FFFFFF', // White
  [NinjaElement.EARTH]: '#1F2937', // Dark Grey/Black
  [NinjaElement.ENERGY]: '#10B981', // Green
};

export const ENVIRONMENT_COLORS: Record<string, { sky: string, ground: string, accent: string }> = {
  // Original Modes
  FOREST: { sky: '#022c22', ground: '#14532d', accent: '#15803d' }, 
  VOLCANO: { sky: '#450a0a', ground: '#7f1d1d', accent: '#991b1b' }, 
  ICE: { sky: '#082f49', ground: '#0369a1', accent: '#38bdf8' }, 
  DOJO: { sky: '#111827', ground: '#374151', accent: '#6b7280' }, 

  // Story Mode Realms
  [Realm.NINJAGO]: { sky: '#2563eb', ground: '#16a34a', accent: '#facc15' }, // Bright Day
  [Realm.CURSED_REALM]: { sky: '#020617', ground: '#064e3b', accent: '#34d399' }, // Spooky Green/Black
  [Realm.FIRST_REALM]: { sky: '#78350f', ground: '#451a03', accent: '#d97706' }, // Rocky/Dragon
  [Realm.DJINJAGO]: { sky: '#c2410c', ground: '#7c2d12', accent: '#fdba74' }, // Orange Sky/Pirate
  [Realm.CLOUD_KINGDOM]: { sky: '#e0f2fe', ground: '#f0f9ff', accent: '#eab308' }, // White/Gold
};

export const REALM_INFO: Record<Realm, { description: string, enemies: string }> = {
  [Realm.NINJAGO]: { description: "Protect Ninjago City from everyday threats.", enemies: "Serpentine" },
  [Realm.CURSED_REALM]: { description: "Die verfluchte Welt. Beware of Ghosts.", enemies: "Ghosts & Morro" },
  [Realm.FIRST_REALM]: { description: "The land of Oni and Dragons.", enemies: "Dragon Hunters" },
  [Realm.DJINJAGO]: { description: "Home of the Djinn.", enemies: "Sky Pirates" },
  [Realm.CLOUD_KINGDOM]: { description: "Das Wolkenkönigreich. Where destiny is written.", enemies: "Corrupt Monks" }
};

export const PLAYER_SIZE = 40; // Pixels