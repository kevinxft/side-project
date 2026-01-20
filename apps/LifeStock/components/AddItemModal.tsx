import type { ItemType, RecurrenceUnit, ReminderType } from "@/db/schema";
import { itemService, reminderService } from "@/db/services";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback, useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

const TYPE_CONFIG: Record<ItemType, { label: string; icon: string; color: string }> = {
    product: { label: "产品", icon: "cube-outline", color: "#3B82F6" },
    account: { label: "账号", icon: "card-outline", color: "#8B5CF6" },
    phone: { label: "号码", icon: "call-outline", color: "#10B981" },
    supply: { label: "耗材", icon: "brush-outline", color: "#F59E0B" },
    other: { label: "其他", icon: "ellipsis-horizontal-outline", color: "#6B7280" },
};

const COMMON_UNITS = ["个", "件", "包", "盒", "瓶", "袋", "支", "片"];
const CARRIERS = ["中国移动", "中国联通", "中国电信", "中国广电", "Ultra Mobile", "giffgaff", "RedteaGO"];
const RECURRENCE_UNITS: { label: string; value: RecurrenceUnit }[] = [
    { label: "天", value: "day" },
    { label: "周", value: "week" },
    { label: "月", value: "month" },
    { label: "年", value: "year" },
];

interface AddItemSheetProps {
    onClose: () => void;
}

export const AddItemSheet = forwardRef<BottomSheetModal, AddItemSheetProps>(
    ({ onClose }, ref) => {
        const [type, setType] = useState<ItemType>("product");
        const [name, setName] = useState("");
        const [icon, setIcon] = useState("📦");
        const [notes, setNotes] = useState("");

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
            onClose();
        }, [onClose]);

        const handleAddItem = async () => {
            if (!name.trim()) return;

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
                    name: name.trim(),
                    icon,
                    notes: notes.trim() || null,
                    metadata: JSON.stringify(metadata),
                    archived: 0,
                });

                if (hasReminder) {
                    await reminderService.create({
                        itemId: newItem.id,
                        reminderType,
                        title: reminderType === "one_time" ? "到期提醒" : "循环任务",
                        description: notes.trim() || null,
                        dueDate: reminderType === "one_time" ? dueDate || Date.now() : null,
                        recurrenceInterval: reminderType === "recurring" ? parseInt(interval) : null,
                        recurrenceUnit: reminderType === "recurring" ? recUnit : null,
                        startDate: reminderType === "recurring" ? Date.now() : null,
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

        const canSubmit = name.trim().length > 0;

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
                    {/* 名称卡片 */}
                    <View className="mx-4 mb-6 bg-white rounded-2xl overflow-hidden">
                        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                            <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3 border border-gray-100">
                                <Text className="text-[22px]">{icon}</Text>
                            </View>
                            <TextInput
                                className="flex-1 text-[17px] font-medium text-black h-10"
                                placeholder="物品名称"
                                placeholderTextColor="#C7C7CC"
                                value={name}
                                onChangeText={setName}
                                clearButtonMode="while-editing"
                            />
                        </View>
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

                    {/* 类型选择 */}
                    <View className="mb-6">
                        <Text className="px-5 text-[13px] font-medium text-gray-500 mb-2 uppercase tracking-wide">类型</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                        >
                            {(Object.keys(TYPE_CONFIG) as ItemType[]).map((t) => {
                                const config = TYPE_CONFIG[t];
                                const isActive = type === t;
                                return (
                                    <Pressable
                                        key={t}
                                        onPress={() => handleTypeChange(t)}
                                        className={`flex-row items-center px-4 py-2.5 rounded-full border ${isActive ? "bg-black border-black" : "bg-white border-white"}`}
                                        style={!isActive ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 } : {}}
                                    >
                                        <Ionicons
                                            name={config.icon as any}
                                            size={16}
                                            color={isActive ? "#FFF" : "#636366"}
                                        />
                                        <Text
                                            className={`ml-1.5 font-medium text-[14px] ${isActive ? "text-white" : "text-[#1C1C1E]"}`}
                                        >
                                            {config.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>

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

                    {/* Phone Form */}
                    {type === "phone" && (
                        <View className="mx-4 mb-6">
                            <View className="bg-white rounded-2xl overflow-hidden mb-4">
                                <FormRow label="手机号码">
                                    <TextInput
                                        className="text-[17px] text-black text-right flex-1 ml-4"
                                        placeholder="输入号码"
                                        placeholderTextColor="#C7C7CC"
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        keyboardType="phone-pad"
                                    />
                                </FormRow>
                            </View>

                            <Text className="px-5 text-[13px] font-medium text-gray-500 mb-2 uppercase tracking-wide">运营商</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                            >
                                {CARRIERS.map((c) => (
                                    <Pressable
                                        key={c}
                                        onPress={() => setCarrier(c)}
                                        className={`px-4 py-2 rounded-xl border ${carrier === c ? "bg-white border-green-500 shadow-sm" : "bg-white border-transparent"}`}
                                        style={carrier !== c ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } : {}}
                                    >
                                        <Text className={`text-[14px] font-medium ${carrier === c ? "text-green-600" : "text-gray-800"}`}>{c}</Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
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
                                <View>
                                    <FormRow label="商家名称">
                                        <TextInput
                                            className="text-[17px] text-black text-right flex-1 ml-4"
                                            placeholder="未设置"
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
                                                onPress={() => {
                                                    const d = new Date();
                                                    d.setMonth(d.getMonth() + 1);
                                                    setDueDate(d.getTime());
                                                }}
                                                className="bg-gray-100 px-3 py-1.5 rounded-lg"
                                            >
                                                <Text className={`text-[15px] ${dueDate ? "text-blue-600" : "text-gray-400"}`}>
                                                    {dueDate ? new Date(dueDate).toLocaleDateString() : "选择日期"}
                                                </Text>
                                            </Pressable>
                                        </FormRow>
                                    </View>
                                )}

                                <FormRow label="提前提醒">
                                    <NumberInput value={remindDays} onChange={setRemindDays} placeholder="0" suffix="天" />
                                </FormRow>
                            </View>
                        )}
                    </View>
                </BottomSheetScrollView>
            </BottomSheetModal>
        );
    }
);
