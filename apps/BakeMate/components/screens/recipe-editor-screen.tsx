import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useRecipes } from "@/providers/recipes-provider";

export function RecipeEditorScreen({ recipeId }: { recipeId: string }) {
  const { recipes, patchRecipe } = useRecipes();
  const router = useRouter();
  const recipe = useMemo(() => recipes.find((item) => item.id === recipeId), [recipes, recipeId]);

  const [title, setTitle] = useState(recipe?.title ?? "");
  const [ingredients, setIngredients] = useState(recipe?.ingredientsText ?? "");
  const [steps, setSteps] = useState(recipe?.stepsText ?? "");
  const [tags, setTags] = useState(recipe?.tags.join(", ") ?? "");

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Recipe not found.</Text>
      </View>
    );
  }

  const onSave = async () => {
    await patchRecipe(recipeId, {
      title,
      ingredientsText: ingredients,
      stepsText: steps,
      tags: tags.split(",").map((tag) => tag.trim()),
      status: "ready",
    });
    router.replace(`/recipe/${recipeId}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Edit recipe</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="Title" style={styles.input} />
      <TextInput
        value={ingredients}
        onChangeText={setIngredients}
        placeholder="Ingredients"
        multiline
        style={[styles.input, styles.multiline]}
      />
      <TextInput
        value={steps}
        onChangeText={setSteps}
        placeholder="Steps"
        multiline
        style={[styles.input, styles.multiline]}
      />
      <TextInput
        value={tags}
        onChangeText={setTags}
        placeholder="Tags (comma separated)"
        style={styles.input}
      />
      <Pressable style={styles.button} onPress={onSave}>
        <Text style={styles.buttonText}>Save recipe</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f5efe6" },
  header: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  multiline: { minHeight: 120, textAlignVertical: "top" },
  button: {
    marginTop: 8,
    backgroundColor: "#2f2a1f",
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  empty: { color: "#666" },
});
