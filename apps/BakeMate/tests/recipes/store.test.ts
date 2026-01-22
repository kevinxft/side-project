import { createMemoryAdapter } from "../../lib/recipes/store-memory";
import { createRecipeStore } from "../../lib/recipes/store";

const recipe = {
  id: "1",
  title: "Test",
  ingredientsText: "Sugar",
  stepsText: "Mix",
  tags: ["dessert"],
  status: "ready",
  createdAt: "2026-01-22T00:00:00.000Z",
  updatedAt: "2026-01-22T00:00:00.000Z",
};

it("persists and loads recipes", async () => {
  const store = createRecipeStore(createMemoryAdapter());
  await store.saveAll([recipe]);
  await expect(store.loadAll()).resolves.toEqual([recipe]);
});
