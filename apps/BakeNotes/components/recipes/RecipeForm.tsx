import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import {
  type BakeStageType,
  type Recipe,
  type RecipeInput,
} from '@/lib/recipes';

type IngredientDraft = {
  name: string;
  grams: string;
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
  padding: 20,
  paddingBottom: 48,
};

const placeholderTextColor = '#b59a84';
const deleteIconColor = '#b42318';

const stageTypeOptions: { value: BakeStageType; label: string }[] = [
  { value: 'preheat', label: '预热' },
  { value: 'bake', label: '烘烤' },
];

const createIngredientDraft = (): IngredientDraft => ({
  name: '',
  grams: '',
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
    recipe?.ingredients.map((item) => ({
      name: item.name,
      grams: item.grams === null ? '' : String(item.grams),
      note: item.note,
    })) ?? [createIngredientDraft()],
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
      grams: toNumberOrNull(item.grams),
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
      <View className="w-full max-w-[560px] self-center">
        <View className="mb-3 rounded-[18px] bg-[#f7f4f0] p-4">
          <Text className="mb-2 text-[13px] font-semibold text-[#3a2a1f]">
            标题
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="比如：基础吐司"
            placeholderTextColor={placeholderTextColor}
            className="rounded-[14px] border border-[#eadfce] bg-[#fffaf5] px-3 py-2.5 text-[15px] text-[#2d1f12]"
          />
        </View>

        <View className="mb-3 rounded-[18px] bg-[#f7f4f0] p-4">
          <Text className="mb-2 text-[13px] font-semibold text-[#3a2a1f]">
            用料
          </Text>
          {ingredients.length === 0 ? (
            <Text className="text-[13px] text-[#9a9a9a]">暂未填写</Text>
          ) : (
            ingredients.map((item, index) => (
              <View
                key={`ingredient-${index}`}
                className="mb-3 rounded-[16px] border border-[#eee2d4] bg-white p-3"
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
                    placeholder="材料名"
                    placeholderTextColor={placeholderTextColor}
                    className="flex-1 rounded-[12px] border border-[#eadfce] bg-[#fffaf5] px-3 py-2 text-[14px] text-[#2d1f12]"
                  />
                  <TextInput
                    value={item.grams}
                    onChangeText={(value) =>
                      setIngredients((prev) =>
                        prev.map((entry, idx) =>
                          idx === index ? { ...entry, grams: value } : entry
                        )
                      )
                    }
                    placeholder="g"
                    placeholderTextColor={placeholderTextColor}
                    keyboardType="numeric"
                    className="w-[68px] rounded-[12px] border border-[#eadfce] bg-[#fffaf5] px-3 py-2 text-[14px] text-[#2d1f12]"
                  />
                  <Pressable
                    onPress={() =>
                      setIngredients((prev) =>
                        prev.filter((_, idx) => idx !== index)
                      )
                    }
                    className="h-9 w-9 items-center justify-center rounded-full bg-[#fcecec]"
                  >
                    <MaterialIcons name="close" size={16} color={deleteIconColor} />
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
                  placeholder="备注（如 1 个 / 适量）"
                  placeholderTextColor={placeholderTextColor}
                  className="mt-2 rounded-[12px] border border-[#eadfce] bg-[#fffaf5] px-3 py-2 text-[14px] text-[#2d1f12]"
                />
              </View>
            ))
          )}
          <Pressable
            onPress={() =>
              setIngredients((prev) => [...prev, createIngredientDraft()])
            }
            className="mt-2 rounded-full bg-[#f3e2d2] px-4 py-2"
          >
            <Text className="text-[13px] font-semibold text-[#6f4b2e]">
              + 添加用料
            </Text>
          </Pressable>
        </View>

        <View className="mb-3 rounded-[18px] bg-[#f7f4f0] p-4">
          <Text className="mb-2 text-[13px] font-semibold text-[#3a2a1f]">
            烘烤参数
          </Text>
          {bakeStages.length === 0 ? (
            <Text className="text-[13px] text-[#9a9a9a]">暂未填写</Text>
          ) : (
            bakeStages.map((stage, index) => (
              <View
                key={`stage-${index}`}
                className="mb-3 rounded-[16px] border border-[#eee2d4] bg-white p-3"
              >
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-[12px] font-semibold text-[#6f4b2e]">
                    阶段 {index + 1}
                  </Text>
                  <Pressable
                    onPress={() =>
                      setBakeStages((prev) =>
                        prev.filter((_, idx) => idx !== index)
                      )
                    }
                    className="h-8 w-8 items-center justify-center rounded-full bg-[#fcecec]"
                  >
                    <MaterialIcons name="close" size={16} color={deleteIconColor} />
                  </Pressable>
                </View>
                <View className="mb-2 flex-row flex-wrap gap-2">
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
                          active ? 'bg-[#2f1f10]' : 'bg-[#f7efe6]'
                        }`}
                      >
                        <Text
                          className={`text-[12px] font-semibold ${
                            active ? 'text-white' : 'text-[#8a6a4d]'
                          }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View className="flex-row gap-4">
                  <View className="flex-1 flex-row items-center gap-2">
                    <Text className="w-8 text-[12px] text-[#8a6a4d]">上火</Text>
                    <TextInput
                      value={stage.topC}
                      onChangeText={(value) =>
                        setBakeStages((prev) =>
                          prev.map((entry, idx) =>
                            idx === index ? { ...entry, topC: value } : entry
                          )
                        )
                      }
                      placeholder="0"
                      placeholderTextColor={placeholderTextColor}
                      keyboardType="numeric"
                      className="w-[80px] rounded-[12px] border border-[#eadfce] bg-[#fffaf5] px-2.5 py-2 text-[13px] text-[#2d1f12]"
                    />
                    <Text className="min-w-[28px] text-[12px] text-[#8a6a4d]">°C</Text>
                  </View>
                  <View className="flex-1 flex-row items-center gap-2">
                    <Text className="w-8 text-[12px] text-[#8a6a4d]">下火</Text>
                    <TextInput
                      value={stage.bottomC}
                      onChangeText={(value) =>
                        setBakeStages((prev) =>
                          prev.map((entry, idx) =>
                            idx === index ? { ...entry, bottomC: value } : entry
                          )
                        )
                      }
                      placeholder="0"
                      placeholderTextColor={placeholderTextColor}
                      keyboardType="numeric"
                      className="w-[80px] rounded-[12px] border border-[#eadfce] bg-[#fffaf5] px-2.5 py-2 text-[13px] text-[#2d1f12]"
                    />
                    <Text className="min-w-[28px] text-[12px] text-[#8a6a4d]">°C</Text>
                  </View>
                </View>
                <View className="mt-2 flex-row gap-4">
                  <View className="flex-1 flex-row items-center gap-2">
                    <Text className="w-8 text-[12px] text-[#8a6a4d]">时长</Text>
                    <TextInput
                      value={stage.minutes}
                      onChangeText={(value) =>
                        setBakeStages((prev) =>
                          prev.map((entry, idx) =>
                            idx === index ? { ...entry, minutes: value } : entry
                          )
                        )
                      }
                      placeholder="0"
                      placeholderTextColor={placeholderTextColor}
                      keyboardType="numeric"
                      className="w-[80px] rounded-[12px] border border-[#eadfce] bg-[#fffaf5] px-2.5 py-2 text-[13px] text-[#2d1f12]"
                    />
                    <Text className="min-w-[28px] text-[12px] text-[#8a6a4d]">
                      分钟
                    </Text>
                  </View>
                  <View className="flex-1 flex-row items-center gap-2">
                    <Text className="w-8 text-[12px] text-[#8a6a4d]">模式</Text>
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
                      className="w-[80px] rounded-[12px] border border-[#eadfce] bg-[#fffaf5] px-2.5 py-2 text-[13px] text-[#2d1f12]"
                    />
                    <Text className="min-w-[28px] text-[12px] text-[#8a6a4d]">
                      {' '}
                    </Text>
                  </View>
                </View>
                <TextInput
                  value={stage.note}
                  onChangeText={(value) =>
                    setBakeStages((prev) =>
                      prev.map((entry, idx) =>
                        idx === index ? { ...entry, note: value } : entry
                      )
                    )
                  }
                  placeholder="备注（如 中层 / 上色加盖锡纸）"
                  placeholderTextColor={placeholderTextColor}
                  className="mt-2 rounded-[12px] border border-[#eadfce] bg-[#fffaf5] px-3 py-2 text-[13px] text-[#2d1f12]"
                />
              </View>
            ))
          )}
          <Pressable
            onPress={() => setBakeStages((prev) => [...prev, createStageDraft()])}
            className="mt-2 rounded-full bg-[#f3e2d2] px-4 py-2"
          >
            <Text className="text-[13px] font-semibold text-[#6f4b2e]">
              + 添加阶段
            </Text>
          </Pressable>
          <TextInput
            value={bakeNotes}
            onChangeText={setBakeNotes}
            placeholder="补充说明（烤箱/模具等）"
            placeholderTextColor={placeholderTextColor}
            className="mt-3 rounded-[14px] border border-[#eadfce] bg-[#fffaf5] px-3 py-2 text-[13px] text-[#2d1f12]"
          />
        </View>

        <View className="mb-3 rounded-[18px] bg-[#f7f4f0] p-4">
          <Text className="mb-2 text-[13px] font-semibold text-[#3a2a1f]">
            步骤
          </Text>
          {steps.length === 0 ? (
            <Text className="text-[13px] text-[#9a9a9a]">暂未填写</Text>
          ) : (
            steps.map((step, index) => (
              <View key={`step-${index}`} className="mb-3">
                <Text className="mb-1 text-[12px] text-[#8a6a4d]">
                  步骤 {index + 1}
                </Text>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={step}
                    onChangeText={(value) =>
                      setSteps((prev) =>
                        prev.map((entry, idx) =>
                          idx === index ? value : entry
                        )
                      )
                    }
                    placeholder="写下操作步骤"
                    placeholderTextColor={placeholderTextColor}
                    className="flex-1 rounded-[14px] border border-[#eadfce] bg-[#fffaf5] px-3 py-2 text-[14px] text-[#2d1f12]"
                  />
                  <Pressable
                    onPress={() =>
                      setSteps((prev) => prev.filter((_, idx) => idx !== index))
                    }
                    className="h-9 w-9 items-center justify-center rounded-full bg-[#fcecec]"
                  >
                    <MaterialIcons name="close" size={16} color={deleteIconColor} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
          <Pressable
            onPress={() => setSteps((prev) => [...prev, ''])}
            className="mt-2 rounded-full bg-[#f3e2d2] px-4 py-2"
          >
            <Text className="text-[13px] font-semibold text-[#6f4b2e]">
              + 添加步骤
            </Text>
          </Pressable>
        </View>

        <View className="mb-4 rounded-[18px] bg-[#f7f4f0] p-4">
          <Text className="mb-2 text-[13px] font-semibold text-[#3a2a1f]">
            备注 / 提示
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="可填写额外说明"
            placeholderTextColor={placeholderTextColor}
            multiline
            className="min-h-[90px] rounded-[14px] border border-[#eadfce] bg-[#fffaf5] px-3 py-2 text-[14px] text-[#2d1f12]"
          />
        </View>

        <View className="gap-3 px-2">
          <Pressable
            onPress={handleSubmit}
            className="items-center rounded-[14px] bg-[#2f1f10] py-3"
          >
            <Text className="text-[15px] font-semibold text-white">
              {submitLabel}
            </Text>
          </Pressable>
          {onCancel ? (
            <Pressable
              onPress={onCancel}
              className="items-center rounded-[14px] border border-[#eadfce] bg-white py-3"
            >
              <Text className="text-[15px] font-semibold text-[#6f4b2e]">
                取消
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
