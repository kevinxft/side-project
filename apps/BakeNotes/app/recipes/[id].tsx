import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { useRecipeStore } from '@/lib/recipes';

const stageTypeLabel: Record<string, string> = {
  preheat: '预热',
  bake: '烘烤',
  rest: '静置',
  other: '其他',
};

const formatNumber = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return '-';
  return String(value);
};

const detailContentStyle = { padding: 20, paddingBottom: 40 };

const EmptyLine = () => <Text className="text-[13px] text-[#9a9a9a]">暂无</Text>;

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

const Section = ({ title, children }: SectionProps) => (
  <View className="mb-5 rounded-[18px] bg-[#f7f4f0] p-4">
    <Text className="text-[15px] font-semibold text-[#1f1f1f]">{title}</Text>
    <View className="mt-2.5">{children}</View>
  </View>
);

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const recipe = useRecipeStore((state) =>
    state.recipes.find((item) => item.id === recipeId)
  );
  const deleteRecipe = useRecipeStore((state) => state.deleteRecipe);

  const handleDelete = () => {
    if (!recipe) return;
    Alert.alert('删除配方', '确认删除这条配方吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          deleteRecipe(recipe.id);
          router.replace('/');
        },
      },
    ]);
  };

  if (!recipe) {
    return (
      <View className="flex-1 bg-white">
        <Stack.Screen options={{ title: '配方详情', headerShown: true }} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[16px] font-semibold text-[#1f1f1f]">
            未找到该配方
          </Text>
          <Pressable
            className="mt-4 rounded-[10px] bg-[#f7f4f0] px-5 py-2.5"
            onPress={() => router.replace('/')}
          >
            <Text className="text-[14px] text-[#1f1f1f]">返回列表</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: recipe.title,
          headerShown: true,
          headerRight: () => (
            <Pressable onPress={() => router.push(`/recipes/${recipe.id}/edit`)}>
              <Text className="text-[14px] font-semibold text-[#b86b2f]">编辑</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={detailContentStyle}>
        <Section title="用料">
          {recipe.ingredients.length === 0 ? (
            <EmptyLine />
          ) : (
            recipe.ingredients.map((item, index) => {
              const detail = [
                item.grams !== null ? `${item.grams} g` : null,
                item.note?.trim() ? item.note : null,
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <Text key={`${item.name}-${index}`} className="mb-1.5 text-[14px] leading-5 text-[#1f1f1f]">
                  {item.name}
                  {detail ? (
                    <Text className="text-[12px] text-[#7a7a7a]">  {detail}</Text>
                  ) : null}
                </Text>
              );
            })
          )}
        </Section>

        <Section title="步骤">
          {recipe.steps.length === 0 ? (
            <EmptyLine />
          ) : (
            recipe.steps.map((step, index) => (
              <Text key={`${index}-${step}`} className="mb-1.5 text-[14px] leading-5 text-[#1f1f1f]">
                <Text className="font-semibold">{index + 1}. </Text>
                {step}
              </Text>
            ))
          )}
        </Section>

        <Section title="烘烤参数">
          {!recipe.bake || recipe.bake.stages.length === 0 ? (
            <EmptyLine />
          ) : (
            recipe.bake.stages.map((stage, index) => (
              <View key={`${stage.type}-${index}`} className="mb-3">
                <Text className="mb-1.5 text-[14px] leading-5 text-[#1f1f1f]">
                  {stageTypeLabel[stage.type] ?? stage.type} ·{' '}
                  {formatNumber(stage.minutes)} 分钟
                </Text>
                <Text className="text-[12px] text-[#7a7a7a]">
                  上火 {formatNumber(stage.topC)}°C · 下火{' '}
                  {formatNumber(stage.bottomC)}°C · {stage.mode || '未填写'}
                </Text>
                {stage.note ? (
                  <Text className="mt-1 text-[12px] text-[#666]">{stage.note}</Text>
                ) : null}
              </View>
            ))
          )}
          {recipe.bake?.notes ? (
            <Text className="mt-1 text-[12px] text-[#666]">{recipe.bake.notes}</Text>
          ) : null}
        </Section>

        <Section title="要点提示">
          {recipe.tips.length === 0 ? (
            <EmptyLine />
          ) : (
            recipe.tips.map((tip, index) => (
              <Text key={`${index}-${tip}`} className="mb-1.5 text-[14px] leading-5 text-[#1f1f1f]">
                · {tip}
              </Text>
            ))
          )}
        </Section>

        <Section title="备注">
          {recipe.notes ? (
            <Text className="text-[14px] leading-5 text-[#1f1f1f]">
              {recipe.notes}
            </Text>
          ) : (
            <EmptyLine />
          )}
        </Section>

        <Pressable
          className="mt-2 items-center rounded-[12px] border border-[#e2b4b4] bg-[#fcecec] py-3"
          onPress={handleDelete}
        >
          <Text className="font-semibold text-[#b42318]">删除配方</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
