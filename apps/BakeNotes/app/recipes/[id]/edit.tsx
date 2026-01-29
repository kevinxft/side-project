import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { RecipeForm } from '@/components/recipes/RecipeForm';
import { useRecipeStore } from '@/lib/recipes';

export default function EditRecipeScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const recipe = useRecipeStore((state) =>
    state.recipes.find((item) => item.id === recipeId)
  );
  const updateRecipe = useRecipeStore((state) => state.updateRecipe);

  if (!recipe) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Stack.Screen options={{ title: '编辑配方', headerShown: true }} />
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
    );
  }

  return (
    <View className="flex-1 bg-[#f8f3ed]">
      <Stack.Screen
        options={{
          title: '编辑配方',
          headerShown: true,
          headerBackTitle: '返回',
          headerBackTitleVisible: true,
        }}
      />
      <RecipeForm
        initialValue={recipe}
        submitLabel="保存修改"
        onCancel={() => router.back()}
        onSubmit={(input) => {
          const updated = updateRecipe(recipe.id, input);
          if (updated) {
            router.replace(`/recipes/${recipe.id}`);
          }
        }}
      />
    </View>
  );
}
