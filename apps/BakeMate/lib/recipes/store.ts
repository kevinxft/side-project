import * as FileSystem from "expo-file-system";
import { Recipe } from "./types";

export type RecipeStoreAdapter = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
};

export function createRecipeStore(adapter: RecipeStoreAdapter) {
  return {
    async loadAll(): Promise<Recipe[]> {
      const raw = await adapter.read();
      if (!raw) {
        return [];
      }
      return JSON.parse(raw) as Recipe[];
    },
    async saveAll(recipes: Recipe[]): Promise<void> {
      await adapter.write(JSON.stringify(recipes));
    },
  };
}

const STORE_PATH = `${FileSystem.documentDirectory}recipes.json`;

export const fileRecipeStore = createRecipeStore({
  read: async () => {
    try {
      return await FileSystem.readAsStringAsync(STORE_PATH);
    } catch {
      return null;
    }
  },
  write: async (value) => {
    await FileSystem.writeAsStringAsync(STORE_PATH, value);
  },
});
