/** Shapes of the JSON config in src/data/. Kept separate so pure logic stays free of Three.js. */

export type Quality = "low" | "medium" | "high";

export interface WorldConfig {
  seed: number;
  islandRadius: number;
  worldLimit: number;
  waterY: number;
  chunkSize: number;
  cellsPerChunk: Record<Quality, number>;
  viewRadiusChunks: Record<Quality, number>;
  fog: { near: number; far: Record<Quality, number> };
  regionBlendWidth: number;
  regionWarp: { frequency: number; amount: number };
  propsPerChunk: number;
  cloudCount: number;
  paper: string;
  ink: string;
  spawn: { x: number; y: number; z: number; faceTowards: string };
}

export interface RegionDef {
  id: string;
  name: string;
  center: [number, number];
  terrain: { base: number; amp: number; ridged: number; freq: number };
  colors: { low: string; mid: string; high: string; accent: string };
  /** Patchwork field colours painted over gentle mid-height ground. */
  fields: string[];
  sky: string;
  prop: PropKind;
  propDensity: number;
}

export type PropKind = "roundTree" | "snowPine" | "lavaRock" | "deadTree" | "neonBlock" | "palm";

export type LandmarkKind =
  | "house" | "tower" | "windmill" | "arch" | "statue" | "shrine"
  | "lighthouse" | "ruins" | "gym" | "spire" | "neon";

export interface LandmarkCard {
  title: string;
  subtitle: string;
  body: string;
  link?: string;
  linkLabel?: string;
}

export interface LandmarkDef {
  id: string;
  name: string;
  region: string;
  kind: LandmarkKind;
  pos: [number, number];
  scale: number;
  line: string;
  pawan?: boolean;
  project?: boolean;
  island?: boolean;
  card?: LandmarkCard;
}

/** Result of sampling the region field: the dominant region, its neighbour and the blend between them. */
export interface RegionSample {
  primary: number;
  secondary: number;
  /** 0 = pure primary, 0.5 = exactly on the border. */
  t: number;
}
