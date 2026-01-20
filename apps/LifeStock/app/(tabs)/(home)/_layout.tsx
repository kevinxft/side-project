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
      <Stack.Screen
        name="[id]"
        options={{
          headerBackTitle: "返回",
          headerTransparent: true,
          headerBlurEffect: "systemMaterial",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          headerTitle: "编辑物品",
          headerBackTitle: "返回",
          headerTransparent: true,
          headerBlurEffect: "systemMaterial",
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
