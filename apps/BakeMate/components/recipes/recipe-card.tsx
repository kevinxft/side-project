import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Recipe } from "@/lib/recipes/types";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{recipe.title || "Untitled recipe"}</Text>
      <Text style={styles.meta}>{recipe.tags.join(", ")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "600" },
  meta: { marginTop: 4, color: "#666" },
});
