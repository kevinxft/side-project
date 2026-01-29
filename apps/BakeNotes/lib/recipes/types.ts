export const RECIPE_SCHEMA_VERSION = 2 as const;

export type RecipeSchemaVersion = typeof RECIPE_SCHEMA_VERSION;

export type ISODateString = string;

export type BakeStageType = 'preheat' | 'bake' | 'rest' | 'other';

export interface BaseEntity {
  id: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  schemaVersion: RecipeSchemaVersion;
}

export interface Ingredient {
  name: string;
  grams: number | null;
  note: string;
}

export interface BakeStage {
  type: BakeStageType;
  topC: number | null;
  bottomC: number | null;
  minutes: number | null;
  mode: string;
  note: string;
}

export interface BakeSetting {
  stages: BakeStage[];
  notes: string;
}

export interface Recipe extends BaseEntity {
  title: string;
  ingredients: Ingredient[];
  bake: BakeSetting | null;
  steps: string[];
  notes: string;
}
