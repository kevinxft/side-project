import { Stack, router } from 'expo-router';
import { View } from 'react-native';

import { RecipeForm } from '@/components/recipes/RecipeForm';
import { useRecipeStore } from '@/lib/recipes';

export default function NewRecipeScreen() {
  const createRecipe = useRecipeStore((state) => state.createRecipe);

  return (
    <View className="flex-1 bg-[#f8f3ed]">
      <Stack.Screen options={{ title: '新建配方', headerShown: true }} />
      <RecipeForm
        onSubmit={(input) => {
          const recipe = createRecipe(input);
          router.replace(`/recipes/${recipe.id}`);
        }}
        onCancel={() => router.back()}
        submitLabel="保存配方"
      />
    </View>
  );
}
