const INGREDIENT_HEADINGS = ["ingredients", "ingredient"];
const STEP_HEADINGS = ["instructions", "directions", "steps", "method"];

const isHeading = (line: string, headings: string[]) =>
  headings.includes(line.trim().toLowerCase());

export function suggestFromOcr(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const title = lines[0] ?? "";
  let section: "ingredients" | "steps" | null = null;
  const ingredients: string[] = [];
  const steps: string[] = [];

  for (const line of lines.slice(1)) {
    if (isHeading(line, INGREDIENT_HEADINGS)) {
      section = "ingredients";
      continue;
    }
    if (isHeading(line, STEP_HEADINGS)) {
      section = "steps";
      continue;
    }

    if (section === "ingredients") {
      ingredients.push(line);
      continue;
    }
    if (section === "steps") {
      steps.push(line);
      continue;
    }

    const looksLikeIngredient = /\d/.test(line) || /cup|tsp|tbsp|g|kg|ml|oz/i.test(line);
    if (looksLikeIngredient) {
      ingredients.push(line);
    } else {
      steps.push(line);
    }
  }

  return {
    title,
    ingredientsText: ingredients.join("\n"),
    stepsText: steps.join("\n"),
  };
}
