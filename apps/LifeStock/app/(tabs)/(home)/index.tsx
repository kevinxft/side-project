import { AddItemSheet } from "@/components/AddItemModal";
import type { Item } from "@/db/schema";
import { itemService } from "@/db/services";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

export default function HomeScreen() {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadItems = useCallback(async () => {
    const data = await itemService.getAll();
    setItems(data);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleOpenAddItem = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const handleCloseAddItem = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    loadItems();
  }, [loadItems]);

  const handleToggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
    setSelectedIds(new Set());
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDelete = useCallback(() => {
    if (selectedIds.size === 0) return;

    Alert.alert(
      "确认删除",
      `确定要删除选中的 ${selectedIds.size} 个物品吗？`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all(
                Array.from(selectedIds).map((id) => itemService.delete(id))
              );
              setSelectedIds(new Set());
              setIsEditMode(false);
              loadItems();
            } catch (error) {
              console.error("删除失败:", error);
            }
          },
        },
      ]
    );
  }, [selectedIds, loadItems]);

  const hasItems = items.length > 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () =>
            hasItems ? (
              <Pressable
                className="w-9 h-9 items-center justify-center"
                onPress={handleToggleEditMode}
              >
                <Ionicons
                  name={isEditMode ? "close" : "create-outline"}
                  size={24}
                  color={isEditMode ? "#FF3B30" : "#000"}
                  style={{ textAlign: "center" }}
                />
              </Pressable>
            ) : null,
          headerRight: () => (
            <Pressable
              className="w-9 h-9 items-center justify-center"
              onPress={isEditMode ? handleDelete : handleOpenAddItem}
            >
              <Ionicons
                name={isEditMode ? "trash-outline" : "add"}
                size={isEditMode ? 24 : 28}
                color={isEditMode ? (selectedIds.size > 0 ? "#FF3B30" : "#C7C7CC") : "#000"}
                style={{ textAlign: "center" }}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        className="flex-1 bg-[#F2F2F7]"
        contentInsetAdjustmentBehavior="automatic"
      >
        {!hasItems ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-6xl mb-4">📦</Text>
            <Text className="text-lg text-gray-500">暂无物品</Text>
            <Text className="text-sm text-gray-400 mt-1">点击右上角 + 添加</Text>
          </View>
        ) : (
          <View className="px-4 py-4">
            {items.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (isEditMode) {
                      handleToggleSelect(item.id);
                    } else {
                      // TODO: 查看详情
                    }
                  }}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row items-center">
                    {isEditMode && (
                      <View className="mr-3">
                        <View
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                      </View>
                    )}
                    <View className="w-12 h-12 rounded-xl bg-[#F2F2F7] items-center justify-center mr-3">
                      <Text className="text-2xl">{item.icon || "📦"}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[17px] font-bold text-black">
                        {item.name}
                      </Text>
                      {item.kind === "stock" && item.quantity !== null && (
                        <Text className="text-[14px] text-gray-500 mt-0.5">
                          库存: {item.quantity} {item.unit}
                        </Text>
                      )}
                      {item.kind === "card" && item.balance !== null && (
                        <Text className="text-[14px] text-gray-500 mt-0.5">
                          余额: ¥{item.balance}
                        </Text>
                      )}
                      {item.kind === "card" && item.remainingTimes !== null && (
                        <Text className="text-[14px] text-gray-500 mt-0.5">
                          剩余: {item.remainingTimes}/{item.totalTimes} 次
                        </Text>
                      )}
                      {item.kind === "phone" && item.phoneNumber && (
                        <Text className="text-[14px] text-gray-500 mt-0.5">
                          {item.phoneNumber}
                        </Text>
                      )}
                    </View>
                    {!isEditMode && (
                      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <AddItemSheet ref={bottomSheetRef} onClose={handleCloseAddItem} />
    </>
  );
}
