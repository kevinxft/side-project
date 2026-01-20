import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";

export default function SettingsScreen() {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [defaultReminderHour, setDefaultReminderHour] = useState(9);

    const appVersion = Constants.expoConfig?.version || "1.0.0";
    const buildNumber = Constants.expoConfig?.ios?.buildNumber || "1";

    // 通用行组件，减少重复代码并统一视觉
    const SettingRow = ({
        icon,
        iconBg,
        label,
        children,
        isLast = false,
        onPress
    }: {
        icon: keyof typeof Ionicons.glyphMap;
        iconBg: string;
        label: string;
        children?: React.ReactNode;
        isLast?: boolean;
        onPress?: () => void;
    }) => {
        const Content = (
            <View className={`flex-row items-center justify-between py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}>
                <View className="flex-row items-center">
                    <View className={`w-8 h-8 rounded-lg ${iconBg} items-center justify-center mr-3 shadow-sm`}>
                        <Ionicons name={icon} size={18} color="white" />
                    </View>
                    <Text className="text-[17px] text-[#1C1C1E]">{label}</Text>
                </View>
                <View className="flex-row items-center">
                    {children}
                </View>
            </View>
        );

        if (onPress) {
            return (
                <Pressable onPress={onPress} className="px-4 active:bg-gray-50">
                    {Content}
                </Pressable>
            );
        }

        return <View className="px-4">{Content}</View>;
    };

    const SectionHeader = ({ title }: { title: string }) => (
        <Text className="px-5 text-[13px] font-medium text-[#8E8E93] mb-2 uppercase tracking-tight">
            {title}
        </Text>
    );

    return (
        <>
            <Stack.Screen options={{ headerTitle: "设置" }} />
            <ScrollView
                className="flex-1 bg-[#F2F2F7]"
                contentInsetAdjustmentBehavior="automatic"
            >
                {/* 提醒与通知 */}
                <View className="mt-8 mb-8">
                    <SectionHeader title="提醒与通知" />
                    <View className="mx-4 bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                        <SettingRow icon="notifications" iconBg="bg-red-500" label="启用通知">
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: "#E9E9EA", true: "#34C759" }}
                                thumbColor="white"
                                className="scale-90"
                            />
                        </SettingRow>

                        <SettingRow
                            icon="time"
                            iconBg="bg-orange-500"
                            label="默认提醒时间"
                            isLast
                            onPress={() => { }}
                        >
                            <Text className="text-[17px] text-[#8E8E93] mr-1">
                                {String(defaultReminderHour).padStart(2, "0")}:00
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                        </SettingRow>
                    </View>
                </View>

                {/* 关于 */}
                <View className="mb-8">
                    <SectionHeader title="关于" />
                    <View className="mx-4 bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                        <SettingRow icon="information-circle" iconBg="bg-blue-400" label="版本" isLast>
                            <Text className="text-[17px] text-[#8E8E93]">
                                {appVersion} ({buildNumber})
                            </Text>
                        </SettingRow>
                    </View>
                </View>

                <View className="h-20" />
            </ScrollView>
        </>
    );
}
