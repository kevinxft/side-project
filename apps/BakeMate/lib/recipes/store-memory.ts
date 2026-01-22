import { RecipeStoreAdapter } from "./store";

export function createMemoryAdapter(): RecipeStoreAdapter {
  let data: string | null = null;

  return {
    read: async () => data,
    write: async (value) => {
      data = value;
    },
  };
}
