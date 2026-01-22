import React from "react";
import { render } from "@testing-library/react-native";
import { RecipeDetailScreen } from "../../components/screens/recipe-detail-screen";

jest.mock("@/providers/recipes-provider", () => ({
  useRecipes: () => ({
    recipes: [
      {
        id: "1",
        title: "Test",
        ingredientsText: "Sugar",
        stepsText: "Mix",
        tags: ["dessert"],
        status: "ready",
        createdAt: "2026-01-22T00:00:00.000Z",
        updatedAt: "2026-01-22T00:00:00.000Z",
      },
    ],
  }),
}));

it("renders recipe title", () => {
  const { getByText } = render(<RecipeDetailScreen recipeId="1" />);
  expect(getByText("Test")).toBeTruthy();
});
