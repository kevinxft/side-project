import type { ItemType, RecurrenceUnit, ReminderType } from "@/db/schema";
import { itemService, reminderService } from "@/db/services";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Picker } from "@react-native-picker/picker";
import React, { forwardRef, useCallback, useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { ReminderSection } from "./ReminderSection";

const TYPE_CONFIG: Record<ItemType, { label: string; icon: string; color: string }> = {
    product: { label: "产品", icon: "cube-outline", color: "#3B82F6" },
    account: { label: "账号", icon: "card-outline", color: "#8B5CF6" },
    phone: { label: "号码", icon: "call-outline", color: "#10B981" },
    supply: { label: "耗材", icon: "brush-outline", color: "#F59E0B" },
    other: { label: "其他", icon: "ellipsis-horizontal-outline", color: "#6B7280" },
};

const COMMON_UNITS = ["个", "件", "包", "盒", "瓶", "袋", "支", "片"];
// const CARRIERS = ["中国移动", "中国联通", "中国电信", "中国广电", "Ultra Mobile", "giffgaff", "RedteaGO"];
const RECURRENCE_UNITS: { label: string; value: RecurrenceUnit }[] = [
    { label: "天", value: "day" },
    { label: "周", value: "week" },
    { label: "月", value: "month" },
    { label: "年", value: "year" },
];

interface AddItemSheetProps {
    initialType: ItemType | null;
    onClose: () => void;
}

export const AddItemSheet = forwardRef<BottomSheetModal, AddItemSheetProps>(
    ({ initialType, onClose }, ref) => {
        const [type, setType] = useState<ItemType>("product");
        const [name, setName] = useState("");
        const [icon, setIcon] = useState("📦");
        const [notes, setNotes] = useState("");

        // Reset state when type changes via initialType
        React.useEffect(() => {
            if (initialType) {
                handleTypeChange(initialType);
            }
        }, [initialType]);

        // Product/Supply fields
        const [quantity, setQuantity] = useState("");
        const [unit, setUnit] = useState("个");
        const [minQuantity, setMinQuantity] = useState("");
        const [location, setLocation] = useState("");

        // Account fields
        const [accountType, setAccountType] = useState<"balance" | "times" | "none">("none");
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

        const snapPoints = useMemo(() => ["90%"], []);

        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.4}
                />
            ),
            []
        );

        const handleClose = useCallback(() => {
            setName("");
            setNotes("");
            setQuantity("");
            setMinQuantity("");
            setLocation("");
            setBalance("");
            setTotalTimes("");
            setRemainingTimes("");
            setMerchantName("");
            setPhoneNumber("");
            setCarrier("");
            setHasReminder(false);
            setDueDate(null);
            setReminderHour(9);
            setReminderMinute(0);
            setShowDatePicker(false);
            setShowTimePicker(false);
            onClose();
        }, [onClose]);

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

        const cancelDateSelection = () => {
            setShowDatePicker(false);
        };

        const cancelTimeSelection = () => {
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

        const handleAddItem = async () => {
            let finalName = name.trim();

            // 自动推导名称
            if (type === "phone") {
                finalName = phoneNumber.trim() || "新号码";
            } else if (type === "account") {
                finalName = merchantName.trim() || "新账户";
            }

            if (!finalName) return;

            try {
                const metadata: any = {};
                if (type === "product" || type === "supply") {
                    metadata.quantity = quantity ? parseFloat(quantity) : null;
                    metadata.unit = unit || null;
                    metadata.minQuantity = minQuantity ? parseFloat(minQuantity) : null;
                    metadata.location = location.trim() || null;
                } else if (type === "account") {
                    if (accountType === "balance") metadata.balance = parseFloat(balance);
                    else if (accountType === "times") {
                        metadata.totalTimes = parseInt(totalTimes);
                        metadata.remainingTimes = parseInt(remainingTimes);
                    }
                    metadata.merchantName = merchantName.trim() || null;
                } else if (type === "phone") {
                    metadata.phoneNumber = phoneNumber.trim() || null;
                    metadata.carrier = carrier || null;
                }

                const newItem = await itemService.create({
                    type,
                    name: finalName,
                    icon,
                    notes: notes.trim() || null,
                    metadata: JSON.stringify(metadata),
                    archived: 0,
                });

                if (hasReminder) {
                    const resolvedDueDate = reminderType === "one_time" ? resolveOneTimeDueDate() : null;
                    const resolvedStartDate =
                        reminderType === "recurring" ? resolveRecurringStartDate() : null;
                    await reminderService.create({
                        itemId: newItem.id,
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
                    });
                }

                handleClose();
            } catch (error) {
                console.error("保存失败:", error);
            }
        };

        const handleTypeChange = (newType: ItemType) => {
            setType(newType);
            const config = TYPE_CONFIG[newType];
            if (newType === "product") setIcon("📦");
            else if (newType === "account") setIcon("💳");
            else if (newType === "phone") setIcon("📱");
            else if (newType === "supply") setIcon("🪥");
            else setIcon("📁");
        };

        const canSubmit = type === "phone" ? phoneNumber.trim().length > 0 :
            type === "account" ? merchantName.trim().length > 0 :
                name.trim().length > 0;
        const currentYear = new Date().getFullYear();
        const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
        const monthOptions = Array.from({ length: 12 }, (_, i) => i);
        const daysInTempMonth = new Date(tempYear, tempMonth + 1, 0).getDate();
        const dayOptions = Array.from({ length: daysInTempMonth }, (_, i) => i + 1);
        const hourOptions = Array.from({ length: 24 }, (_, i) => i);
        const minuteOptions = Array.from({ length: 60 }, (_, i) => i);
        const timeLabel = formatTime(reminderHour, reminderMinute);

        const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
            <View className="flex-row items-center justify-between px-4 py-3 h-12">
                <Text className="text-[17px] text-black">{label}</Text>
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

        return (
            <BottomSheetModal
                ref={ref}
                snapPoints={snapPoints}
                enablePanDownToClose
                enableDynamicSizing={false}
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: "#F2F2F7" }}
                handleIndicatorStyle={{ backgroundColor: "#C7C7CC", width: 36, marginTop: 6 }}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200/50 bg-[#F2F2F7]">
                    <Pressable onPress={handleClose} className="px-2 py-2">
                        <Text className="text-[17px] text-[#007AFF]">取消</Text>
                    </Pressable>

                    <Text className="text-[17px] font-bold text-black">新物品</Text>

                    <Pressable
                        onPress={handleAddItem}
                        className="px-2 py-2"
                        disabled={!canSubmit}
                    >
                        <Text className={`text-[17px] font-bold ${canSubmit ? "text-[#007AFF]" : "text-gray-300"}`}>保存</Text>
                    </Pressable>
                </View>

                <BottomSheetScrollView
                    contentContainerStyle={{ paddingTop: 20, paddingBottom: 80 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* 名称/核心信息卡片 */}
                    <View className="mx-4 mb-6 bg-white rounded-2xl overflow-hidden">
                        {(type === "product" || type === "supply" || type === "other") && (
                            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                                <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3 border border-gray-100">
                                    <Text className="text-[22px]">{icon}</Text>
                                </View>
                                <TextInput
                                    className="flex-1 text-[17px] font-medium text-black h-10"
                                    placeholder={type === "other" ? "名称" : (type === "product" ? "产品名称" : "耗材名称")}
                                    placeholderTextColor="#C7C7CC"
                                    value={name}
                                    onChangeText={setName}
                                    clearButtonMode="while-editing"
                                />
                            </View>
                        )}

                        {type === "phone" && (
                            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                                <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center mr-3 border border-green-100">
                                    <Text className="text-[22px]">📱</Text>
                                </View>
                                <TextInput
                                    className="flex-1 text-[22px] font-bold text-black h-12"
                                    placeholder="输入手机号"
                                    placeholderTextColor="#C7C7CC"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        )}

                        {type === "account" && (
                            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                                <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center mr-3 border border-purple-100">
                                    <Text className="text-[22px]">💳</Text>
                                </View>
                                <TextInput
                                    className="flex-1 text-[18px] font-bold text-black h-12"
                                    placeholder="商家或服务名称"
                                    placeholderTextColor="#C7C7CC"
                                    value={merchantName}
                                    onChangeText={setMerchantName}
                                />
                            </View>
                        )}

                        <View className="flex-row items-start px-4 py-3 h-24">
                            <Ionicons name="documents-outline" size={20} color="#C7C7CC" style={{ marginTop: 2, marginRight: 10 }} />
                            <TextInput
                                className="flex-1 text-[15px] text-black leading-5 pt-0"
                                placeholder="添加备注..."
                                placeholderTextColor="#C7C7CC"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* 类型选择 - 仅在 Product/Supply 下显示切换 */}
                    {(type === "product" || type === "supply") && (
                        <View className="mb-6">
                            <View className="flex-row bg-gray-200/50 p-1 mx-4 rounded-xl">
                                {(['product', 'supply'] as const).map(m => (
                                    <Pressable
                                        key={m}
                                        onPress={() => handleTypeChange(m)}
                                        className={`flex-1 py-1.5 rounded-[10px] items-center justify-center ${type === m ? "bg-white shadow-sm" : ""}`}
                                    >
                                        <Text className={`text-[13px] font-semibold ${type === m ? "text-black" : "text-gray-500"}`}>
                                            {m === "product" ? "产品" : "耗材"}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Product/Supply Form */}
                    {(type === "product" || type === "supply") && (
                        <View className="mx-4 mb-6 bg-white rounded-2xl overflow-hidden">
                            <View className="border-b border-gray-100">
                                <FormRow label="当前库存">
                                    <NumberInput value={quantity} onChange={setQuantity} placeholder="0" suffix={unit} />
                                </FormRow>
                            </View>
                            <View className="border-b border-gray-100 flex-row items-center justify-between px-4 py-3 bg-white">
                                <Text className="text-[17px] text-black">单位</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 ml-4" contentContainerStyle={{ justifyContent: 'flex-end', paddingRight: 0 }}>
                                    <View className="flex-row gap-2">
                                        {COMMON_UNITS.map((u) => (
                                            <Pressable
                                                key={u}
                                                onPress={() => setUnit(u)}
                                                className={`px-3 py-1.5 rounded-lg border ${unit === u ? "bg-blue-50 border-blue-500" : "bg-gray-50 border-transparent"}`}
                                            >
                                                <Text className={`text-[13px] font-medium ${unit === u ? "text-blue-600" : "text-gray-600"}`}>{u}</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                            <View>
                                <FormRow label="存放位置">
                                    <TextInput
                                        className="text-[17px] text-black text-right flex-1 ml-4"
                                        placeholder="未设置"
                                        placeholderTextColor="#C7C7CC"
                                        value={location}
                                        onChangeText={setLocation}
                                    />
                                </FormRow>
                            </View>
                        </View>
                    )}

                    {/* Phone Form Fields */}
                    {type === "phone" && (
                        <View className="mx-4 mb-6 bg-white rounded-2xl overflow-hidden">
                            <FormRow label="运营商">
                                <TextInput
                                    className="text-[17px] text-black text-right flex-1 ml-4"
                                    placeholder="输入运营商"
                                    placeholderTextColor="#C7C7CC"
                                    value={carrier}
                                    onChangeText={setCarrier}
                                />
                            </FormRow>
                        </View>
                    )}

                    {/* Account Form */}
                    {type === "account" && (
                        <View className="mx-4 mb-6">
                            <View className="flex-row bg-gray-200/50 p-1 rounded-xl mb-4">
                                {(["none", "balance", "times"] as const).map(m => (
                                    <Pressable
                                        key={m}
                                        onPress={() => setAccountType(m)}
                                        className={`flex-1 py-1.5 rounded-[10px] items-center justify-center ${accountType === m ? "bg-white shadow-sm" : ""}`}
                                    >
                                        <Text className={`text-[13px] font-semibold ${accountType === m ? "text-black" : "text-gray-500"}`}>
                                            {m === "none" ? "通用" : m === "balance" ? "余额" : "计次"}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            <View className="bg-white rounded-2xl overflow-hidden">
                                {accountType === "balance" && (
                                    <View className="border-b border-gray-100">
                                        <FormRow label="当前余额">
                                            <NumberInput value={balance} onChange={setBalance} placeholder="0.00" suffix="¥" />
                                        </FormRow>
                                    </View>
                                )}
                                {accountType === "times" && (
                                    <>
                                        <View className="border-b border-gray-100">
                                            <FormRow label="总次数">
                                                <NumberInput value={totalTimes} onChange={setTotalTimes} placeholder="0" suffix="次" />
                                            </FormRow>
                                        </View>
                                        <View className="border-b border-gray-100">
                                            <FormRow label="剩余次数">
                                                <NumberInput value={remainingTimes} onChange={setRemainingTimes} placeholder="0" suffix="次" />
                                            </FormRow>
                                        </View>
                                    </>
                                )}
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
                </BottomSheetScrollView>

                <Modal
                    visible={showDatePicker}
                    transparent
                    animationType="fade"
                    onRequestClose={cancelDateSelection}
                >
                    <Pressable
                        className="flex-1 items-center justify-center bg-black/40"
                        onPress={cancelDateSelection}
                    >
                        <Pressable
                            className="bg-white rounded-2xl w-[85%] overflow-hidden"
                            onPress={() => { }}
                        >
                            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                                <Pressable onPress={cancelDateSelection}>
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

                <Modal
                    visible={showTimePicker}
                    transparent
                    animationType="fade"
                    onRequestClose={cancelTimeSelection}
                >
                    <Pressable
                        className="flex-1 items-center justify-center bg-black/40"
                        onPress={cancelTimeSelection}
                    >
                        <Pressable
                            className="bg-white rounded-2xl w-[80%] overflow-hidden"
                            onPress={() => { }}
                        >
                            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                                <Pressable onPress={cancelTimeSelection}>
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
            </BottomSheetModal >
        );
    }
);
