import type { Item } from "@/db/schema";
import { itemService } from "@/db/services";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, SectionList, Text, View } from "react-native";

// 类型映射
const TYPE_LABELS: Record<string, string> = {
    phone: "号码",
    product: "产品",
    account: "账号",
    supply: "耗材",
    other: "其他",
};

type SectionData = {
    title: string;
    data: Item[];
};

export default function SearchScreen() {
    const router = useRouter();
    const [searchText, setSearchText] = useState("");
    const [results, setResults] = useState<Item[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = useCallback(async (query: string) => {
        setSearchText(query);
        if (!query.trim()) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const data = await itemService.search(query);
            setResults(data);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // 按类型分组
    const sections: SectionData[] = Object.entries(
        results.reduce((acc, item) => {
            const type = item.type || "other";
            if (!acc[type]) acc[type] = [];
            acc[type].push(item);
            return acc;
        }, {} as Record<string, Item[]>)
    ).map(([type, items]) => ({
        title: TYPE_LABELS[type] || type,
        data: items,
    }));

    const handleItemPress = useCallback(
        (item: Item) => {
            router.push(`/(home)/${item.id}`);
        },
        [router]
    );

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: "搜索",
                    headerSearchBarOptions: {
                        placeholder: "搜索物品、卡券或号码",
                        onChangeText: (e) => handleSearch(e.nativeEvent.text),
                        autoCapitalize: "none",
                    },
                }}
            />

            {searchText.trim() === "" ? (
                // 空状态：未搜索
                <View className="flex-1 bg-[#F2F2F7] items-center justify-center">
                    <Ionicons name="search" size={64} color="#E5E5EA" />
                    <Text className="text-gray-400 mt-4 text-[16px]">
                        搜索物品、卡券或号码
                    </Text>
                </View>
            ) : results.length === 0 && !isSearching ? (
                // 无结果
                <View className="flex-1 bg-[#F2F2F7] items-center justify-center">
                    <Ionicons name="search-outline" size={48} color="#C7C7CC" />
                    <Text className="text-gray-500 mt-4 text-[16px]">
                        未找到 "{searchText}"
                    </Text>
                    <Text className="text-gray-400 mt-1 text-[14px]">
                        尝试其他关键词
                    </Text>
                </View>
            ) : (
                // 搜索结果
                <SectionList
                    className="flex-1 bg-[#F2F2F7]"
                    contentInsetAdjustmentBehavior="automatic"
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    stickySectionHeadersEnabled={false}
                    renderSectionHeader={({ section }) => (
                        <Text className="text-sm font-medium text-gray-500 mx-4 mt-4 mb-2">
                            {section.title} ({section.data.length})
                        </Text>
                    )}
                    renderItem={({ item, index, section }) => {
                        // 解析 metadata
                        let metadata: Record<string, unknown> = {};
                        try {
                            metadata = item.metadata ? JSON.parse(item.metadata) : {};
                        } catch (e) {
                            // ignore
                        }

                        const isFirst = index === 0;
                        const isLast = index === section.data.length - 1;

                        return (
                            <Pressable
                                onPress={() => handleItemPress(item)}
                                className={`bg-white mx-4 px-4 py-3 ${isFirst ? "rounded-t-2xl" : ""
                                    } ${isLast ? "rounded-b-2xl mb-2" : "border-b border-gray-100"}`}
                            >
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-xl bg-[#F2F2F7] items-center justify-center mr-3">
                                        <Text className="text-xl">{item.icon || "📦"}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[16px] font-medium text-black" numberOfLines={1}>
                                            {item.name}
                                        </Text>
                                        {(() => {
                                            if (item.type === "product") {
                                                return (
                                                    <Text className="text-[13px] text-gray-500 mt-0.5">
                                                        库存: {String(metadata.quantity ?? "-")}
                                                    </Text>
                                                );
                                            }
                                            if (item.type === "account" && metadata.balance !== undefined) {
                                                return (
                                                    <Text className="text-[13px] text-gray-500 mt-0.5">
                                                        余额: ¥{String(metadata.balance)}
                                                    </Text>
                                                );
                                            }
                                            if (item.type === "phone") {
                                                return (
                                                    <Text className="text-[13px] text-gray-500 mt-0.5">
                                                        {String(metadata.phoneNumber || "-")}
                                                    </Text>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
                                </View>
                            </Pressable>
                        );
                    }}
                    ListEmptyComponent={
                        isSearching ? (
                            <View className="flex-1 items-center justify-center py-20">
                                <Text className="text-gray-400">搜索中...</Text>
                            </View>
                        ) : null
                    }
                />
            )}
        </>
    );
}
