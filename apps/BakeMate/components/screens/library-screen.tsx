import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { useRecipes } from "@/providers/recipes-provider";

export function LibraryScreen() {
  const { recipes } = useRecipes();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return recipes;
    }
    return recipes.filter((recipe) => {
      return (
        recipe.title.toLowerCase().includes(needle) ||
        recipe.ingredientsText.toLowerCase().includes(needle)
      );
    });
  }, [query, recipes]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Library</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or ingredient"
        style={styles.search}
      />
      {filtered.length === 0 ? (
        <Text style={styles.empty}>No recipes yet</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5efe6" },
  header: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  search: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  empty: { color: "#666" },
});
