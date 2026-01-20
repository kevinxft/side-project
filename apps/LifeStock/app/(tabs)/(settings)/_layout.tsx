import { Stack } from "expo-router";
import React from "react";

export default function SettingsLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                    headerLargeTitle: true,
                    headerShadowVisible: false,
                    headerBlurEffect: "systemMaterial",
                    headerStyle: {
                        backgroundColor: "#F2F2F7", // 匹配页面背景色
                    },
                }}
            />
        </Stack>
    );
}
