import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createOcrClient } from "@/lib/ocr/client";
import { suggestFromOcr } from "@/lib/recipes/parse-ocr";
import { updateRecipe, upsertRecipe } from "@/lib/recipes/service";
import { fileRecipeStore } from "@/lib/recipes/store";
import { Recipe } from "@/lib/recipes/types";

type RecipesContextValue = {
  recipes: Recipe[];
  refresh: () => Promise<void>;
  createDraftFromPhoto: (photoUri: string) => Promise<string>;
  saveRecipe: (recipe: Recipe) => Promise<void>;
  patchRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
};

const RecipesContext = createContext<RecipesContextValue | null>(null);

export function RecipesProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const ocrClient = useMemo(() => createOcrClient(), []);
  const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const persist = useCallback(async (next: Recipe[]) => {
    setRecipes(next);
    await fileRecipeStore.saveAll(next);
  }, []);

  const refresh = useCallback(async () => {
    const loaded = await fileRecipeStore.loadAll();
    setRecipes(loaded);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createDraftFromPhoto = useCallback(
    async (photoUri: string) => {
      const now = new Date().toISOString();
      const draft: Recipe = {
        id: createId(),
        title: "",
        ingredientsText: "",
        stepsText: "",
        tags: [],
        sourcePhotoUri: photoUri,
        ocrText: "",
        status: "processing",
        createdAt: now,
        updatedAt: now,
      };

      const next = upsertRecipe(recipes, draft);
      await persist(next);

      try {
        const text = await ocrClient.requestOcr(photoUri);
        const suggestions = suggestFromOcr(text);
        const updated = updateRecipe(next, draft.id, {
          ocrText: text,
          title: suggestions.title,
          ingredientsText: suggestions.ingredientsText,
          stepsText: suggestions.stepsText,
          status: "ready",
          updatedAt: new Date().toISOString(),
        });
        await persist(updated);
      } catch {
        const updated = updateRecipe(next, draft.id, {
          status: "error",
          updatedAt: new Date().toISOString(),
        });
        await persist(updated);
      }

      return draft.id;
    },
    [ocrClient, persist, recipes]
  );

  const saveRecipe = useCallback(
    async (recipe: Recipe) => {
      const next = upsertRecipe(recipes, {
        ...recipe,
        updatedAt: new Date().toISOString(),
      });
      await persist(next);
    },
    [persist, recipes]
  );

  const patchRecipe = useCallback(
    async (id: string, updates: Partial<Recipe>) => {
      const next = updateRecipe(recipes, id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      await persist(next);
    },
    [persist, recipes]
  );

  const value = useMemo(
    () => ({ recipes, refresh, createDraftFromPhoto, saveRecipe, patchRecipe }),
    [createDraftFromPhoto, patchRecipe, recipes, refresh, saveRecipe]
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

export function useRecipes() {
  const context = useContext(RecipesContext);
  if (!context) {
    throw new Error("useRecipes must be used within RecipesProvider");
  }
  return context;
}
