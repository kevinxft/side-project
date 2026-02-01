import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import {
  type BakeStageType,
  type IngredientUnit,
  type Recipe,
  type RecipeInput,
} from '@/lib/recipes';

type IngredientDraft = {
  name: string;
  amount: string;
  unit: IngredientUnit;
  note: string;
};

type BakeStageDraft = {
  type: BakeStageType;
  topC: string;
  bottomC: string;
  minutes: string;
  mode: string;
  note: string;
};

type BakeDraft = {
  stages: BakeStageDraft[];
  notes: string;
};

type RecipeDraft = {
  title: string;
  ingredients: IngredientDraft[];
  bake: BakeDraft;
  steps: string[];
  notes: string;
};

type RecipeFormProps = {
  initialValue?: Recipe;
  submitLabel?: string;
  onSubmit: (input: RecipeInput) => void;
  onCancel?: () => void;
  onDraftChange?: (input: RecipeInput) => void;
};

const formContentStyle = {
  paddingHorizontal: 16,
  paddingTop: 24,
  paddingBottom: 72,
};

const primaryColor = '#ee8c2b';
const placeholderTextColor = '#c2c7cf';
const deleteIconColor = '#cbd5e1';

const stageTypeOptions: { value: BakeStageType; label: string }[] = [
  { value: 'preheat', label: '预热' },
  { value: 'bake', label: '烘烤' },
];

const createIngredientDraft = (): IngredientDraft => ({
  name: '',
  amount: '',
  unit: 'g',
  note: '',
});

const createStageDraft = (): BakeStageDraft => ({
  type: 'bake',
  topC: '',
  bottomC: '',
  minutes: '',
  mode: '',
  note: '',
});

const toNumberOrNull = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

const toDraft = (recipe?: Recipe): RecipeDraft => ({
  title: recipe?.title ?? '',
  ingredients:
    recipe?.ingredients.map((item) => {
      const legacyGrams = (item as { grams?: number | null }).grams;
      const amount =
        item.amount !== null && typeof item.amount === 'number'
          ? item.amount
          : typeof legacyGrams === 'number'
            ? legacyGrams
            : null;

      return {
        name: item.name,
        amount: amount === null ? '' : String(amount),
        unit: item.unit ?? 'g',
        note: item.note,
      };
    }) ?? [createIngredientDraft()],
  bake: recipe?.bake
    ? {
        stages: recipe.bake.stages.map((stage) => ({
          type: stage.type,
          topC: stage.topC === null ? '' : String(stage.topC),
          bottomC: stage.bottomC === null ? '' : String(stage.bottomC),
          minutes: stage.minutes === null ? '' : String(stage.minutes),
          mode: stage.mode,
          note: stage.note,
        })),
        notes: recipe.bake.notes,
      }
    : { stages: [], notes: '' },
  steps: recipe?.steps ?? [],
  notes: recipe?.notes ?? '',
});

const toInput = (draft: RecipeDraft): RecipeInput => {
  const ingredients = draft.ingredients
    .map((item) => ({
      name: item.name.trim(),
      amount: toNumberOrNull(item.amount),
      unit: item.unit,
      note: item.note.trim(),
    }))
    .filter((item) => item.name.length > 0);

  const stages = draft.bake.stages
    .map((stage) => ({
      type: stage.type,
      topC: toNumberOrNull(stage.topC),
      bottomC: toNumberOrNull(stage.bottomC),
      minutes: toNumberOrNull(stage.minutes),
      mode: stage.mode.trim(),
      note: stage.note.trim(),
    }))
    .filter((stage) => stage.mode || stage.minutes !== null || stage.topC !== null || stage.bottomC !== null || stage.note);

  const bakeNotes = draft.bake.notes.trim();

  return {
    title: draft.title.trim(),
    ingredients,
    bake: stages.length > 0 || bakeNotes ? { stages, notes: bakeNotes } : null,
    steps: draft.steps.map((step) => step.trim()).filter(Boolean),
    notes: draft.notes.trim(),
  };
};

