import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useRecipes } from "@/providers/recipes-provider";

export function CaptureScreen() {
  const { createDraftFromPhoto } = useRecipes();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const capture = async (useCamera: boolean) => {
    setBusy(true);
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const draftId = await createDraftFromPhoto(result.assets[0].uri);
      router.push(`/recipe/${draftId}`);
    } catch {
      Alert.alert("Capture failed", "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Capture recipe</Text>
      <Pressable style={styles.button} onPress={() => capture(true)} disabled={busy}>
        <Text style={styles.buttonText}>Use camera</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => capture(false)} disabled={busy}>
        <Text style={styles.buttonText}>Choose from library</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5efe6" },
  header: { fontSize: 28, fontWeight: "700", marginBottom: 16 },
  button: {
    backgroundColor: "#2f2a1f",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
