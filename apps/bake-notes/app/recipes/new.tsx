import { Stack, router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { RecipeForm } from '@/components/recipes/RecipeForm';
import { RecipePreview } from '@/components/recipes/RecipePreview';
import { type RecipeInput, useRecipeStore } from '@/lib/recipes';

export default function NewRecipeScreen() {
  const createRecipe = useRecipeStore((state) => state.createRecipe);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewInput, setPreviewInput] = useState<RecipeInput>({
    title: '',
    ingredients: [],
    bake: null,
    steps: [],
    notes: '',
  });

  const handlePreview = useCallback(() => {
    setPreviewVisible(true);
  }, []);

  const headerRight = useMemo(
    () => (
      <Pressable onPress={handlePreview} className="px-2 py-1">
        <Text className="text-[14px] font-semibold text-[#b86b2f]">预览</Text>
      </Pressable>
    ),
    [handlePreview]
  );

  return (
    <View className="flex-1 bg-[#f9fafb]">
      <Stack.Screen
        options={{
          title: '新建配方',
          headerShown: true,
          headerBackTitle: '返回',
          headerBackTitleVisible: true,
          headerRight: () => headerRight,
        }}
      />
      <RecipeForm
        onSubmit={(input) => {
          const recipe = createRecipe(input);
          router.replace(`/recipes/${recipe.id}`);
        }}
        onDraftChange={setPreviewInput}
        onCancel={() => router.back()}
        submitLabel="保存配方"
      />

      <Modal
        visible={previewVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View className="flex-1 bg-[#f8f3ed]">
          <View className="flex-row items-center justify-between border-b border-[#eadfce] bg-white/70 px-4 pb-3 pt-4">
            <Text className="text-[16px] font-semibold text-[#2f1f10]">
              预览
            </Text>
            <Pressable
              onPress={() => setPreviewVisible(false)}
              className="rounded-full bg-[#f3e2d2] px-3 py-1.5"
            >
              <Text className="text-[12px] font-semibold text-[#6f4b2e]">
                关闭
              </Text>
            </Pressable>
          </View>
          {previewInput ? <RecipePreview recipe={previewInput} /> : null}
        </View>
      </Modal>
    </View>
  );
}
