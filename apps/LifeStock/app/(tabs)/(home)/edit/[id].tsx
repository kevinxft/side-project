import type { ItemType } from "@/db/schema";
import { itemService } from "@/db/services";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

const TYPE_CONFIG: Record<ItemType, { label: string; icon: string; color: string }> = {
  product: { label: "产品", icon: "cube-outline", color: "#3B82F6" },
  account: { label: "账号", icon: "card-outline", color: "#8B5CF6" },
  phone: { label: "号码", icon: "call-outline", color: "#10B981" },
  supply: { label: "耗材", icon: "brush-outline", color: "#F59E0B" },
  other: { label: "其他", icon: "ellipsis-horizontal-outline", color: "#6B7280" },
};

const DEFAULT_ICONS: Record<ItemType, string> = {
  product: "📦",
  account: "💳",
  phone: "📱",
  supply: "🪥",
  other: "📁",
};

const COMMON_UNITS = ["个", "件", "包", "盒", "瓶", "袋", "支", "片"];
// const CARRIERS = [
//   "中国移动",
//   "中国联通",
//   "中国电信",
//   "中国广电",
//   "Ultra Mobile",
//   "giffgaff",
//   "RedteaGO",
// ];

type AccountType = "balance" | "times" | "none";

interface FormRowProps {
  label: string;
  children: React.ReactNode;
}

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  suffix?: string;
}

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

const FormRow = ({ label, children }: FormRowProps) => (
  <View className="flex-row items-center justify-between px-4 py-4 bg-white/50 rounded-2xl border border-white mb-3">
    <Text className="text-[15px] font-bold text-gray-800">{label}</Text>
    {children}
  </View>
);

const NumberInput = ({ value, onChange, placeholder, suffix }: NumberInputProps) => (
  <View className="flex-row items-center bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
    <TextInput
      className="text-[16px] font-bold text-black text-right min-w-[60px]"
      placeholder={placeholder}
      placeholderTextColor="#AEAEB2"
      keyboardType="decimal-pad"
      value={value}
      onChangeText={onChange}
    />
    {suffix ? <Text className="ml-2 text-gray-400 font-bold">{suffix}</Text> : null}
  </View>
);

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMissing, setIsMissing] = useState(false);
  const [rawMetadata, setRawMetadata] = useState<Record<string, unknown>>({});
  const [originalType, setOriginalType] = useState<ItemType | null>(null);

  const [type, setType] = useState<ItemType>("product");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICONS.product);
  const [notes, setNotes] = useState("");

  // Product/Supply fields
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

    if (itemType === "product" || itemType === "supply") {
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
      if (type === "product" || type === "supply") {
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
  ]);

  const canSubmit = name.trim().length > 0 && !saving && !loading && !isMissing;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "编辑物品",
          headerRight: () => (
            <Pressable className="px-2" onPress={handleSave} disabled={!canSubmit}>
              <Text
                className={`text-[16px] font-bold ${canSubmit ? "text-[#007AFF]" : "text-[#AEAEB2]"}`}
              >
                保存
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
                    style={{ width: "20%" }}
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

          {/* Product/Supply Form */}
          {(type === "product" || type === "supply") && (
            <View className="mx-6 mb-6">
              <View className="bg-white/60 rounded-[32px] border border-white shadow-sm p-4">
                <FormRow label="当前库存">
                  <NumberInput value={quantity} onChange={setQuantity} placeholder="0" suffix={unit} />
                </FormRow>
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
                <FormRow label="存放位置">
                  <TextInput
                    className="text-[15px] text-black text-right flex-1 ml-4"
                    placeholder="在哪儿？"
                    value={location}
                    onChangeText={setLocation}
                  />
                </FormRow>
              </View>
            </View>
          )}

          {/* Phone Form */}
          {type === "phone" && (
            <View className="mx-6 mb-6">
              <View className="bg-white/60 rounded-[32px] border border-white shadow-sm p-4">
                <FormRow label="手机号码">
                  <TextInput
                    className="text-[16px] font-bold text-black text-right flex-1 ml-4"
                    placeholder="输入手机号"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                </FormRow>
                <FormRow label="运营商">
                  <TextInput
                    className="text-[16px] font-bold text-black text-right flex-1 ml-4"
                    placeholder="输入运营商"
                    value={carrier}
                    onChangeText={setCarrier}
                  />
                </FormRow>
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
                  <FormRow label="当前余额">
                    <NumberInput value={balance} onChange={setBalance} placeholder="0.00" suffix="元" />
                  </FormRow>
                )}
                {accountType === "times" && (
                  <>
                    <FormRow label="总次数">
                      <NumberInput value={totalTimes} onChange={setTotalTimes} placeholder="0" suffix="次" />
                    </FormRow>
                    <FormRow label="剩余次数">
                      <NumberInput value={remainingTimes} onChange={setRemainingTimes} placeholder="0" suffix="次" />
                    </FormRow>
                  </>
                )}
                <FormRow label="商家名称">
                  <TextInput
                    className="text-[15px] text-black text-right flex-1 ml-4"
                    placeholder="输入商家"
                    value={merchantName}
                    onChangeText={setMerchantName}
                  />
                </FormRow>
              </View>
            </View>
          )}

          <View className="h-10" />
        </ScrollView>
      )}
    </>
  );
}
