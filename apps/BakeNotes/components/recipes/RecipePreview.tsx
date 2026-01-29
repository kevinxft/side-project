import { ScrollView, Text, View } from 'react-native';

import { type RecipeInput } from '@/lib/recipes';

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

const previewContentStyle = { padding: 20, paddingBottom: 40 };

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

type RecipePreviewProps = {
  recipe: RecipeInput;
};

export function RecipePreview({ recipe }: RecipePreviewProps) {
  return (
    <ScrollView
      contentContainerStyle={previewContentStyle}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="mb-6 rounded-[20px] bg-white p-4">
        <Text className="text-[18px] font-semibold text-[#2f1f10]">
          {recipe.title || '未命名配方'}
        </Text>
        <Text className="mt-2 text-[12px] text-[#8c7a6b]">
          预览中 · 保存后可在详情页查看
        </Text>
      </View>

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
              <Text
                key={`${item.name}-${index}`}
                className="mb-1.5 text-[14px] leading-5 text-[#1f1f1f]"
              >
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
            <Text
              key={`${index}-${step}`}
              className="mb-1.5 text-[14px] leading-5 text-[#1f1f1f]"
            >
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

      <Section title="备注 / 提示">
        {recipe.notes ? (
          <Text className="text-[14px] leading-5 text-[#1f1f1f]">
            {recipe.notes}
          </Text>
        ) : (
          <EmptyLine />
        )}
      </Section>
    </ScrollView>
  );
}
