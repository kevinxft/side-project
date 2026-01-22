import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useRecipes } from "@/providers/recipes-provider";

export function RecipeDetailScreen({ recipeId }: { recipeId: string }) {
  const { recipes } = useRecipes();
  const router = useRouter();
  const recipe = recipes.find((item) => item.id === recipeId);

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Recipe not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{recipe.title || "Untitled recipe"}</Text>
      <Text style={styles.section}>Ingredients</Text>
      <Text style={styles.body}>{recipe.ingredientsText}</Text>
      <Text style={styles.section}>Steps</Text>
      <Text style={styles.body}>{recipe.stepsText}</Text>
      <Pressable style={styles.button} onPress={() => router.push(`/recipe/edit/${recipe.id}`)}>
        <Text style={styles.buttonText}>Edit recipe</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f5efe6" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  section: { fontSize: 16, fontWeight: "600", marginTop: 16 },
  body: { color: "#444", marginTop: 6 },
  empty: { color: "#666" },
  button: {
    marginTop: 24,
    backgroundColor: "#2f2a1f",
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: { color: "#fff", textAlign: "center" },
});
