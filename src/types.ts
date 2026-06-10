export type FishType = 'normal' | 'fast' | 'big' | 'golden' | 'puffer' | 'jelly';

export interface Fish {
  id: string;
  type: FishType;
  name: string;
  emoji: string;
  color: string; // Tailwind color classes or hex
  points: number;
  speed: number; // Speed multiplier
  swimPatter: 'linear' | 'wave' | 'jerk'; // Swim trajectory
  direction: 'L2R' | 'R2L';
  x: number; // Horizontal position in percentage (0 to 100)
  y: number; // Vertical position in percentage (10 to 90)
  width: number; // Visual width in pixels
  height: number; // Visual height in pixels
  isCaught: boolean;
  isEscaped: boolean;
  clicksRequired: number;
  clicksRemaining: number;
  phase: number; // For wave motion calculation
  scale: number; // Scale animation factor
  isInflated?: boolean; // specifically for pufferfish
  pufferState?: 'normal' | 'inflating' | 'puffed' | 'deflating';
  pufferTimer?: number;
}

export interface CaughtEffect {
  id: string;
  x: number; // Absolute pixel or percentage
  y: number;
  points: number;
  emoji: string;
  label: string;
}

export interface NetSplash {
  id: string;
  x: number;
  y: number;
  size: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  caughtCount: Record<FishType, number>;
  totalCaught: number;
  maxCombo: number;
  pufferExplodes: number;
  jellyShocks: number;
}

export type Difficulty = 'easy' | 'normal' | 'hard';
export type GameState = 'start' | 'playing' | 'paused' | 'gameover';
