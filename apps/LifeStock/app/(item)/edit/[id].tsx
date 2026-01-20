import type { ItemType, RecurrenceUnit, Reminder, ReminderType } from "@/db/schema";
import { itemService, reminderService } from "@/db/services";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ReminderSection } from "@/components/ReminderSection";

const TYPE_CONFIG: Record<ItemType, { label: string; icon: string; color: string }> = {
  product: { label: "物品", icon: "cube-outline", color: "#3B82F6" },
  account: { label: "账号", icon: "card-outline", color: "#8B5CF6" },
  phone: { label: "号码", icon: "call-outline", color: "#10B981" },
  other: { label: "其他", icon: "ellipsis-horizontal-outline", color: "#6B7280" },
};

const DEFAULT_ICONS: Record<ItemType, string> = {
  product: "📦",
  account: "💳",
  phone: "📱",
  other: "📁",
};

const COMMON_UNITS = ["个", "件", "包", "盒", "瓶", "袋", "支", "片"];

type AccountType = "balance" | "times" | "none";

function parseMetadata(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    return {};
  }
}

function parseFloatOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseIntOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View className="flex-row items-center justify-between px-4 py-3 min-h-[48px]">
    <Text className="text-[17px] text-black shrink-0 mr-3">{label}</Text>
    {children}
  </View>
);

