import { updateRecipe, upsertRecipe } from "../../lib/recipes/service";

const base = {
  id: "1",
  title: "Test",
  ingredientsText: "Sugar",
  stepsText: "Mix",
  tags: ["dessert"],
  status: "ready",
  createdAt: "2026-01-22T00:00:00.000Z",
  updatedAt: "2026-01-22T00:00:00.000Z",
};

it("upserts recipes", () => {
  const updated = upsertRecipe([], base);
  expect(updated).toHaveLength(1);
});

it("updates recipe fields", () => {
  const updated = updateRecipe([base], "1", { title: "New" });
  expect(updated[0].title).toBe("New");
});
