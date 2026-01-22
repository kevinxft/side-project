import React from "react";
import { render } from "@testing-library/react-native";
import { LibraryScreen } from "../../components/screens/library-screen";

jest.mock("@/providers/recipes-provider", () => ({
  useRecipes: () => ({ recipes: [] }),
}));

it("shows empty state", () => {
  const { getByText } = render(<LibraryScreen />);
  expect(getByText("No recipes yet")).toBeTruthy();
});