const NumberInput = ({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  suffix?: string;
}) => (
  <View className="flex-row items-center">
    <TextInput
      className="text-[17px] text-black text-right min-w-[40px]"
      placeholder={placeholder}
      placeholderTextColor="#C7C7CC"
      keyboardType="decimal-pad"
      value={value}
      onChangeText={onChange}
    />
    {suffix && <Text className="ml-1 text-[17px] text-black">{suffix}</Text>}
  </View>
);

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isMissing, setIsMissing] = useState(false);
  const [rawMetadata, setRawMetadata] = useState<Record<string, unknown>>({});
  const [originalType, setOriginalType] = useState<ItemType | null>(null);
  const [existingReminder, setExistingReminder] = useState<Reminder | null>(null);

  const [type, setType] = useState<ItemType>("product");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICONS.product);
  const [notes, setNotes] = useState("");

  // Product fields
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("个");
  const [minQuantity, setMinQuantity] = useState("");
  const [location, setLocation] = useState("");

  // Account fields
  const [accountType, setAccountType] = useState<AccountType>("none");
  const [balance, setBalance] = useState("");
  const [totalTimes, setTotalTimes] = useState("");
  const [remainingTimes, setRemainingTimes] = useState("");
  const [merchantName, setMerchantName] = useState("");

  // Phone fields
  const [phoneNumber, setPhoneNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  // Reminder fields
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderType, setReminderType] = useState<ReminderType>("one_time");
  const [interval, setInterval] = useState("1");
  const [recUnit, setRecUnit] = useState<RecurrenceUnit>("month");
  const [remindDays, setRemindDays] = useState("0");
  const [dueDate, setDueDate] = useState<number | null>(null);
  const [reminderHour, setReminderHour] = useState(9);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempDay, setTempDay] = useState(new Date().getDate());
  const [tempHour, setTempHour] = useState(9);
  const [tempMinute, setTempMinute] = useState(0);

  const formatTime = (hour: number, minute: number) =>
    `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  const updateDueDateWithTime = (hour: number, minute: number) => {
    const base = dueDate ? new Date(dueDate) : new Date();
    base.setHours(hour, minute, 0, 0);
    setDueDate(base.getTime());
  };

  const updateDueDateWithDate = (year: number, month: number, day: number) => {
    const base = new Date();
    base.setFullYear(year, month, day);
    base.setHours(reminderHour, reminderMinute, 0, 0);
    setDueDate(base.getTime());
  };

  const openDatePicker = () => {
    const base = dueDate ? new Date(dueDate) : new Date();
    setTempYear(base.getFullYear());
    setTempMonth(base.getMonth());
    setTempDay(base.getDate());
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    const base = dueDate ? new Date(dueDate) : null;
    setTempHour(base ? base.getHours() : reminderHour);
    setTempMinute(base ? base.getMinutes() : reminderMinute);
    setShowTimePicker(true);
  };

  const confirmDateSelection = () => {
    updateDueDateWithDate(tempYear, tempMonth, tempDay);
    setShowDatePicker(false);
  };

  const confirmTimeSelection = () => {
    setReminderHour(tempHour);
    setReminderMinute(tempMinute);
    updateDueDateWithTime(tempHour, tempMinute);
    setShowTimePicker(false);
  };

  const resolveOneTimeDueDate = () => {
    if (dueDate) return dueDate;
    const base = new Date();
    base.setHours(reminderHour, reminderMinute, 0, 0);
    return base.getTime();
  };

  const resolveRecurringStartDate = () => {
    if (dueDate) return dueDate;
    const base = new Date();
    base.setHours(reminderHour, reminderMinute, 0, 0);
    return base.getTime();
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i);
  const daysInTempMonth = new Date(tempYear, tempMonth + 1, 0).getDate();
  const dayOptions = Array.from({ length: daysInTempMonth }, (_, i) => i + 1);
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);
  const timeLabel = formatTime(reminderHour, reminderMinute);

  const loadItem = useCallback(async () => {
    if (!id || typeof id !== "string") {
      setIsMissing(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    const itemData = await itemService.getById(id);
    if (!itemData) {
      setIsMissing(true);
      setLoading(false);
      return;
    }

    const parsedMetadata = parseMetadata(itemData.metadata);
    const itemType = itemData.type as ItemType;
    setRawMetadata(parsedMetadata);
    setOriginalType(itemType);
    setType(itemType);
    setName(itemData.name);
    setIcon(itemData.icon || DEFAULT_ICONS[itemType]);
    setNotes(itemData.notes ?? "");

    if (itemType === "product") {
      const metaQuantity = parsedMetadata.quantity;
      setQuantity(
        metaQuantity !== undefined && metaQuantity !== null ? String(metaQuantity) : ""
      );
      const metaUnit = parsedMetadata.unit;
      setUnit(typeof metaUnit === "string" && metaUnit.trim() ? metaUnit : "个");
      const metaMinQuantity = parsedMetadata.minQuantity;
      setMinQuantity(
        metaMinQuantity !== undefined && metaMinQuantity !== null ? String(metaMinQuantity) : ""
      );
      const metaLocation = parsedMetadata.location;
      setLocation(typeof metaLocation === "string" ? metaLocation : "");
    }

    if (itemType === "account") {
      const metaBalance = parsedMetadata.balance;
      const metaRemainingTimes = parsedMetadata.remainingTimes;
      const metaTotalTimes = parsedMetadata.totalTimes;
      if (metaBalance !== undefined && metaBalance !== null) {
        setAccountType("balance");
        setBalance(String(metaBalance));
      } else if (metaRemainingTimes !== undefined || metaTotalTimes !== undefined) {
        setAccountType("times");
        setRemainingTimes(
          metaRemainingTimes !== undefined && metaRemainingTimes !== null
            ? String(metaRemainingTimes)
            : ""
        );
        setTotalTimes(
          metaTotalTimes !== undefined && metaTotalTimes !== null
            ? String(metaTotalTimes)
            : ""
        );
      } else {
        setAccountType("none");
      }
      const metaMerchantName = parsedMetadata.merchantName;
      setMerchantName(typeof metaMerchantName === "string" ? metaMerchantName : "");
    }

    if (itemType === "phone") {
      const metaPhoneNumber = parsedMetadata.phoneNumber;
      setPhoneNumber(
        typeof metaPhoneNumber === "string"
          ? metaPhoneNumber
          : metaPhoneNumber !== undefined && metaPhoneNumber !== null
            ? String(metaPhoneNumber)
            : ""
      );
      const metaCarrier = parsedMetadata.carrier;
      setCarrier(typeof metaCarrier === "string" ? metaCarrier : "");
    }

    // 加载提醒数据
    if (itemData.reminders && itemData.reminders.length > 0) {
      const reminder = itemData.reminders[0];
      setExistingReminder(reminder);
      setHasReminder(reminder.isActive === 1);
      setReminderType(reminder.reminderType as ReminderType);
      setInterval(reminder.recurrenceInterval ? String(reminder.recurrenceInterval) : "1");
      setRecUnit((reminder.recurrenceUnit as RecurrenceUnit) || "month");
      setRemindDays(reminder.advanceDays ? String(reminder.advanceDays) : "0");

      const targetDate = reminder.reminderType === "one_time" ? reminder.dueDate : (reminder.nextDueDate || reminder.startDate);
      if (targetDate) {
        setDueDate(targetDate);
        const date = new Date(targetDate);
        setReminderHour(date.getHours());
        setReminderMinute(date.getMinutes());
      }
    }

    setIsMissing(false);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const handleTypeChange = (newType: ItemType) => {
    setType(newType);
    setIcon(DEFAULT_ICONS[newType]);
  };

  const handleSave = useCallback(async () => {
    if (!id || typeof id !== "string") return;
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const metadataBase =
        originalType && originalType === type ? { ...rawMetadata } : {};
      if (type === "product") {
        metadataBase.quantity = parseFloatOrNull(quantity);
        metadataBase.unit = unit.trim() || null;
        metadataBase.minQuantity = parseFloatOrNull(minQuantity);
        metadataBase.location = location.trim() || null;
      } else if (type === "account") {
        metadataBase.balance = accountType === "balance" ? parseFloatOrNull(balance) : null;
        metadataBase.totalTimes =
          accountType === "times" ? parseIntOrNull(totalTimes) : null;
        metadataBase.remainingTimes =
          accountType === "times" ? parseIntOrNull(remainingTimes) : null;
        metadataBase.merchantName = merchantName.trim() || null;
      } else if (type === "phone") {
        metadataBase.phoneNumber = phoneNumber.trim() || null;
        metadataBase.carrier = carrier || null;
      }

      await itemService.update(id, {
        type,
        name: name.trim(),
        icon,
        notes: notes.trim() || null,
        metadata: JSON.stringify(metadataBase),
      });

      // 处理提醒
      if (hasReminder) {
        const resolvedDueDate = reminderType === "one_time" ? resolveOneTimeDueDate() : null;
        const resolvedStartDate = reminderType === "recurring" ? resolveRecurringStartDate() : null;

        const reminderData = {
          reminderType,
          title: reminderType === "one_time" ? "到期提醒" : "循环任务",
          description: notes.trim() || null,
          dueDate: resolvedDueDate,
          recurrenceInterval: reminderType === "recurring" ? parseInt(interval) : null,
          recurrenceUnit: reminderType === "recurring" ? recUnit : null,
          startDate: resolvedStartDate,
          nextDueDate: reminderType === "recurring" ? resolvedStartDate : null,
          advanceDays: parseInt(remindDays) || 0,
          isActive: 1,
        };

        if (existingReminder) {
          await reminderService.update(existingReminder.id, reminderData);
        } else {
          await reminderService.create({
            itemId: id,
            ...reminderData,
          });
        }
      } else if (existingReminder) {
        // 关闭提醒
        await reminderService.update(existingReminder.id, { isActive: 0 });
      }

      router.back();
    } catch (error) {
      Alert.alert("保存失败", "请稍后重试");
    } finally {
      setSaving(false);
    }
  }, [
    accountType,
    balance,
    carrier,
    icon,
    id,
    location,
    minQuantity,
    name,
    notes,
    originalType,
    phoneNumber,
    quantity,
    rawMetadata,
    remainingTimes,
    totalTimes,
    type,
    unit,
    merchantName,
    saving,
    router,
    hasReminder,
    reminderType,
    interval,
    recUnit,
    remindDays,
    dueDate,
    reminderHour,
    reminderMinute,
    existingReminder,
  ]);

  const handleDelete = useCallback(() => {
    if (!id || typeof id !== "string" || deleting || loading || isMissing) return;
    Alert.alert("确认删除", "确定要删除这个物品吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await itemService.delete(id);
            router.back();
          } catch (error) {
            Alert.alert("删除失败", "请稍后重试");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }, [deleting, id, isMissing, loading, router]);

  const canSubmit = name.trim().length > 0 && !saving && !loading && !isMissing;
  const canDelete = !loading && !isMissing && !deleting && !saving;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "编辑物品",
          headerRight: () => (
            <Pressable className="px-2" onPress={handleDelete} disabled={!canDelete}>
              <Text
                className={`text-[16px] font-bold ${canDelete ? "text-[#FF3B30]" : "text-[#AEAEB2]"}`}
              >
                删除
              </Text>
            </Pressable>
          ),
        }}
      />

      {loading ? (
        <View className="flex-1 bg-[#F2F2F7] items-center justify-center">
          <Text className="text-gray-400">加载中...</Text>
        </View>
      ) : isMissing ? (
        <View className="flex-1 bg-[#F2F2F7] items-center justify-center">
          <Ionicons name="alert-circle-outline" size={48} color="#C7C7CC" />
          <Text className="text-gray-500 mt-4">物品不存在</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-[#F2F2F7]"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 类型切换器 */}
          <View className="mx-6 mt-4 mb-8">
            <View className="flex-row bg-[#E3E3E8] rounded-[20px] p-1 flex-wrap">
              {(Object.keys(TYPE_CONFIG) as ItemType[]).map((t) => {
                const config = TYPE_CONFIG[t];
                const isActive = type === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => handleTypeChange(t)}
                    style={{ width: "25%" }}
                    className={`items-center justify-center py-2.5 rounded-[15px] ${isActive ? "bg-white shadow-md" : ""}`}
                  >
                    <Ionicons
                      name={config.icon as any}
                      size={16}
                      color={isActive ? config.color : "#636366"}
                    />
                    <Text
                      className={`mt-1 font-bold text-[11px] ${isActive ? "text-black" : "text-[#636366]"}`}
                    >
                      {config.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 名称卡片 */}
          <View className="mx-6 mb-8">
            <View className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-white">
              <View className="flex-row items-center px-6 py-6 border-b border-[#F2F2F7]">
                <View className="w-12 h-12 rounded-[18px] items-center justify-center mr-4 bg-[#F2F2F7]">
                  <Text className="text-2xl">{icon}</Text>
                </View>
                <TextInput
                  className="flex-1 text-[22px] font-bold text-black"
                  placeholder="物品名称"
                  placeholderTextColor="#AEAEB2"
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <View className="flex-row items-center px-8 py-5">
                <Ionicons name="pencil-outline" size={18} color="#AEAEB2" />
                <TextInput
                  className="flex-1 text-[15px] text-[#2C2C2E] ml-3"
                  placeholder="点击添加备注..."
                  placeholderTextColor="#AEAEB2"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>
            </View>
          </View>

          {/* Product Form */}
          {type === "product" && (
            <View className="mx-6 mb-6">
              <View className="bg-white/60 rounded-[32px] border border-white shadow-sm p-4">
                <View className="bg-white/50 rounded-2xl border border-white mb-3">
                  <FormRow label="当前库存">
                    <NumberInput value={quantity} onChange={setQuantity} placeholder="0" suffix={unit} />
                  </FormRow>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row gap-2.5 px-1">
                    {COMMON_UNITS.map((u) => (
                      <Pressable
                        key={u}
                        onPress={() => setUnit(u)}
                        className={`px-5 py-2.5 rounded-2xl border ${unit === u ? "bg-blue-500 border-blue-400 shadow-md" : "bg-white border-gray-100"}`}
                      >
                        <Text className={`text-[13px] font-bold ${unit === u ? "text-white" : "text-gray-600"}`}>{u}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
                <View className="bg-white/50 rounded-2xl border border-white">
                  <FormRow label="存放位置">
                    <TextInput
                      className="text-[15px] text-black text-right flex-1 ml-4"
                      placeholder="在哪儿？"
                      placeholderTextColor="#C7C7CC"
                      value={location}
                      onChangeText={setLocation}
                    />
                  </FormRow>
                </View>
              </View>
            </View>
          )}

          {/* Phone Form */}
          {type === "phone" && (
            <View className="mx-6 mb-6">
              <View className="bg-white/60 rounded-[32px] border border-white shadow-sm p-4">
                <View className="bg-white/50 rounded-2xl border border-white mb-3">
                  <FormRow label="手机号码">
                    <TextInput
                      className="text-[16px] font-bold text-black text-right flex-1 ml-4"
                      placeholder="输入手机号"
                      placeholderTextColor="#C7C7CC"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                    />
                  </FormRow>
                </View>
                <View className="bg-white/50 rounded-2xl border border-white">
                  <FormRow label="运营商">
                    <TextInput
                      className="text-[16px] font-bold text-black text-right flex-1 ml-4"
                      placeholder="输入运营商"
                      placeholderTextColor="#C7C7CC"
                      value={carrier}
                      onChangeText={setCarrier}
                    />
                  </FormRow>
                </View>
              </View>
            </View>
          )}

          {/* Account Form */}
          {type === "account" && (
            <View className="mx-6 mb-6">
              <View className="bg-white/60 rounded-[32px] border border-white shadow-sm p-4">
                <View className="flex-row bg-[#E3E3E8] rounded-2xl p-1 mb-4">
                  {(["none", "balance", "times"] as const).map((mode) => (
                    <Pressable
                      key={mode}
                      onPress={() => setAccountType(mode)}
                      className={`flex-1 py-2.5 rounded-xl ${accountType === mode ? "bg-white shadow-sm" : ""}`}
                    >
                      <Text
                        className={`text-center text-[13px] font-bold ${accountType === mode ? "text-black" : "text-gray-500"}`}
                      >
                        {mode === "none" ? "通用" : mode === "balance" ? "余额" : "计次"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {accountType === "balance" && (
                  <View className="bg-white/50 rounded-2xl border border-white mb-3">
                    <FormRow label="当前余额">
                      <NumberInput value={balance} onChange={setBalance} placeholder="0.00" suffix="元" />
                    </FormRow>
                  </View>
                )}
                {accountType === "times" && (
                  <>
                    <View className="bg-white/50 rounded-2xl border border-white mb-3">
                      <FormRow label="总次数">
                        <NumberInput value={totalTimes} onChange={setTotalTimes} placeholder="0" suffix="次" />
                      </FormRow>
                    </View>
                    <View className="bg-white/50 rounded-2xl border border-white mb-3">
                      <FormRow label="剩余次数">
                        <NumberInput value={remainingTimes} onChange={setRemainingTimes} placeholder="0" suffix="次" />
                      </FormRow>
                    </View>
                  </>
                )}
                <View className="bg-white/50 rounded-2xl border border-white">
                  <FormRow label="商家名称">
                    <TextInput
                      className="text-[15px] text-black text-right flex-1 ml-4"
                      placeholder="输入商家"
                      placeholderTextColor="#C7C7CC"
                      value={merchantName}
                      onChangeText={setMerchantName}
                    />
                  </FormRow>
                </View>
              </View>
            </View>
          )}

          {/* Reminder Settings */}
          <ReminderSection
            hasReminder={hasReminder}
            setHasReminder={setHasReminder}
            reminderType={reminderType}
            setReminderType={setReminderType}
            interval={interval}
            setInterval={setInterval}
            recUnit={recUnit}
            setRecUnit={setRecUnit}
            remindDays={remindDays}
            setRemindDays={setRemindDays}
            dueDate={dueDate}
            timeLabel={timeLabel}
            onOpenDatePicker={openDatePicker}
            onOpenTimePicker={openTimePicker}
            FormRow={FormRow}
            NumberInput={NumberInput}
          />

          <View className="mx-6 mb-10 mt-2">
            <Pressable
              onPress={handleSave}
              disabled={!canSubmit}
              className={`h-12 rounded-2xl items-center justify-center ${canSubmit ? "bg-[#007AFF]" : "bg-[#C7C7CC]"}`}
            >
              <Text className={`text-[17px] font-bold ${canSubmit ? "text-white" : "text-[#F2F2F7]"}`}>
                保存
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40"
          onPress={() => setShowDatePicker(false)}
        >
          <Pressable
            className="bg-white rounded-2xl w-[85%] overflow-hidden"
            onPress={() => {}}
          >
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <Pressable onPress={() => setShowDatePicker(false)}>
                <Text className="text-[15px] text-gray-500">取消</Text>
              </Pressable>
              <Text className="text-[16px] font-semibold text-black">选择日期</Text>
              <Pressable onPress={confirmDateSelection}>
                <Text className="text-[15px] font-semibold text-[#007AFF]">完成</Text>
              </Pressable>
            </View>
            <View className="flex-row">
              <Picker
                style={{ flex: 1, height: 200 }}
                selectedValue={tempYear}
                itemStyle={{ fontSize: 18 }}
                onValueChange={(value) => {
                  const nextYear = value as number;
                  const maxDay = new Date(nextYear, tempMonth + 1, 0).getDate();
                  setTempYear(nextYear);
                  if (tempDay > maxDay) setTempDay(maxDay);
                }}
              >
                {yearOptions.map((year) => (
                  <Picker.Item key={year} label={`${year}年`} value={year} />
                ))}
              </Picker>
              <Picker
                style={{ flex: 1, height: 200 }}
                selectedValue={tempMonth}
                itemStyle={{ fontSize: 18 }}
                onValueChange={(value) => {
                  const nextMonth = value as number;
                  const maxDay = new Date(tempYear, nextMonth + 1, 0).getDate();
                  setTempMonth(nextMonth);
                  if (tempDay > maxDay) setTempDay(maxDay);
                }}
              >
                {monthOptions.map((month) => (
                  <Picker.Item key={month} label={`${month + 1}月`} value={month} />
                ))}
              </Picker>
              <Picker
                style={{ flex: 1, height: 200 }}
                selectedValue={tempDay}
                itemStyle={{ fontSize: 18 }}
                onValueChange={(value) => setTempDay(value as number)}
              >
                {dayOptions.map((day) => (
                  <Picker.Item key={day} label={`${day}日`} value={day} />
                ))}
              </Picker>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40"
          onPress={() => setShowTimePicker(false)}
        >
          <Pressable
            className="bg-white rounded-2xl w-[80%] overflow-hidden"
            onPress={() => {}}
          >
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <Pressable onPress={() => setShowTimePicker(false)}>
                <Text className="text-[15px] text-gray-500">取消</Text>
              </Pressable>
              <Text className="text-[16px] font-semibold text-black">选择时间</Text>
              <Pressable onPress={confirmTimeSelection}>
                <Text className="text-[15px] font-semibold text-[#007AFF]">完成</Text>
              </Pressable>
            </View>
            <View className="flex-row">
              <Picker
                style={{ flex: 1, height: 200 }}
                selectedValue={tempHour}
                onValueChange={(value) => setTempHour(value as number)}
              >
                {hourOptions.map((hour) => (
                  <Picker.Item
                    key={hour}
                    label={String(hour).padStart(2, "0")}
                    value={hour}
                  />
                ))}
              </Picker>
              <Picker
                style={{ flex: 1, height: 200 }}
                selectedValue={tempMinute}
                onValueChange={(value) => setTempMinute(value as number)}
              >
                {minuteOptions.map((minute) => (
                  <Picker.Item
                    key={minute}
                    label={String(minute).padStart(2, "0")}
                    value={minute}
                  />
                ))}
              </Picker>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
