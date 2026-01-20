import type { Item, Reminder } from "@/db/schema";
import { reminderService } from "@/db/services";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ============= 日期工具函数 =============
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatShortDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()} ${formatTime(date)}`;
}

function getDayDiff(expiryTimestamp: number): number {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const targetDate = new Date(expiryTimestamp);
  targetDate.setHours(0, 0, 0, 0);
  return Math.round((targetDate.getTime() - startOfToday.getTime()) / MS_PER_DAY);
}

function getStatusColor(expiryTimestamp: number): string {
  if (expiryTimestamp < Date.now()) return "#FF3B30";
  const days = getDayDiff(expiryTimestamp);
  if (days <= 3) return "#FF9500";
  if (days <= 7) return "#FFCC00";
  return "#34C759";
}

function getDateGroupLabel(timestamp: number): string {
  const days = getDayDiff(timestamp);
  if (timestamp < Date.now() && days < 0) return "已过期";
  if (days === 0) return "今天";
  if (days === 1) return "明天";
  if (days === 2) return "后天";
  if (days <= 7) return "本周内";
  if (days <= 30) return "本月内";
  if (days <= 90) return "三个月内";
  if (days <= 180) return "半年内";
  if (days <= 365) return "一年内";
  return "更远";
}

// ============= 主页面 =============
export type ReminderWithItem = Reminder & { item: Item };

interface Section {
  title: string;
  count: number;
  data: ReminderWithItem[];
}

export default function TimelineScreen() {
  const router = useRouter();
  const [remindersList, setRemindersList] = useState<ReminderWithItem[]>([]);

  const loadReminders = useCallback(async () => {
    const data = await reminderService.getAllActive();
    setRemindersList(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders])
  );

  const sections = useMemo(() => {
    const sorted = [...remindersList].sort((a, b) => {
      const dateA = a.reminderType === "one_time" ? a.dueDate : a.nextDueDate;
      const dateB = b.reminderType === "one_time" ? b.dueDate : b.nextDueDate;
      return (dateA || 0) - (dateB || 0);
    });

    const groupMap = new Map<string, ReminderWithItem[]>();
    const groupOrder: string[] = [];

    sorted.forEach((reminder) => {
      const targetDate = reminder.reminderType === "one_time" ? reminder.dueDate : reminder.nextDueDate;
      if (!targetDate) return;
      const label = getDateGroupLabel(targetDate);
      if (!groupMap.has(label)) {
        groupMap.set(label, []);
        groupOrder.push(label);
      }
      groupMap.get(label)!.push(reminder);
    });

    return groupOrder.map((title) => ({
      title,
      count: groupMap.get(title)!.length,
      data: groupMap.get(title)!,
    }));
  }, [remindersList]);

  const handleComplete = async (reminderId: string, title: string) => {
    Alert.alert("确认完成", `确定已完成 "${title}" 吗？`, [
      { text: "取消", style: "cancel" },
      {
        text: "确定",
        onPress: async () => {
          await reminderService.complete(reminderId);
          loadReminders();
        },
      },
    ]);
  };

  const renderItem = ({ item: reminder }: { item: ReminderWithItem }) => {
    const targetDate = reminder.reminderType === "one_time" ? reminder.dueDate! : reminder.nextDueDate!;
    const statusColor = getStatusColor(targetDate);

    return (
      <Pressable
        onPress={() => router.push(`/(item)/${reminder.item.id}`)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
        <View style={styles.content}>
          <Text style={styles.itemName} numberOfLines={1}>{reminder.item.name}</Text>
          <Text style={styles.reminderTitle} numberOfLines={1}>{reminder.title}</Text>
        </View>
        <Text style={styles.date}>{formatShortDate(targetDate)}</Text>
        <TouchableOpacity
          onPress={() => handleComplete(reminder.id, reminder.title)}
          hitSlop={10}
        >
          <Ionicons name="checkmark-circle-outline" size={22} color="#C7C7CC" />
        </TouchableOpacity>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.count} 项</Text>
    </View>
  );

  if (remindersList.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>暂无待办事项</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      style={styles.container}
      contentContainerStyle={styles.listContent}
      contentInsetAdjustmentBehavior="automatic"
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  listContent: {
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  sectionCount: {
    fontSize: 14,
    color: "#8E8E93",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  rowPressed: {
    opacity: 0.7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  reminderTitle: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  date: {
    fontSize: 13,
    color: "#8E8E93",
    marginRight: 12,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F7",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 17,
    color: "#8E8E93",
  },
});
