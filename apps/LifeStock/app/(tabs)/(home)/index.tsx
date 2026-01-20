import { AddItemSheet } from "@/components/AddItemModal";
import type { Item } from "@/db/schema";
import { seedTestData } from "@/db/seed";
import { itemService } from "@/db/services";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalPending, setIsModalPending] = useState(false);

  const loadItems = useCallback(async () => {
    const data = await itemService.getAll();
    setItems(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const handleOpenAddItem = useCallback(() => {
    // 改为设置挂起状态，由 useEffect 处理最终触发
    setIsModalPending(true);
  }, []);

  // 状态驱动的弹窗触发器
  useEffect(() => {
    if (isModalPending) {
      setIsModalPending(false);
      // 确保 ref 已经准备就绪
      requestAnimationFrame(() => {
        bottomSheetRef.current?.present();
      });
    }
  }, [isModalPending]);

  const handleCloseAddItem = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    loadItems();
  }, [loadItems]);

  const handleToggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
    setSelectedIds(new Set());
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  }, [items, selectedIds]);

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

  // 使用 useLayoutEffect 同步设置头部按钮，提高可靠性
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View className="flex-row items-center px-2">
          {hasItems && (
            <Pressable
              className="w-9 h-9 items-center justify-center"
              onPress={handleToggleEditMode}
            >
              <Ionicons
                name={isEditMode ? "close" : "create-outline"}
                size={22}
                color={isEditMode ? "#FF3B30" : "#1C1C1E"}
              />
            </Pressable>
          )}
          <Pressable
            className="w-9 h-9 items-center justify-center"
            onPress={async () => {
              await seedTestData();
              loadItems();
            }}
          >
            <Ionicons name="sparkles-outline" size={20} color="#007AFF" />
          </Pressable>
        </View>
      ),
      headerRight: () => (
        <View className="flex-row items-center px-2">
          {isEditMode && hasItems && (
            <Pressable
              className="w-9 h-9 items-center justify-center mr-1"
              onPress={handleToggleSelectAll}
            >
              <Ionicons
                name={selectedIds.size === items.length ? "checkmark-circle" : "checkmark-circle-outline"}
                size={22}
                color="#007AFF"
              />
            </Pressable>
          )}
          <Pressable
            className="w-9 h-9 items-center justify-center"
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            onPress={isEditMode ? handleDelete : handleOpenAddItem}
          >
            <Ionicons
              name={isEditMode ? "trash-outline" : "add"}
              size={isEditMode ? 22 : 28}
              color={isEditMode ? (selectedIds.size > 0 ? "#FF3B30" : "#C7C7CC") : "#007AFF"}
            />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, isEditMode, hasItems, selectedIds.size, handleToggleEditMode, handleToggleSelectAll, handleDelete, handleOpenAddItem, loadItems]);

  return (
    <>

      <ScrollView
        className="flex-1 bg-[#F2F2F7]"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {!hasItems ? (
          <View className="flex-1 items-center justify-center pt-32 px-4">
            <View className="w-20 h-20 bg-white shadow-sm rounded-3xl items-center justify-center mb-6 opacity-80">
              <Ionicons name="sparkles-outline" size={42} color="#007AFF" />
            </View>
            <Text className="text-[20px] font-bold text-black mb-2">
              开始你的整理之旅
            </Text>
            <Text className="text-[15px] text-gray-400 mb-8 text-center leading-5 px-8">
              添加生活物品，记录每一笔消费，{'\n'}让生活井井有条。
            </Text>
          </View>

        ) : (
          <View className="px-4 py-2">
            {items.map((item) => {
              const isSelected = selectedIds.has(item.id);
              // 根据类型设置图标背景色
              const iconBgClass =
                item.type === "product" ? "bg-blue-50" :
                  item.type === "account" ? "bg-purple-50" :
                    item.type === "phone" ? "bg-green-50" :
                      item.type === "supply" ? "bg-orange-50" : "bg-gray-100";

              const iconColor =
                item.type === "product" ? "#3B82F6" :
                  item.type === "account" ? "#8B5CF6" :
                    item.type === "phone" ? "#10B981" :
                      item.type === "supply" ? "#F59E0B" : "#6B7280";

              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (isEditMode) {
                      handleToggleSelect(item.id);
                    } else {
                      router.push(`/(home)/${item.id}`);
                    }
                  }}
                  className={`bg-white rounded-3xl p-4 mb-3 ${isSelected ? 'border-2 border-blue-500' : 'border border-transparent'} shadow-[0_2px_8px_rgba(0,0,0,0.04)]`}
                >
                  <View className="flex-row items-center">
                    {isEditMode && (
                      <View className="mr-4">
                        <View
                          className={`w-5 h-5 rounded-full border items-center justify-center ${isSelected
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300 bg-white"
                            }`}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          )}
                        </View>
                      </View>
                    )}
                    <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${iconBgClass}`}>
                      <Text className="text-[22px]">{item.icon || "📦"}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[17px] font-semibold text-black mb-1" numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.updatedAt && (
                          <Text className="text-[10px] text-gray-300">
                            {/* 时间展示逻辑可后续优化 */}
                          </Text>
                        )}
                      </View>

                      {(() => {
                        try {
                          const meta = item.metadata ? JSON.parse(item.metadata) : {};
                          if (item.type === "product") {
                            return (
                              <Text className="text-[13px] font-medium text-gray-400">
                                库存 {meta.quantity ?? "-"} {meta.unit || ""}
                              </Text>
                            );
                          }
                          if (item.type === "account") {
                            if (meta.balance !== undefined) {
                              return (
                                <Text className="text-[13px] font-medium text-gray-400">
                                  余额 ¥{meta.balance}
                                </Text>
                              );
                            }
                            if (meta.remainingTimes !== undefined) {
                              return (
                                <Text className="text-[13px] font-medium text-gray-400">
                                  剩余 {meta.remainingTimes}/{meta.totalTimes || "?"} 次
                                </Text>
                              );
                            }
                          }
                          if (item.type === "phone") {
                            return (
                              <Text className="text-[13px] font-medium text-gray-400">
                                {meta.phoneNumber || "无号码"}
                              </Text>
                            );
                          }
                          return (
                            <Text className="text-[13px] font-medium text-gray-400" numberOfLines={1}>
                              {item.notes || "暂无备注"}
                            </Text>
                          );
                        } catch (e) {
                          return null;
                        }
                      })()}
                    </View>

                    {!isEditMode && (
                      <Ionicons name="chevron-forward" size={16} color="#E5E5EA" />
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
