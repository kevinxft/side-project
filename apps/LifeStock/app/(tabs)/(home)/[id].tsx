import type { Item, Reminder, ReminderLog } from "@/db/schema";
import { itemService, reminderService } from "@/db/services";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";

// 类型映射
const TYPE_LABELS: Record<string, string> = {
  phone: "号码",
  product: "产品",
  account: "账号",
  supply: "耗材",
  other: "其他",
};

type ReminderLogWithReminder = ReminderLog & { reminder: Reminder };

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<(Item & { reminders: Reminder[] }) | null>(null);
  const [logs, setLogs] = useState<ReminderLogWithReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [itemData, logsData] = await Promise.all([
        itemService.getById(id),
        reminderService.getLogsForItem(id),
      ]);
      if (itemData) {
        setItem(itemData);
        setLogs(logsData);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: "加载中..." }} />
        <View className="flex-1 bg-[#F2F2F7] items-center justify-center">
          <Text className="text-gray-400">加载中...</Text>
        </View>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: "未找到" }} />
        <View className="flex-1 bg-[#F2F2F7] items-center justify-center">
          <Ionicons name="alert-circle-outline" size={48} color="#C7C7CC" />
          <Text className="text-gray-500 mt-4">物品不存在</Text>
        </View>
      </>
    );
  }

  // 解析 metadata
  let metadata: Record<string, unknown> = {};
  try {
    metadata = item.metadata ? JSON.parse(item.metadata) : {};
  } catch (e) {
    // ignore
  }

  // 计算近30天完成统计
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recentLogs = logs.filter((log) => log.completedAt >= thirtyDaysAgo);

  // 按日期分组
  const dailyCounts: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    dailyCounts[key] = 0;
  }
  recentLogs.forEach((log) => {
    const d = new Date(log.completedAt);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    if (key in dailyCounts) {
      dailyCounts[key]++;
    }
  });
  const last7Days = Object.entries(dailyCounts).slice(0, 7).reverse();
  const maxCount = Math.max(...last7Days.map(([, c]) => c), 1);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: item.name,
          headerRight: () => (
            <Pressable
              className="px-2"
              onPress={() => router.push(`/(home)/edit/${item.id}`)}
            >
              <Text className="text-[16px] font-bold text-[#007AFF]">编辑</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        className="flex-1 bg-[#F2F2F7]"
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* ====== 基本信息卡片 ====== */}
        <View className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-2xl bg-[#F2F2F7] items-center justify-center mr-4">
              <Text className="text-4xl">{item.icon || "📦"}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-black">{item.name}</Text>
              <Text className="text-sm text-gray-500 mt-1">
                {TYPE_LABELS[item.type] || item.type}
              </Text>
            </View>
          </View>

          {/* Metadata 详情 */}
          <View className="mt-4 pt-4 border-t border-gray-100">
            {item.type === "product" && (
              <View className="flex-row justify-between py-1">
                <Text className="text-gray-500">库存</Text>
                <Text className="text-black font-medium">
                  {String(metadata.quantity ?? "-")} {String(metadata.unit ?? "")}
                </Text>
              </View>
            )}
            {item.type === "account" && metadata.balance !== undefined && (
              <View className="flex-row justify-between py-1">
                <Text className="text-gray-500">余额</Text>
                <Text className="text-black font-medium">¥{metadata.balance as number}</Text>
              </View>
            )}
            {item.type === "account" && metadata.remainingTimes !== undefined && (
              <View className="flex-row justify-between py-1">
                <Text className="text-gray-500">剩余次数</Text>
                <Text className="text-black font-medium">
                  {metadata.remainingTimes as number}/{metadata.totalTimes as number || "?"} 次
                </Text>
              </View>
            )}
            {item.type === "phone" && (
              <View className="flex-row justify-between py-1">
                <Text className="text-gray-500">号码</Text>
                <Text className="text-black font-medium">{metadata.phoneNumber as string || "-"}</Text>
              </View>
            )}
            {item.notes && (
              <View className="mt-2">
                <Text className="text-gray-500 text-sm">备注</Text>
                <Text className="text-black mt-1">{item.notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ====== 关联提醒 ====== */}
        {item.reminders.length > 0 && (
          <View className="mx-4 mt-4">
            <Text className="text-sm font-medium text-gray-500 mb-2 ml-1">
              关联提醒 ({item.reminders.length})
            </Text>
            <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {item.reminders.map((reminder, index) => {
                const dueDate =
                  reminder.reminderType === "one_time"
                    ? reminder.dueDate
                    : reminder.nextDueDate;
                const dueDateStr = dueDate
                  ? new Date(dueDate).toLocaleDateString("zh-CN")
                  : "-";
                const isOverdue = dueDate && dueDate < Date.now();
                return (
                  <View
                    key={reminder.id}
                    className={`p-4 flex-row items-center ${index > 0 ? "border-t border-gray-100" : ""
                      }`}
                  >
                    <View
                      className={`w-2 h-2 rounded-full mr-3 ${isOverdue ? "bg-red-500" : "bg-green-500"
                        }`}
                    />
                    <View className="flex-1">
                      <Text className="text-black font-medium">{reminder.title}</Text>
                      <Text className="text-gray-500 text-sm mt-0.5">
                        {reminder.reminderType === "recurring"
                          ? `每${reminder.recurrenceInterval}${reminder.recurrenceUnit === "day" ? "天" : reminder.recurrenceUnit === "week" ? "周" : reminder.recurrenceUnit === "month" ? "月" : "年"}`
                          : "一次性"}
                        {" · "}
                        {isOverdue ? "已逾期" : dueDateStr}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ====== 近7天统计图表 ====== */}
        {logs.length > 0 && (
          <View className="mx-4 mt-4">
            <Text className="text-sm font-medium text-gray-500 mb-2 ml-1">
              近 7 天完成统计
            </Text>
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Svg height={80} width="100%">
                {last7Days.map(([date, count], index) => {
                  const barWidth = 28;
                  const gap = 10;
                  const x = index * (barWidth + gap) + 8;
                  const barHeight = (count / maxCount) * 60;
                  return (
                    <React.Fragment key={date}>
                      <Rect
                        x={x}
                        y={70 - barHeight}
                        width={barWidth}
                        height={Math.max(barHeight, 2)}
                        fill="#007AFF"
                        rx={4}
                      />
                    </React.Fragment>
                  );
                })}
              </Svg>
              <View className="flex-row mt-2">
                {last7Days.map(([date]) => (
                  <Text
                    key={date}
                    className="text-xs text-gray-400"
                    style={{ width: 38, textAlign: "center" }}
                  >
                    {date}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ====== 历史记录时间线 ====== */}
        <View className="mx-4 mt-4 mb-8">
          <Text className="text-sm font-medium text-gray-500 mb-2 ml-1">
            历史记录 ({logs.length})
          </Text>
          {logs.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center shadow-sm">
              <Ionicons name="time-outline" size={32} color="#C7C7CC" />
              <Text className="text-gray-400 mt-2">暂无完成记录</Text>
            </View>
          ) : (
            <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {logs.slice(0, 20).map((log, index) => {
                const completedDate = new Date(log.completedAt);
                return (
                  <View
                    key={log.id}
                    className={`p-4 flex-row ${index > 0 ? "border-t border-gray-100" : ""}`}
                  >
                    <View className="items-center mr-3">
                      <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center">
                        <Ionicons name="checkmark" size={18} color="#34C759" />
                      </View>
                      {index < logs.length - 1 && index < 19 && (
                        <View className="w-0.5 flex-1 bg-gray-100 mt-1" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-black font-medium">
                        {log.reminder.title}
                      </Text>
                      <Text className="text-gray-500 text-sm mt-0.5">
                        {completedDate.toLocaleDateString("zh-CN")}{" "}
                        {completedDate.toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      {log.notes && (
                        <Text className="text-gray-400 text-sm mt-1">{log.notes}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
              {logs.length > 20 && (
                <View className="p-4 items-center border-t border-gray-100">
                  <Text className="text-gray-400 text-sm">
                    还有 {logs.length - 20} 条记录...
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
