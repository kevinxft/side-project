import React from "react";
import { render } from "@testing-library/react-native";
import { CaptureScreen } from "../../components/screens/capture-screen";

jest.mock("@/providers/recipes-provider", () => ({
  useRecipes: () => ({ createDraftFromPhoto: jest.fn() }),
}));

it("renders capture actions", () => {
  const { getByText } = render(<CaptureScreen />);
  expect(getByText("Capture recipe")).toBeTruthy();
});