export function RecipeForm({
  initialValue,
  submitLabel = '保存配方',
  onSubmit,
  onCancel,
  onDraftChange,
}: RecipeFormProps) {
  const initialDraft = useMemo(() => toDraft(initialValue), [initialValue]);
  const [title, setTitle] = useState(initialDraft.title);
  const [ingredients, setIngredients] = useState(initialDraft.ingredients);
  const [bakeStages, setBakeStages] = useState(initialDraft.bake.stages);
  const [bakeNotes, setBakeNotes] = useState(initialDraft.bake.notes);
  const [steps, setSteps] = useState(initialDraft.steps);
  const [notes, setNotes] = useState(initialDraft.notes);

  const draftInput = useMemo(
    () =>
      toInput({
        title,
        ingredients,
        bake: { stages: bakeStages, notes: bakeNotes },
        steps,
        notes,
      }),
    [title, ingredients, bakeStages, bakeNotes, steps, notes]
  );

  useEffect(() => {
    onDraftChange?.(draftInput);
  }, [draftInput, onDraftChange]);

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('标题必填', '请先填写配方标题。');
      return;
    }

    onSubmit(draftInput);
  };

  return (
    <ScrollView
      contentContainerStyle={formContentStyle}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="w-full max-w-[420px] self-center">
        <View className="mb-5 rounded-[20px] bg-white p-5 shadow-sm">
          <Text className="mb-1.5 text-[14px] font-semibold text-[#1c1c1c]">
            配方名称
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="例如：法式手工牛角包"
            placeholderTextColor={placeholderTextColor}
            className="h-12 rounded-xl border border-[#f1f5f9] bg-[#f8fafc] px-4 text-[15px] text-[#1c1c1c]"
          />
        </View>

        <View className="mb-5 rounded-[20px] bg-white p-5 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="restaurant-menu" size={18} color={primaryColor} />
              <Text className="text-[16px] font-semibold text-[#1c1c1c]">
                用料清单
              </Text>
            </View>
            <Pressable
              onPress={() =>
                setIngredients((prev) => [...prev, createIngredientDraft()])
              }
              className="flex-row items-center gap-1 rounded-full bg-[#ee8c2b]/10 px-3 py-1.5"
            >
              <MaterialIcons name="add" size={14} color={primaryColor} />
              <Text className="text-[12px] font-semibold text-[#ee8c2b]">
                添加食材
              </Text>
            </Pressable>
          </View>
          {ingredients.length === 0 ? (
            <Text className="text-[12px] text-[#9ca3af]">暂未填写</Text>
          ) : (
            ingredients.map((item, index) => (
              <View
                key={`ingredient-${index}`}
                className="mb-3 border-b border-[#f1f5f9] pb-3 last:mb-0 last:border-b-0 last:pb-0"
              >
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={item.name}
                    onChangeText={(value) =>
                      setIngredients((prev) =>
                        prev.map((entry, idx) =>
                          idx === index ? { ...entry, name: value } : entry
                        )
                      )
                    }
                    placeholder="食材"
                    placeholderTextColor={placeholderTextColor}
                    className="flex-1 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-3 py-2.5 text-[13px] text-[#1c1c1c]"
                  />
                  <TextInput
                    value={item.amount}
                    onChangeText={(value) =>
                      setIngredients((prev) =>
                        prev.map((entry, idx) =>
                          idx === index ? { ...entry, amount: value } : entry
                        )
                      )
                    }
                    placeholder="0"
                    placeholderTextColor={placeholderTextColor}
                    keyboardType="numeric"
                    className="w-[72px] rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-2 text-center text-[13px] text-[#1c1c1c]"
                  />
                  <View className="w-[72px] flex-row items-center justify-center rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-1 py-2.5">
                    {(['g', 'ml', '个'] as const).map((unit) => {
                      const active = item.unit === unit;
                      return (
                        <Pressable
                          key={`${index}-${unit}`}
                          onPress={() =>
                            setIngredients((prev) =>
                              prev.map((entry, idx) =>
                                idx === index ? { ...entry, unit } : entry
                              )
                            )
                          }
                          className={`rounded-full px-1.5 py-0.5 ${
                            active ? 'bg-[#ee8c2b]' : 'bg-transparent'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-semibold ${
                              active ? 'text-white' : 'text-[#94a3b8]'
                            }`}
                          >
                            {unit}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Pressable
                    onPress={() =>
                      setIngredients((prev) =>
                        prev.filter((_, idx) => idx !== index)
                      )
                    }
                    className="h-8 w-8 items-center justify-center"
                  >
                    <MaterialIcons name="close" size={18} color={deleteIconColor} />
                  </Pressable>
                </View>
                <TextInput
                  value={item.note}
                  onChangeText={(value) =>
                    setIngredients((prev) =>
                      prev.map((entry, idx) =>
                        idx === index ? { ...entry, note: value } : entry
                      )
                    )
                  }
                  placeholder="添加备注（如：过筛）"
                  placeholderTextColor={placeholderTextColor}
                  className="mt-2 h-8 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-3 text-[11px] text-[#1c1c1c]"
                />
              </View>
            ))
          )}
        </View>

        <View className="mb-5 rounded-[20px] bg-white p-5 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="timer" size={18} color={primaryColor} />
              <Text className="text-[16px] font-semibold text-[#1c1c1c]">
                烘焙设置
              </Text>
            </View>
            <Pressable
              onPress={() => setBakeStages((prev) => [...prev, createStageDraft()])}
              className="flex-row items-center gap-1 rounded-full bg-[#ee8c2b]/10 px-3 py-1.5"
            >
              <MaterialIcons name="add" size={14} color={primaryColor} />
              <Text className="text-[12px] font-semibold text-[#ee8c2b]">
                添加阶段
              </Text>
            </Pressable>
          </View>
          {bakeStages.length === 0 ? (
            <Text className="text-[12px] text-[#9ca3af]">暂未填写</Text>
          ) : (
            bakeStages.map((stage, index) => (
              <View
                key={`stage-${index}`}
                className="mb-4 rounded-xl border border-[#f1f5f9] bg-white p-4"
              >
                <Pressable
                  onPress={() =>
                    setBakeStages((prev) =>
                      prev.filter((_, idx) => idx !== index)
                    )
                  }
                  className="absolute -right-2 -top-2 h-7 w-7 items-center justify-center rounded-full border border-[#f1f5f9] bg-white"
                >
                  <MaterialIcons name="close" size={14} color={deleteIconColor} />
                </Pressable>
                <View className="mb-3 flex-row flex-wrap gap-2">
                  {stageTypeOptions.map((option) => {
                    const active = stage.type === option.value;
                    return (
                      <Pressable
                        key={`${index}-${option.value}`}
                        onPress={() =>
                          setBakeStages((prev) =>
                            prev.map((entry, idx) =>
                              idx === index
                                ? { ...entry, type: option.value }
                                : entry
                            )
                          )
                        }
                        className={`rounded-full px-3 py-1 ${
                          active ? 'bg-[#ee8c2b]' : 'bg-[#f1f5f9]'
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-semibold ${
                            active ? 'text-white' : 'text-[#94a3b8]'
                          }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View className="flex-row gap-4">
                  <View className="flex-1 gap-1.5">
                    <Text className="ml-1 text-[10px] font-bold uppercase text-[#94a3b8]">
                      上管温度
                    </Text>
                    <View className="flex-row items-center gap-2 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-3">
                      <TextInput
                        value={stage.topC}
                        onChangeText={(value) =>
                          setBakeStages((prev) =>
                            prev.map((entry, idx) =>
                              idx === index ? { ...entry, topC: value } : entry
                            )
                          )
                        }
                        placeholder="180"
                        placeholderTextColor={placeholderTextColor}
                        keyboardType="numeric"
                        className="flex-1 py-2 text-[13px] text-[#1c1c1c]"
                      />
                      <Text className="text-[10px] text-[#94a3b8]">℃</Text>
                    </View>
                  </View>
                  <View className="flex-1 gap-1.5">
                    <Text className="ml-1 text-[10px] font-bold uppercase text-[#94a3b8]">
                      下管温度
                    </Text>
                    <View className="flex-row items-center gap-2 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-3">
                      <TextInput
                        value={stage.bottomC}
                        onChangeText={(value) =>
                          setBakeStages((prev) =>
                            prev.map((entry, idx) =>
                              idx === index ? { ...entry, bottomC: value } : entry
                            )
                          )
                        }
                        placeholder="180"
                        placeholderTextColor={placeholderTextColor}
                        keyboardType="numeric"
                        className="flex-1 py-2 text-[13px] text-[#1c1c1c]"
                      />
                      <Text className="text-[10px] text-[#94a3b8]">℃</Text>
                    </View>
                  </View>
                </View>
                <View className="mt-3 flex-row gap-4">
                  <View className="flex-1 gap-1.5">
                    <Text className="ml-1 text-[10px] font-bold uppercase text-[#94a3b8]">
                      时间 (分钟)
                    </Text>
                    <TextInput
                      value={stage.minutes}
                      onChangeText={(value) =>
                        setBakeStages((prev) =>
                          prev.map((entry, idx) =>
                            idx === index ? { ...entry, minutes: value } : entry
                          )
                        )
                      }
                      placeholder="25"
                      placeholderTextColor={placeholderTextColor}
                      keyboardType="numeric"
                      className="h-10 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-3 text-[13px] text-[#1c1c1c]"
                    />
                  </View>
                  <View className="flex-1 gap-1.5">
                    <Text className="ml-1 text-[10px] font-bold uppercase text-[#94a3b8]">
                      模式
                    </Text>
                    <TextInput
                      value={stage.mode}
                      onChangeText={(value) =>
                        setBakeStages((prev) =>
                          prev.map((entry, idx) =>
                            idx === index ? { ...entry, mode: value } : entry
                          )
                        )
                      }
                      placeholder="上下火"
                      placeholderTextColor={placeholderTextColor}
                      className="h-10 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-3 text-[13px] text-[#1c1c1c]"
                    />
                  </View>
                </View>
                <View className="mt-3 gap-1.5">
                  <Text className="ml-1 text-[10px] font-bold uppercase text-[#94a3b8]">
                    备注
                  </Text>
                  <TextInput
                    value={stage.note}
                    onChangeText={(value) =>
                      setBakeStages((prev) =>
                        prev.map((entry, idx) =>
                          idx === index ? { ...entry, note: value } : entry
                        )
                      )
                    }
                    placeholder="例如：放入中层"
                    placeholderTextColor={placeholderTextColor}
                    className="h-10 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-3 text-[13px] text-[#1c1c1c]"
                  />
                </View>
              </View>
            ))
          )}
          <View className="mt-2 gap-1.5">
            <Text className="ml-1 text-[10px] font-bold uppercase text-[#94a3b8]">
              烤箱补充
            </Text>
            <TextInput
              value={bakeNotes}
              onChangeText={setBakeNotes}
              placeholder="例如：模具尺寸、烤箱层位"
              placeholderTextColor={placeholderTextColor}
              className="h-10 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-3 text-[13px] text-[#1c1c1c]"
            />
          </View>
        </View>

        <View className="mb-5 rounded-[20px] bg-white p-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="format-list-numbered" size={18} color={primaryColor} />
              <Text className="text-[16px] font-semibold text-[#1c1c1c]">
                制作步骤
              </Text>
            </View>
            <Pressable
              onPress={() => setSteps((prev) => [...prev, ''])}
              className="flex-row items-center gap-1 rounded-full bg-[#ee8c2b]/10 px-3 py-1.5"
            >
              <MaterialIcons name="add" size={14} color={primaryColor} />
              <Text className="text-[12px] font-semibold text-[#ee8c2b]">
                添加步骤
              </Text>
            </Pressable>
          </View>
          <View className="mt-4 gap-4">
            {steps.length === 0 ? (
              <Text className="text-[12px] text-[#9ca3af]">暂未填写</Text>
            ) : (
              steps.map((step, index) => (
                <View
                  key={`step-${index}`}
                  className="rounded-[16px] border border-[#f1f5f9] bg-[#f8fafc] p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-[#ee8c2b]">
                        <Text className="text-[10px] font-semibold text-white">
                          {index + 1}
                        </Text>
                      </View>
                      <Text className="text-[12px] font-semibold text-[#64748b]">
                        步骤描述
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        setSteps((prev) => prev.filter((_, idx) => idx !== index))
                      }
                    >
                      <MaterialIcons name="delete" size={20} color={deleteIconColor} />
                    </Pressable>
                  </View>
                  <TextInput
                    value={step}
                    onChangeText={(value) =>
                      setSteps((prev) =>
                        prev.map((entry, idx) =>
                          idx === index ? value : entry
                        )
                      )
                    }
                    placeholder="输入制作详情..."
                    placeholderTextColor={placeholderTextColor}
                    multiline
                    className="mt-3 min-h-[80px] rounded-xl border border-[#e2e8f0] bg-white p-3 text-[13px] text-[#1c1c1c]"
                  />
                </View>
              ))
            )}
          </View>
        </View>

        <View className="mb-6 rounded-[20px] bg-white p-5 shadow-sm">
          <View className="flex-row items-center gap-2">
            <MaterialIcons name="note" size={18} color={primaryColor} />
            <Text className="text-[14px] font-semibold text-[#1c1c1c]">
              配方备注
            </Text>
          </View>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="例如：注意事项、储存方式或口感建议..."
            placeholderTextColor={placeholderTextColor}
            multiline
            className="mt-3 min-h-[100px] rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3 text-[13px] text-[#1c1c1c]"
          />
        </View>

        <View className="gap-3">
          <Pressable
            onPress={handleSubmit}
            className="items-center rounded-[18px] bg-[#ee8c2b] py-4 shadow-lg shadow-[#ee8c2b]/20"
          >
            <Text className="text-[15px] font-semibold text-white">
              {submitLabel}
            </Text>
          </Pressable>
          {onCancel ? (
            <Pressable
              onPress={onCancel}
              className="items-center rounded-[18px] border border-[#f1f5f9] bg-white py-3"
            >
              <Text className="text-[15px] font-semibold text-[#64748b]">
                取消
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
