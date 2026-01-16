import { DatabaseProvider } from "@/components/DatabaseProvider";
import { Stack } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";

export const unstable_settings = {
  anchor: "(tabs)",
};

// 数据库加载中的 fallback UI
function DatabaseLoading() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 12, color: "#666" }}>正在初始化数据库...</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <DatabaseProvider fallback={<DatabaseLoading />}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </DatabaseProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
