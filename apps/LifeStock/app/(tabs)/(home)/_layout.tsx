import { Stack } from "expo-router";
import React from "react";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerBlurEffect: "none",
          headerStyle: {
            backgroundColor: "transparent",
          },
          headerTitle: "",
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
