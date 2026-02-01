import { MaterialIcons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/recipes/EmptyState';
import { type Recipe, useRecipeStore } from '@/lib/recipes';

const listContentStyle = { paddingTop: 76, paddingBottom: 120 };
const listContentEmptyStyle = {
  flexGrow: 1,
};

const formatDuration = (recipe: Recipe) => {
  const totalMinutes =
    recipe.bake?.stages?.reduce(
      (sum, stage) => sum + (stage.minutes ?? 0),
      0
    ) ?? 0;

  if (!totalMinutes) return '—';
  if (totalMinutes < 60) return `${totalMinutes}分钟`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}小时${minutes}分` : `${hours}小时`;
};

const formatTemperature = (recipe: Recipe) => {
  const stage = recipe.bake?.stages?.[0];
  if (!stage || stage.topC == null || stage.bottomC == null) return '—';
  return `上${stage.topC}°C/下${stage.bottomC}°C`;
};

const buildMeta = (recipe: Recipe) =>
  [
    formatDuration(recipe),
    formatTemperature(recipe),
    `${recipe.ingredients.length}种食材`,
  ].join(' | ');

type RecipeRowProps = {
  recipe: Recipe;
  onPress: (id: string) => void;
};

const RecipeRow = memo(({ recipe, onPress }: RecipeRowProps) => (
  <Pressable
    onPress={() => onPress(recipe.id)}
    className="bg-white px-5 py-4"
  >
    <Text className="text-[16px] font-semibold text-[#1c1c1c]">
      {recipe.title}
    </Text>
    <Text className="mt-1 text-[12px] text-[#8b8b8b]">{buildMeta(recipe)}</Text>
  </Pressable>
));

export default function HomeScreen() {
  const recipes = useRecipeStore((state) => state.recipes);

  const sortedRecipes = useMemo(
    () =>
      [...recipes].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [recipes]
  );

  const handleOpenRecipe = useCallback((id: string) => {
    router.push(`/recipes/${id}`);
  }, []);

  const handleCreateRecipe = useCallback(() => {
    router.push('/recipes/new');
  }, []);

  const isEmpty = sortedRecipes.length === 0;
  const backgroundColor = isEmpty ? '#fffaf5' : '#ffffff';

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={sortedRecipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          isEmpty ? listContentEmptyStyle : listContentStyle
        }
        renderItem={({ item }) => (
          <RecipeRow recipe={item} onPress={handleOpenRecipe} />
        )}
        ListEmptyComponent={<EmptyState onAddPress={handleCreateRecipe} />}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        initialNumToRender={8}
        windowSize={8}
        ItemSeparatorComponent={() => <View className="h-px bg-[#f2f2f2]" />}
      />
      {sortedRecipes.length > 0 ? (
        <Pressable
          onPress={handleCreateRecipe}
          className="absolute bottom-6 right-6 h-12 w-12 items-center justify-center rounded-full bg-black shadow"
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      ) : null}
      <View
        className="absolute left-0 right-0 top-0 flex-row items-center justify-between px-5 pb-3 pt-12"
        style={{ backgroundColor }}
      >
        <Text className="text-[18px] font-semibold text-[#1c1c1c]">配方库</Text>
        <Pressable className="h-9 w-9 items-center justify-center">
          <MaterialIcons name="search" size={20} color="#1c1c1c" />
        </Pressable>
      </View>
    </View>
  );
}
