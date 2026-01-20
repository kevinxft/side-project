import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable";
import { withLayoutContext } from "expo-router";
import React from "react";

// 使用 withLayoutContext 将 React Navigation 的原生 Tab 导航器接入 Expo Router
const Tabs = withLayoutContext(createNativeBottomTabNavigator().Navigator);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "库存",
          tabBarIcon: { type: "sfSymbol", name: "archivebox.fill" },
        }}
      />

      <Tabs.Screen
        name="(calendar)"
        options={{
          title: "日历",
          tabBarIcon: { type: "sfSymbol", name: "calendar" },
        }}
      />

      <Tabs.Screen
        name="(search)"
        options={{
          tabBarSystemItem: "search",
        }}
      />

      <Tabs.Screen
        name="(settings)"
        options={{
          title: "设置",
          tabBarIcon: { type: "sfSymbol", name: "gearshape.fill" },
        }}
      />
    </Tabs>
  );
}

