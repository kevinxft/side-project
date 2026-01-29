import { Stack, router } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { FlatList, Platform, Pressable, Text, View } from 'react-native';

import { useRecipeStore } from '@/lib/recipes';

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const listContentStyle = { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 };
const listContentEmptyStyle = {
  paddingHorizontal: 20,
  paddingTop: 12,
  paddingBottom: 32,
  flexGrow: 1,
  justifyContent: 'center',
};

type RecipeCardProps = {
  id: string;
  title: string;
  updatedAt: string;
  onPress: (id: string) => void;
};

const RecipeCard = memo(({ id, title, updatedAt, onPress }: RecipeCardProps) => (
  <Pressable
    onPress={() => onPress(id)}
    className="mb-3 rounded-[18px] border border-[#f1e4d7] bg-white p-[18px]"
    style={({ pressed }) => (pressed ? { transform: [{ scale: 0.98 }] } : undefined)}
  >
    <View className="flex-row items-center justify-between gap-2">
      <Text className="flex-1 text-[16px] font-semibold text-[#2d1f12]">
        {title}
      </Text>
      <View className="rounded-full bg-[#f7efe6] px-2.5 py-1">
        <Text className="text-[11px] text-[#9a7658]">配方</Text>
      </View>
    </View>
    <Text className="mt-1.5 text-[12px] text-[#8c7a6b]">
      更新于 {formatDate(updatedAt)}
    </Text>
  </Pressable>
));

type ListHeaderProps = {
  count: number;
  onCreate: () => void;
};

const titleFontStyle = {
  fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
};

const ListHeader = memo(({ count, onCreate }: ListHeaderProps) => (
  <View className="mb-4">
    <View className="relative overflow-hidden rounded-[28px] border border-[#f2e7dc] bg-white p-5">
      <View className="absolute -top-20 -right-10 h-44 w-44 rounded-full bg-[#f1c7a1] opacity-40" />
      <View className="absolute -left-16 bottom-[-40px] h-36 w-36 rounded-full bg-[#f6e7d7]" />
      <View className="absolute -right-10 bottom-[-60px] h-40 w-40 rounded-full bg-[#f9d5b5] opacity-60" />
      <Text className="mb-1 text-[11px] uppercase tracking-[2.2px] text-[#b1865c]">
        Bake Notes
      </Text>
      <Text
        className="text-[30px] font-semibold text-[#2f1f10]"
        style={titleFontStyle}
      >
        烘焙笔记
      </Text>
      <Text className="mt-2 text-[13px] leading-[18px] text-[#7a5c43]">
        记录每一次配方的细节，厨房里打开即可使用。
      </Text>
      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-[14px] bg-[#f3e2d2] px-3 py-2.5">
          <Text className="text-[11px] text-[#9a7658]">已记录</Text>
          <Text className="mt-1 text-[14px] font-semibold text-[#1f1f1f]">
            {count}
          </Text>
        </View>
        <View className="flex-1 rounded-[14px] border border-[#f0dfcc] bg-[#f7efe6] px-3 py-2.5">
          <Text className="text-[11px] text-[#9a7658]">本地离线</Text>
          <Text className="mt-1 text-[14px] font-semibold text-[#1f1f1f]">
            已启用
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onCreate}
        className="mt-4 items-center rounded-full bg-[#2f1f10] px-4 py-2"
      >
        <Text className="text-[13px] font-semibold text-white">新建配方</Text>
      </Pressable>
    </View>
    <Text className="mt-4 text-[14px] font-semibold text-[#3a2a1f]">
      最近更新
    </Text>
  </View>
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

  return (
    <View className="flex-1 bg-[#f8f3ed]">
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={sortedRecipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          sortedRecipes.length === 0 ? listContentEmptyStyle : listContentStyle
        }
        renderItem={({ item }) => (
          <RecipeCard
            id={item.id}
            title={item.title}
            updatedAt={item.updatedAt}
            onPress={handleOpenRecipe}
          />
        )}
        ListHeaderComponent={
          <ListHeader count={sortedRecipes.length} onCreate={handleCreateRecipe} />
        }
        ListEmptyComponent={
          <View className="items-center px-8">
            <Text className="text-[16px] font-semibold text-[#1f1f1f]">
              还没有配方
            </Text>
            <Text className="mt-1.5 text-center text-[13px] text-[#7a5c43]">
              先写下第一条配方吧。
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        initialNumToRender={8}
        windowSize={8}
      />
    </View>
  );
}
