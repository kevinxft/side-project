import { suggestFromOcr } from "../../lib/recipes/parse-ocr";

it("extracts title, ingredients, and steps", () => {
  const text = [
    "Best Pancakes",
    "Ingredients",
    "2 cups flour",
    "1 cup milk",
    "Instructions",
    "Mix",
    "Cook",
  ].join("\n");

  const result = suggestFromOcr(text);

  expect(result.title).toBe("Best Pancakes");
  expect(result.ingredientsText).toBe("2 cups flour\n1 cup milk");
  expect(result.stepsText).toBe("Mix\nCook");
});
