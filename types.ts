export enum GameState {
  START_MENU = 'START_MENU',
  TRAINING_SETUP = 'TRAINING_SETUP', // Formerly MENU
  REALM_SELECT = 'REALM_SELECT',
  STORY_MODE = 'STORY_MODE',
  LOADING_MISSION = 'LOADING_MISSION',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum NinjaElement {
  FIRE = 'FIRE',
  LIGHTNING = 'LIGHTNING',
  ICE = 'ICE',
  EARTH = 'EARTH',
  ENERGY = 'ENERGY'
}

export enum Realm {
  NINJAGO = 'Ninjago',
  CURSED_REALM = 'The Cursed Realm', // Die verfluchte Welt
  FIRST_REALM = 'The First Realm',
  DJINJAGO = 'Djinjago',
  CLOUD_KINGDOM = 'The Cloud Kingdom' // Das Wolkenkönigreich
}

export interface MissionData {
  missionTitle: string;
  introText: string;
  environmentType: string; // Now can be a Realm key too
  difficulty: number; // 1-10
  obstacleTheme: string; // Description for flavor
}

export interface PlayerState {
  x: number;
  y: number;
  z: number; // Height off ground
  vx: number;
  vy: number;
  vz: number; // Vertical velocity (jump)
  width: number;
  height: number;
  isGrounded: boolean;
  element: NinjaElement;
  rotation: number; // For spinjitzu effect
  facing: 1 | -1; // 1 right, -1 left
  invulnerable: number; // Frames of invulnerability
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'GROUND' | 'FLOATING';
}

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'SPIKE' | 'BLOCK' | 'ENEMY';
  speed: number;
  patrolCenter?: number; // For story mode enemy AI
  direction?: 1 | -1;
  health?: number;
  // For top-down tracking
  targetX?: number; 
  targetY?: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  color: string;
}