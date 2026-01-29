import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  type BakeSetting,
  type BaseEntity,
  type Ingredient,
  type IngredientUnit,
  RECIPE_SCHEMA_VERSION,
  type Recipe,
  type RecipeSchemaVersion,
} from './types';

export type RecipeInput = {
  title: string;
  ingredients?: Ingredient[];
  bake?: BakeSetting | null;
  steps?: string[];
  notes?: string;
};

export type RecipeUpdate = Partial<RecipeInput>;

type RecipeStoreState = {
  recipes: Recipe[];
  schemaVersion: RecipeSchemaVersion;
  createRecipe: (input: RecipeInput) => Recipe;
  updateRecipe: (id: string, patch: RecipeUpdate) => Recipe | null;
  deleteRecipe: (id: string) => void;
  getRecipeById: (id: string) => Recipe | undefined;
  setRecipes: (recipes: Recipe[]) => void;
};

const createRecipeId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
};

  const normalizeRecipeInput = (input: RecipeInput): Omit<Recipe, keyof BaseEntity> => ({
  title: input.title,
  ingredients: input.ingredients ?? [],
  bake: input.bake ?? null,
  steps: input.steps ?? [],
  notes: input.notes ?? '',
});

export const useRecipeStore = create<RecipeStoreState>()(
  persist(
    (set, get) => ({
      recipes: [],
      schemaVersion: RECIPE_SCHEMA_VERSION,
      createRecipe: (input) => {
        const now = new Date().toISOString();
        const recipe: Recipe = {
          id: createRecipeId(),
          createdAt: now,
          updatedAt: now,
          schemaVersion: RECIPE_SCHEMA_VERSION,
          ...normalizeRecipeInput(input),
        };

        set((state) => ({
          recipes: [recipe, ...state.recipes],
        }));

        return recipe;
      },
      updateRecipe: (id, patch) => {
        let updated: Recipe | null = null;

        set((state) => {
          const recipes = state.recipes.map((recipe) => {
            if (recipe.id !== id) return recipe;

            const next: Recipe = {
              ...recipe,
              ...normalizeRecipeInput({
                title: patch.title ?? recipe.title,
                ingredients: patch.ingredients ?? recipe.ingredients,
                bake: patch.bake ?? recipe.bake,
                steps: patch.steps ?? recipe.steps,
                notes: patch.notes ?? recipe.notes,
              }),
              updatedAt: new Date().toISOString(),
            };

            updated = next;
            return next;
          });

          return { recipes };
        });

        return updated;
      },
      deleteRecipe: (id) => {
        set((state) => ({
          recipes: state.recipes.filter((recipe) => recipe.id !== id),
        }));
      },
      getRecipeById: (id) => get().recipes.find((recipe) => recipe.id === id),
      setRecipes: (recipes) => set({ recipes }),
    }),
    {
      name: 'bakenotes-recipes',
      version: RECIPE_SCHEMA_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        recipes: state.recipes,
        schemaVersion: state.schemaVersion,
      }),
      migrate: (persistedState, version) => {
        if (!persistedState) {
          return { recipes: [], schemaVersion: RECIPE_SCHEMA_VERSION };
        }

        const state = persistedState as {
          recipes?: Array<
            Recipe & {
              tips?: string[];
              ingredients?: Array<Ingredient & { grams?: number | null }>;
            }
          >;
          schemaVersion?: number;
        };

        let recipes = state.recipes ?? [];

        if (version < 2) {
          recipes = recipes.map((recipe) => {
            const tips = recipe.tips ?? [];
            const tipsText =
              tips.length > 0
                ? `要点：\n${tips.map((tip) => `- ${tip}`).join('\n')}`
                : '';
            const notes = [recipe.notes?.trim(), tipsText].filter(Boolean).join('\n\n');

            const { tips: _ignored, ...rest } = recipe;
            return {
              ...rest,
              notes,
            };
          });
        }

        if (version < 3) {
          recipes = recipes.map((recipe) => ({
            ...recipe,
            ingredients: (recipe.ingredients ?? []).map((ingredient) => ({
              name: ingredient.name ?? '',
              amount:
                typeof ingredient.amount === 'number' || ingredient.amount === null
                  ? ingredient.amount
                  : typeof ingredient.grams === 'number'
                    ? ingredient.grams
                    : null,
              unit: (ingredient.unit as IngredientUnit | undefined) ?? 'g',
              note: ingredient.note ?? '',
            })),
          }));
        }

        return {
          recipes: recipes.map((recipe) => ({
            ...recipe,
            schemaVersion: RECIPE_SCHEMA_VERSION,
          })),
          schemaVersion: RECIPE_SCHEMA_VERSION,
        };
      },
    }
  )
);
