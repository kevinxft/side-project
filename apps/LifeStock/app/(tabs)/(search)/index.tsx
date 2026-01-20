import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";

export default function SearchScreen() {
    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: "搜索",
                }}
            />
            <ScrollView
                className="flex-1 bg-white"
                contentInsetAdjustmentBehavior="automatic"
            >
                <View className="flex-1 items-center justify-center py-40">
                    <Ionicons name="search" size={64} color="#E5E5EA" />
                    <Text className="text-gray-400 mt-4 text-[16px]">
                        搜索物品、卡券或号码
                    </Text>
                </View>
            </ScrollView>
        </>
    );
}
