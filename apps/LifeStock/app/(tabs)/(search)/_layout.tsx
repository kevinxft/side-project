import { Stack } from "expo-router";
import React from "react";

export default function SearchLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: true,
                    headerSearchBarOptions: {
                        placeholder: "搜索物品、卡券或号码",
                    },
                    headerTransparent: true,
                    headerBlurEffect: "systemMaterial",
                    headerShadowVisible: false,
                }}
            />
        </Stack>
    );
}
