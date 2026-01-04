import { NinjaElement } from "./types";

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

export const ENVIRONMENT_COLORS = {
  // Darker "Night Mode" palettes
  FOREST: { sky: '#022c22', ground: '#14532d', accent: '#15803d' }, // Deep Green Night
  VOLCANO: { sky: '#450a0a', ground: '#7f1d1d', accent: '#991b1b' }, // Dark Red/Ash
  ICE: { sky: '#082f49', ground: '#0369a1', accent: '#38bdf8' }, // Deep Blue Night
  DOJO: { sky: '#111827', ground: '#374151', accent: '#6b7280' }, // Dark Grey Night
};

export const PLAYER_SIZE = 40; // Pixels