import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

const BackButton = () => {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.back()} className="px-2 py-1">
      <View className="flex-row items-center">
        <Ionicons name="chevron-back" size={20} color="#007AFF" />
        <Text className="text-[16px] text-[#007AFF]">返回</Text>
      </View>
    </Pressable>
  );
};

export default function ItemLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerLeft: () => <BackButton />,
          headerBackTitle: "返回",
          headerTransparent: true,
          headerBlurEffect: "systemMaterial",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          headerLeft: () => <BackButton />,
          headerBackTitle: "返回",
          headerTransparent: true,
          headerBlurEffect: "systemMaterial",
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
