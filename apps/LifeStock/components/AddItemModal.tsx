import type { ItemKind } from "@/db/schema";
import { itemService } from "@/db/services";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback, useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

const KIND_CONFIG: Record<ItemKind, { label: string; icon: string; color: string }> = {
    stock: { label: "库存", icon: "cube-outline", color: "#3B82F6" },
    card: { label: "卡券", icon: "card-outline", color: "#8B5CF6" },
    phone: { label: "号码", icon: "call-outline", color: "#10B981" },
};

const COMMON_UNITS = ["个", "件", "包", "盒", "瓶", "袋", "支", "片"];
const CARRIERS = ["中国移动", "中国联通", "中国电信", "中国广电"];
const BILLING_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

type CardMode = "balance" | "times";

interface AddItemSheetProps {
    onClose: () => void;
}

export const AddItemSheet = forwardRef<BottomSheetModal, AddItemSheetProps>(
    ({ onClose }, ref) => {
        const [kind, setKind] = useState<ItemKind>("stock");
        const [name, setName] = useState("");
        const [icon, setIcon] = useState("📦");
        const [notes, setNotes] = useState("");

        const [quantity, setQuantity] = useState("");
        const [unit, setUnit] = useState("个");
        const [minQuantity, setMinQuantity] = useState("");
        const [location, setLocation] = useState("");

        const [cardMode, setCardMode] = useState<CardMode>("balance");
        const [balance, setBalance] = useState("");
        const [totalTimes, setTotalTimes] = useState("");
        const [remainingTimes, setRemainingTimes] = useState("");
        const [merchantName, setMerchantName] = useState("");
        const [merchantPhone, setMerchantPhone] = useState("");

        const [phoneNumber, setPhoneNumber] = useState("");
        const [carrier, setCarrier] = useState("");
        const [monthlyFee, setMonthlyFee] = useState("");
        const [billingDate, setBillingDate] = useState<number | null>(null);

        const snapPoints = useMemo(() => ["95%"], []);

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
            setMerchantPhone("");
            setPhoneNumber("");
            setCarrier("");
            setMonthlyFee("");
            setBillingDate(null);
            onClose();
        }, [onClose]);

        const handleAddItem = async () => {
            if (!name.trim()) return;

            try {
                if (kind === "stock") {
                    await itemService.create({
                        kind: "stock",
                        name: name.trim(),
                        icon,
                        notes: notes.trim() || null,
                        quantity: quantity ? parseFloat(quantity) : null,
                        unit: unit || null,
                        minQuantity: minQuantity ? parseFloat(minQuantity) : null,
                        location: location.trim() || null,
                    });
                } else if (kind === "card") {
                    await itemService.create({
                        kind: "card",
                        name: name.trim(),
                        icon,
                        notes: notes.trim() || null,
                        balance: cardMode === "balance" && balance ? parseFloat(balance) : null,
                        totalTimes: cardMode === "times" && totalTimes ? parseInt(totalTimes) : null,
                        remainingTimes: cardMode === "times" && remainingTimes ? parseInt(remainingTimes) : null,
                        merchantName: merchantName.trim() || null,
                        merchantPhone: merchantPhone.trim() || null,
                    });
                } else if (kind === "phone") {
                    await itemService.create({
                        kind: "phone",
                        name: name.trim(),
                        icon,
                        notes: notes.trim() || null,
                        phoneNumber: phoneNumber.trim() || null,
                        carrier: carrier || null,
                        monthlyFee: monthlyFee ? parseFloat(monthlyFee) : null,
                        billingDate: billingDate,
                    });
                }
                handleClose();
            } catch (error) {
                console.error("保存失败:", error);
            }
        };

        const canSubmit = name.trim().length > 0;

        const handleKindChange = (newKind: ItemKind) => {
            setKind(newKind);
            if (newKind === "stock") setIcon("📦");
            else if (newKind === "card") setIcon("💳");
            else if (newKind === "phone") setIcon("📱");
        };

        const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
            <View className="flex-row items-center justify-between px-4 py-4 bg-white/50 rounded-2xl border border-white mb-3">
                <Text className="text-[15px] font-bold text-gray-800">{label}</Text>
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
            <View className="flex-row items-center bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                <TextInput
                    className="text-[16px] font-bold text-black text-right min-w-[60px]"
                    placeholder={placeholder}
                    placeholderTextColor="#AEAEB2"
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={onChange}
                />
                {suffix && <Text className="ml-2 text-gray-400 font-bold">{suffix}</Text>}
            </View>
        );

        return (
            <BottomSheetModal
                ref={ref}
                snapPoints={snapPoints}
                enablePanDownToClose
                backgroundStyle={{ backgroundColor: "#F2F2F7" }}
                handleIndicatorStyle={{ backgroundColor: "#C7C7CC", width: 36 }}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-3">
                    <Pressable
                        onPress={handleClose}
                        className="px-4 h-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100"
                    >
                        <Text className="text-[15px] font-bold text-black">取消</Text>
                    </Pressable>

                    <Text className="text-[17px] font-bold text-black">添加物品</Text>

                    <Pressable
                        onPress={handleAddItem}
                        className={`px-4 h-10 items-center justify-center rounded-full shadow-sm border border-gray-100 ${canSubmit ? "bg-white" : "bg-gray-50/50"}`}
                        disabled={!canSubmit}
                    >
                        <Text className={`text-[15px] font-bold ${canSubmit ? "text-[#007AFF]" : "text-[#AEAEB2]"}`}>保存</Text>
                    </Pressable>
                </View>

                <BottomSheetScrollView
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 80 }}
                    keyboardShouldPersistTaps="handled"
                >
                        {/* 类型切换器 */}
                        <View className="mx-6 mb-8">
                            <View className="flex-row bg-[#E3E3E8] rounded-[20px] p-1">
                                {(Object.keys(KIND_CONFIG) as ItemKind[]).map((k) => {
                                    const config = KIND_CONFIG[k];
                                    const isActive = kind === k;
                                    return (
                                        <Pressable
                                            key={k}
                                            onPress={() => handleKindChange(k)}
                                            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-[15px] ${isActive ? "bg-white shadow-md" : ""}`}
                                        >
                                            <Ionicons
                                                name={config.icon as any}
                                                size={16}
                                                color={isActive ? config.color : "#636366"}
                                            />
                                            <Text
                                                className={`ml-2 font-bold text-[13px] ${isActive ? "text-black" : "text-[#636366]"}`}
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

                        {/* Stock 表单 */}
                        {kind === "stock" && (
                            <View className="mx-6 mb-6">
                                <View className="bg-white/60 rounded-[32px] border border-white shadow-sm p-4">
                                    <FormRow label="当前库存">
                                        <NumberInput
                                            value={quantity}
                                            onChange={setQuantity}
                                            placeholder="0"
                                            suffix={unit}
                                        />
                                    </FormRow>

                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                                        <View className="flex-row gap-2.5 px-1">
                                            {COMMON_UNITS.map((u) => (
                                                <Pressable
                                                    key={u}
                                                    onPress={() => setUnit(u)}
                                                    className={`px-5 py-2.5 rounded-2xl border ${unit === u ? "bg-blue-500 border-blue-400 shadow-md" : "bg-white border-gray-100"}`}
                                                >
                                                    <Text className={`text-[13px] font-bold ${unit === u ? "text-white" : "text-gray-600"}`}>
                                                        {u}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </ScrollView>

                                    <FormRow label="警戒库存">
                                        <NumberInput
                                            value={minQuantity}
                                            onChange={setMinQuantity}
                                            placeholder="低于提醒"
                                            suffix={unit}
                                        />
                                    </FormRow>

                                    <FormRow label="存放位置">
                                        <TextInput
                                            className="text-[15px] text-black text-right flex-1 ml-4"
                                            placeholder="哪儿找它？"
                                            placeholderTextColor="#AEAEB2"
                                            value={location}
                                            onChangeText={setLocation}
                                        />
                                    </FormRow>
                                </View>
                            </View>
                        )}

                        {/* Card 表单 */}
                        {kind === "card" && (
                            <View className="mx-6 mb-6">
                                <View className="bg-white/60 rounded-[32px] border border-white shadow-sm p-4">
                                    <View className="flex-row bg-[#E3E3E8] rounded-2xl p-1 mb-4">
                                        <Pressable
                                            onPress={() => setCardMode("balance")}
                                            className={`flex-1 py-2.5 rounded-xl ${cardMode === "balance" ? "bg-white shadow-sm" : ""}`}
                                        >
                                            <Text className={`text-center text-[13px] font-bold ${cardMode === "balance" ? "text-black" : "text-gray-500"}`}>
                                                储值卡
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => setCardMode("times")}
                                            className={`flex-1 py-2.5 rounded-xl ${cardMode === "times" ? "bg-white shadow-sm" : ""}`}
                                        >
                                            <Text className={`text-center text-[13px] font-bold ${cardMode === "times" ? "text-black" : "text-gray-500"}`}>
                                                次卡
                                            </Text>
                                        </Pressable>
                                    </View>

                                    {cardMode === "balance" && (
                                        <FormRow label="当前余额">
                                            <NumberInput
                                                value={balance}
                                                onChange={setBalance}
                                                placeholder="0.00"
                                                suffix="元"
                                            />
                                        </FormRow>
                                    )}

                                    {cardMode === "times" && (
                                        <>
                                            <FormRow label="总次数">
                                                <NumberInput
                                                    value={totalTimes}
                                                    onChange={setTotalTimes}
                                                    placeholder="0"
                                                    suffix="次"
                                                />
                                            </FormRow>
                                            <FormRow label="剩余次数">
                                                <NumberInput
                                                    value={remainingTimes}
                                                    onChange={setRemainingTimes}
                                                    placeholder="0"
                                                    suffix="次"
                                                />
                                            </FormRow>
                                        </>
                                    )}

                                    <View className="mt-2 pt-4 border-t border-gray-100">
                                        <Text className="text-[13px] font-bold text-gray-400 mb-3 px-2">商家信息</Text>
                                        <FormRow label="商家名称">
                                            <TextInput
                                                className="text-[15px] text-black text-right flex-1 ml-4"
                                                placeholder="输入商家名称"
                                                placeholderTextColor="#AEAEB2"
                                                value={merchantName}
                                                onChangeText={setMerchantName}
                                            />
                                        </FormRow>
                                        <FormRow label="商家电话">
                                            <TextInput
                                                className="text-[15px] text-black text-right flex-1 ml-4"
                                                placeholder="输入联系电话"
                                                placeholderTextColor="#AEAEB2"
                                                value={merchantPhone}
                                                onChangeText={setMerchantPhone}
                                                keyboardType="phone-pad"
                                            />
                                        </FormRow>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Phone 表单 */}
                        {kind === "phone" && (
                            <View className="mx-6 mb-6">
                                <View className="bg-white/60 rounded-[32px] border border-white shadow-sm p-4">
                                    <FormRow label="手机号码">
                                        <TextInput
                                            className="text-[16px] font-bold text-black text-right flex-1 ml-4"
                                            placeholder="输入手机号"
                                            placeholderTextColor="#AEAEB2"
                                            value={phoneNumber}
                                            onChangeText={setPhoneNumber}
                                            keyboardType="phone-pad"
                                        />
                                    </FormRow>

                                    <Text className="text-[13px] font-bold text-gray-400 mb-3 px-2">运营商</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                                        <View className="flex-row gap-2.5 px-1">
                                            {CARRIERS.map((c) => (
                                                <Pressable
                                                    key={c}
                                                    onPress={() => setCarrier(c)}
                                                    className={`px-5 py-2.5 rounded-2xl border ${carrier === c ? "bg-green-500 border-green-400 shadow-md" : "bg-white border-gray-100"}`}
                                                >
                                                    <Text className={`text-[13px] font-bold ${carrier === c ? "text-white" : "text-gray-600"}`}>
                                                        {c}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </ScrollView>

                                    <FormRow label="月租费用">
                                        <NumberInput
                                            value={monthlyFee}
                                            onChange={setMonthlyFee}
                                            placeholder="0.00"
                                            suffix="元/月"
                                        />
                                    </FormRow>

                                    <Text className="text-[13px] font-bold text-gray-400 mb-3 px-2 mt-2">扣费日</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                                        <View className="flex-row gap-2 px-1">
                                            {BILLING_DAYS.map((day) => (
                                                <Pressable
                                                    key={day}
                                                    onPress={() => setBillingDate(day)}
                                                    className={`w-10 h-10 rounded-full items-center justify-center border ${billingDate === day ? "bg-green-500 border-green-400 shadow-md" : "bg-white border-gray-100"}`}
                                                >
                                                    <Text className={`text-[13px] font-bold ${billingDate === day ? "text-white" : "text-gray-600"}`}>
                                                        {day}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            </View>
                        )}
                    </BottomSheetScrollView>
            </BottomSheetModal>
        );
    }
);
