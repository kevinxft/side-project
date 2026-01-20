import type { RecurrenceUnit, ReminderType } from "@/db/schema";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

const RECURRENCE_UNITS: { label: string; value: RecurrenceUnit }[] = [
  { label: "天", value: "day" },
  { label: "周", value: "week" },
  { label: "月", value: "month" },
  { label: "年", value: "year" },
];

interface ReminderSectionProps {
  hasReminder: boolean;
  setHasReminder: (v: boolean) => void;
  reminderType: ReminderType;
  setReminderType: (v: ReminderType) => void;
  interval: string;
  setInterval: (v: string) => void;
  recUnit: RecurrenceUnit;
  setRecUnit: (v: RecurrenceUnit) => void;
  remindDays: string;
  setRemindDays: (v: string) => void;
  dueDate: number | null;
  timeLabel: string;
  onOpenDatePicker: () => void;
  onOpenTimePicker: () => void;
  FormRow: any;
  NumberInput: any;
}

export const ReminderSection: React.FC<ReminderSectionProps> = ({
  hasReminder,
  setHasReminder,
  reminderType,
  setReminderType,
  interval,
  setInterval,
  recUnit,
  setRecUnit,
  remindDays,
  setRemindDays,
  dueDate,
  timeLabel,
  onOpenDatePicker,
  onOpenTimePicker,
  FormRow,
  NumberInput,
}) => {
  return (
    <View className="mx-4 mb-6">
      <Pressable
        onPress={() => setHasReminder(!hasReminder)}
        className="flex-row items-center justify-between px-4 py-3 bg-white rounded-2xl"
      >
        <View className="flex-row items-center">
          <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${hasReminder ? "bg-blue-500" : "bg-gray-100"}`}>
            <Ionicons name="notifications" size={18} color={hasReminder ? "white" : "#8E8E93"} />
          </View>
          <Text className="text-[17px] text-black">
            提醒
          </Text>
        </View>
        <View className={`w-[51px] h-[31px] rounded-full px-[2px] justify-center ${hasReminder ? "bg-[#34C759]" : "bg-[#E9E9EA]"}`}>
          <View className={`w-[27px] h-[27px] rounded-full bg-white shadow-sm transition-all duration-200 ${hasReminder ? "self-end" : "self-start"}`} />
        </View>
      </Pressable>

      {hasReminder && (
        <View className="mt-2 bg-white rounded-2xl overflow-hidden p-4">
          <View className="flex-row bg-gray-100 rounded-lg p-0.5 mb-4">
            <Pressable
              onPress={() => setReminderType("one_time")}
              className={`flex-1 py-1.5 rounded-[7px] items-center justify-center ${reminderType === "one_time" ? "bg-white shadow-sm" : ""}`}
            >
              <Text className={`text-[13px] font-semibold ${reminderType === "one_time" ? "text-black" : "text-gray-500"}`}>
                一次性
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setReminderType("recurring")}
              className={`flex-1 py-1.5 rounded-[7px] items-center justify-center ${reminderType === "recurring" ? "bg-white shadow-sm" : ""}`}
            >
              <Text className={`text-[13px] font-semibold ${reminderType === "recurring" ? "text-black" : "text-gray-500"}`}>
                重复
              </Text>
            </Pressable>
          </View>

          {reminderType === "recurring" ? (
            <View className="border-b border-gray-100 pb-3 mb-3">
              <FormRow label="复发频率">
                <View className="flex-row items-center">
                  <NumberInput value={interval} onChange={setInterval} placeholder="1" />
                  <Text className="mx-2 text-gray-400 font-medium text-[15px]">/</Text>
                  <View className="flex-row bg-gray-100 rounded-lg p-0.5">
                    {RECURRENCE_UNITS.map(u => (
                      <Pressable
                        key={u.value}
                        onPress={() => setRecUnit(u.value)}
                        className={`px-3 py-1 rounded-md ${recUnit === u.value ? "bg-white shadow-sm" : ""}`}
                      >
                        <Text className={`text-[12px] font-medium ${recUnit === u.value ? "text-black" : "text-gray-500"}`}>
                          {u.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </FormRow>
            </View>
          ) : (
            <View className="border-b border-gray-100 pb-3 mb-3">
              <FormRow label="到期日期">
                <Pressable
                  onPress={onOpenDatePicker}
                  className="bg-gray-100 px-3 py-1.5 rounded-lg"
                >
                  <Text className={`text-[15px] ${dueDate ? "text-blue-600" : "text-gray-400"}`}>
                    {dueDate ? new Date(dueDate).toLocaleDateString("zh-CN") : "选择日期"}
                  </Text>
                </Pressable>
              </FormRow>
            </View>
          )}

          <View className="border-b border-gray-100 pb-3 mb-3">
            <FormRow label="提醒时间">
              <Pressable
                onPress={onOpenTimePicker}
                className="bg-gray-100 px-3 py-1.5 rounded-lg"
              >
                <Text className="text-[15px] text-blue-600">
                  {timeLabel}
                </Text>
              </Pressable>
            </FormRow>
          </View>

          <FormRow label="提前提醒">
            <NumberInput value={remindDays} onChange={setRemindDays} placeholder="0" suffix="天" />
          </FormRow>
        </View>
      )}
    </View>
  );
};
