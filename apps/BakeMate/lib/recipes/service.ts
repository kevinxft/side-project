import { dedupeTags } from "./tags";
import { Recipe } from "./types";

export function upsertRecipe(recipes: Recipe[], recipe: Recipe): Recipe[] {
  const existing = recipes.find((item) => item.id === recipe.id);
  if (!existing) {
    return [...recipes, recipe];
  }
  return recipes.map((item) => (item.id === recipe.id ? recipe : item));
}

export function updateRecipe(
  recipes: Recipe[],
  id: string,
  updates: Partial<Recipe>
): Recipe[] {
  return recipes.map((item) => {
    if (item.id !== id) {
      return item;
    }
    const tags = updates.tags ? dedupeTags(updates.tags) : item.tags;
    return {
      ...item,
      ...updates,
      tags,
    };
  });
}
