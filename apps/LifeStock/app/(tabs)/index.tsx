import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl text-gray-900">Hello World</Text>
      </View>
    </SafeAreaView>
  );
}
