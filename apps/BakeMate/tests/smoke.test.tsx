import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";

it("renders a basic component", () => {
  const { getByText } = render(<Text>Smoke</Text>);
  expect(getByText("Smoke")).toBeTruthy();
});
