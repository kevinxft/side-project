import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable";
import { withLayoutContext } from "expo-router";
import React from "react";

const { Navigator } = createNativeBottomTabNavigator();

const Tabs = withLayoutContext(Navigator);

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "首页",
          tabBarSystemItem: "favorites",
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "联系人",
          tabBarSystemItem: "contacts",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "设置",
          tabBarSystemItem: "more",
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarSystemItem: "search",
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerSearchBarOptions: {
            placeholder: "搜索...",
          },
        }}
      />
    </Tabs>
  );
}
