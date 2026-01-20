import type { Item, Reminder } from "@/db/schema";
import { reminderService } from "@/db/services";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
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

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${formatTime(date)}`;
}

function getDayDiff(expiryTimestamp: number): number {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const targetDate = new Date(expiryTimestamp);
  targetDate.setHours(0, 0, 0, 0);
  return Math.round((targetDate.getTime() - startOfToday.getTime()) / MS_PER_DAY);
}

function getStatusColor(expiryTimestamp: number): { bg: string; text: string } {
  if (expiryTimestamp < Date.now()) {
    return { bg: "#FFEBEE", text: "#D32F2F" }; // 已过期 - 红色
  }
  const daysRemaining = getDayDiff(expiryTimestamp);
  if (daysRemaining <= 7) {
    return { bg: "#FFF3E0", text: "#F57C00" }; // 7天内 - 橙色
  } else if (daysRemaining <= 30) {
    return { bg: "#FFF8E1", text: "#FFA000" }; // 30天内 - 黄色
  } else {
    return { bg: "#E8F5E9", text: "#388E3C" }; // 30天以上 - 绿色
  }
}

function getStatusText(expiryTimestamp: number, type: string): string {
  const daysRemaining = getDayDiff(expiryTimestamp);
  const action = type === "recurring" ? "操作" : "到期";
  if (expiryTimestamp < Date.now()) {
    if (daysRemaining === 0) return "已逾期";
    return `已逾期 ${Math.abs(daysRemaining)} 天`;
  }
  if (daysRemaining === 0) return `今天${action}`;
  if (daysRemaining === 1) return `明天${action}`;
  return `${daysRemaining} 天后${action}`;
}


// ============= 日历组件 =============
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  markedDates: Set<string>; // 格式: "YYYY-MM-DD"
}

function Calendar({ selectedDate, onSelectDate, markedDates }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [tempYear, setTempYear] = useState(currentMonth.getFullYear());
  const [tempMonth, setTempMonth] = useState(currentMonth.getMonth());

  // 监听 currentMonth 变化同步 temp 状态（当通过前后按钮切换时）
  useEffect(() => {
    setTempYear(currentMonth.getFullYear());
    setTempMonth(currentMonth.getMonth());
  }, [currentMonth]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // 本月第一天是周几
    const firstDay = new Date(year, month, 1).getDay();
    // 本月有多少天
    const daysCount = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];

    // 填充前面的空白
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // 填充日期
    for (let i = 1; i <= daysCount; i++) {
      days.push(i);
    }

    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleSelectYear = (year: number) => {
    setTempYear(year);
  };

  const handleSelectMonth = (month: number) => {
    setTempMonth(month);
  };

  const confirmYearSelection = () => {
    setCurrentMonth(new Date(tempYear, currentMonth.getMonth(), 1));
    setShowYearPicker(false);
  };

  const confirmMonthSelection = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), tempMonth, 1));
    setShowMonthPicker(false);
  };

  const cancelYearSelection = () => {
    setTempYear(currentMonth.getFullYear());
    setShowYearPicker(false);
  };

  const cancelMonthSelection = () => {
    setTempMonth(currentMonth.getMonth());
    setShowMonthPicker(false);
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(today);
  };

  const isSelectedToday = useMemo(() => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  }, [selectedDate]);

  // 判断当前显示的月份是否是今天所在的月份
  const isViewingCurrentMonth = useMemo(() => {
    const today = new Date();
    return (
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  }, [currentMonth]);

  // 只要不是选中今天，或者虽然选中今天但视图不在本月，就显示“今日”按钮
  const showTodayButton = !isSelectedToday || !isViewingCurrentMonth;

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const hasMarker = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return markedDates.has(dateStr);
  };

  // 生成年份列表 (当前年份前后20年)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 41 }, (_, i) => currentYear - 20 + i);
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <View style={styles.calendarContainer}>
      {/* 月份导航 */}
      <View style={styles.monthNav}>
        <View style={styles.navLeft}>
          <Pressable onPress={handlePrevMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </Pressable>
        </View>

        <View style={styles.monthTitleContainer}>
          <Pressable
            onPress={() => setShowYearPicker(true)}
            style={styles.yearTitleButton}
          >
            <Text style={styles.monthTitle}>{currentMonth.getFullYear()}年</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowMonthPicker(true)}
            style={styles.monthTitleButton}
          >
            <Text style={styles.monthTitle}>{currentMonth.getMonth() + 1}月</Text>
          </Pressable>
        </View>

        <View style={styles.navRight}>
          {showTodayButton && (
            <Pressable onPress={handleGoToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>今日</Text>
            </Pressable>
          )}
          <Pressable onPress={handleNextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </Pressable>
        </View>
      </View>

      {/* 年份选择器弹窗 */}
      <Modal
        visible={showYearPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelYearSelection}
      >
        <Pressable
          style={styles.pickerModalContainer}
          onPress={cancelYearSelection}
        >
          <Pressable
            style={styles.pickerModalContent}
            onPress={() => { }}
          >
            <View style={styles.pickerModalHeader}>
              <Pressable onPress={cancelYearSelection}>
                <Text style={styles.pickerCancelText}>取消</Text>
              </Pressable>
              <Text style={styles.pickerModalTitle}>选择年份</Text>
              <Pressable onPress={confirmYearSelection}>
                <Text style={styles.pickerDoneText}>完成</Text>
              </Pressable>
            </View>
            <Picker
              selectedValue={tempYear}
              onValueChange={(itemValue: number | string) => handleSelectYear(itemValue as number)}
              style={styles.picker}
            >
              {years.map((year) => (
                <Picker.Item key={year} label={`${year}年`} value={year} />
              ))}
            </Picker>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 月份选择器弹窗 */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelMonthSelection}
      >
        <Pressable
          style={styles.pickerModalContainer}
          onPress={cancelMonthSelection}
        >
          <Pressable
            style={styles.pickerModalContent}
            onPress={() => { }}
          >
            <View style={styles.pickerModalHeader}>
              <Pressable onPress={cancelMonthSelection}>
                <Text style={styles.pickerCancelText}>取消</Text>
              </Pressable>
              <Text style={styles.pickerModalTitle}>选择月份</Text>
              <Pressable onPress={confirmMonthSelection}>
                <Text style={styles.pickerDoneText}>完成</Text>
              </Pressable>
            </View>
            <Picker
              selectedValue={tempMonth}
              onValueChange={(itemValue: number | string) => handleSelectMonth(itemValue as number)}
              style={styles.picker}
            >
              {months.map((month) => (
                <Picker.Item key={month} label={`${month}月`} value={month - 1} />
              ))}
            </Picker>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 星期标题 */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* 日期网格 */}
      <View style={styles.daysGrid}>
        {daysInMonth.map((day, index) => (
          <Pressable
            key={index}
            style={styles.dayCell}
            onPress={() => {
              if (day) {
                onSelectDate(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    day
                  )
                );
              }
            }}
          >
            {day && (
              <>
                <View
                  style={[
                    styles.dayCellInner,
                    isSelected(day) && styles.selectedDay,
                    isToday(day) && !isSelected(day) && styles.todayDay,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected(day) && styles.selectedDayText,
                      isToday(day) && !isSelected(day) && styles.todayDayText,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {hasMarker(day) && (
                  <View
                    style={[
                      styles.marker,
                      isSelected(day) && styles.selectedMarker,
                    ]}
                  />
                )}
              </>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ============= 主页面 =============
export type ReminderWithItem = Reminder & { item: Item };

export default function CalendarScreen() {
  const [remindersList, setRemindersList] = useState<ReminderWithItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loadReminders = useCallback(async () => {
    const data = await reminderService.getAllActive();
    setRemindersList(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders])
  );

  // 计算有任务的日期集合
  const markedDates = useMemo(() => {
    const dates = new Set<string>();
    remindersList.forEach((r) => {
      const targetDate = r.reminderType === "one_time" ? r.dueDate : r.nextDueDate;
      if (targetDate) {
        const date = new Date(targetDate);
        const dateStr = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        dates.add(dateStr);
      }
    });
    return dates;
  }, [remindersList]);

  // 过滤选中日期的提醒
  const filteredReminders = useMemo(() => {
    const selectedDateStr = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

    return remindersList.filter((r) => {
      const targetDate = r.reminderType === "one_time" ? r.dueDate : r.nextDueDate;
      if (!targetDate) return false;
      const date = new Date(targetDate);
      const dateStr = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return dateStr === selectedDateStr;
    });
  }, [remindersList, selectedDate]);

  const handleComplete = async (reminderId: string, title: string) => {
    Alert.alert("确认完成", `确定已完成 "${title}" 操作吗？`, [
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

  const hasItems = filteredReminders.length > 0;


  // 格式化选中日期用于显示
  const selectedDateDisplay = `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`;

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* 日历展示 */}
      <Calendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        markedDates={markedDates}
      />

      {/* 最近到期的东西 */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>{selectedDateDisplay} 事项</Text>

        {!hasItems ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>当日无待办事项</Text>
            <Text style={styles.emptySubtext}>
              点击日历上有红点的日期查看到期或待办事项
            </Text>
          </View>
        ) : (
          <View style={styles.itemList}>
            {filteredReminders.map((reminder) => {
              const targetDate =
                reminder.reminderType === "one_time"
                  ? reminder.dueDate!
                  : reminder.nextDueDate!;
              const statusColor = getStatusColor(targetDate);
              const statusText = getStatusText(targetDate, reminder.reminderType);

              return (
                <View key={reminder.id} style={styles.itemCard}>
                  <View style={styles.itemLeft}>
                    <View style={styles.iconContainer}>
                      <Text style={styles.itemIcon}>{reminder.item.icon || "📦"}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{reminder.item.name}</Text>
                      <Text style={styles.itemReminderTitle}>{reminder.title}</Text>
                      <Text style={styles.itemDate}>{formatDate(targetDate)}</Text>
                    </View>
                  </View>
                  <View style={styles.itemRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColor.bg },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: statusColor.text }]}
                      >
                        {statusText}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={() => handleComplete(reminder.id, reminder.title)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={24} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ============= 样式 =============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  // 日历样式
  calendarContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    marginBottom: 16,
    position: "relative",
  },
  navLeft: {
    position: "absolute",
    left: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  navRight: {
    position: "absolute",
    right: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  monthTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  yearTitleButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthTitleButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  todayButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F2F2F7",
    marginRight: 2,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007AFF",
  },
  // 滚轮选择器样式
  pickerModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  pickerModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "80%",
    maxWidth: 300,
    overflow: "hidden",
  },
  pickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  pickerModalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  pickerCancelText: {
    fontSize: 17,
    color: "#8E8E93",
  },
  pickerDoneText: {
    fontSize: 17,
    color: "#007AFF",
    fontWeight: "600",
  },
  picker: {
    height: 200,
  },
  pickerGrid: {
    maxHeight: 300,
    padding: 16,
  },
  pickerGridContent: {
    paddingBottom: 20,
  },
  gridWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
  },
  pickerItem: {
    width: "30%",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
  },
  pickerItemActive: {
    backgroundColor: "#007AFF",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  pickerItemTextActive: {
    color: "#fff",
  },
  wheelHighlight: {
    position: "absolute",
    top: "50%",
    left: 16,
    right: 16,
    height: 44,
    marginTop: -22,
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
  },
  wheelContent: {
    paddingVertical: 88,
  },
  wheelItem: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  wheelItemText: {
    fontSize: 20,
    color: "#8E8E93",
  },
  wheelItemTextActive: {
    color: "#000",
    fontWeight: "600",
  },
  monthButtonText: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
  },
  monthButtonTextActive: {
    color: "#fff",
  },
  weekdaysRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dayCellInner: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  dayText: {
    fontSize: 16,
    color: "#000",
  },
  selectedDay: {
    backgroundColor: "#007AFF",
  },
  selectedDayText: {
    color: "#fff",
    fontWeight: "600",
  },
  todayDay: {
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  todayDayText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  marker: {
    position: "absolute",
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF3B30",
  },
  selectedMarker: {
    backgroundColor: "#fff",
  },
  // 列表样式
  listSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 17,
    color: "#8E8E93",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#AEAEB2",
  },
  itemList: {
    gap: 12,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 22,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  itemReminderTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    color: "#999",
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  completeButton: {
    padding: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
