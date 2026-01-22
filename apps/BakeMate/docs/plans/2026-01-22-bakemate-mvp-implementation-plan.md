# BakeMate MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the BakeMate MVP experience for capturing recipe photos, OCR review, and a searchable tagged library with local storage.

**Architecture:** Local-first JSON store backed by `expo-file-system`, in-memory state via a `RecipesProvider`, and a hybrid OCR client hitting a configurable endpoint with a queued processing state. Simple OCR parsing heuristics suggest ingredients/steps without blocking edits.

**Tech Stack:** Expo SDK 54, React Native, Expo Router, `expo-image-picker`, `expo-file-system`, TypeScript, Jest + Testing Library.

### Task 1: Add Jest test harness

**Files:**
- Create: `apps/BakeMate/babel.config.js`
- Create: `apps/BakeMate/jest.config.js`
- Create: `apps/BakeMate/tests/setup.ts`
- Create: `apps/BakeMate/tests/smoke.test.tsx`
- Modify: `apps/BakeMate/package.json`

**Step 1: Write failing test**

```tsx
import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";

it("renders a basic component", () => {
  const { getByText } = render(<Text>Smoke</Text>);
  expect(getByText("Smoke")).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Missing script: test" or Jest not configured.

**Step 3: Wire Jest + Expo**

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
```

```js
// jest.config.js
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
};
```

```ts
// tests/setup.ts
import "@testing-library/jest-native/extend-expect";
```

```json
// package.json (additions)
"scripts": {
  "test": "jest"
},
"devDependencies": {
  "@testing-library/jest-native": "^5.4.3",
  "@testing-library/react-native": "^12.6.1",
  "jest": "^29.7.0",
  "jest-expo": "^54.0.7",
  "react-test-renderer": "19.1.0"
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (1 test).

**Step 5: Commit**

```bash
git add babel.config.js jest.config.js tests/setup.ts tests/smoke.test.tsx package.json
git commit -m "test: add jest-expo harness"
```

### Task 2: Define recipe types and tag normalization

**Files:**
- Create: `apps/BakeMate/lib/recipes/types.ts`
- Create: `apps/BakeMate/lib/recipes/tags.ts`
- Test: `apps/BakeMate/tests/recipes/tags.test.ts`

**Step 1: Write failing test**

```ts
import { dedupeTags, normalizeTag } from "../../lib/recipes/tags";

it("normalizes tags", () => {
  expect(normalizeTag("  Breads ")).toBe("breads");
});

it("dedupes normalized tags", () => {
  expect(dedupeTags(["Breads", "breads", "  "])).toEqual(["breads"]);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/recipes/tags.test.ts`
Expected: FAIL with module not found.

**Step 3: Write minimal implementation**

```ts
// lib/recipes/types.ts
export type RecipeStatus = "draft" | "processing" | "ready" | "error";

export type Recipe = {
  id: string;
  title: string;
  ingredientsText: string;
  stepsText: string;
  tags: string[];
  sourcePhotoUri?: string;
  ocrText?: string;
  status: RecipeStatus;
  createdAt: string;
  updatedAt: string;
};

export type RecipeDraft = Omit<Recipe, "title" | "ingredientsText" | "stepsText"> & {
  title?: string;
  ingredientsText?: string;
  stepsText?: string;
};
```

```ts
// lib/recipes/tags.ts
export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of tags) {
    const normalized = normalizeTag(raw);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/recipes/tags.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/recipes/types.ts lib/recipes/tags.ts tests/recipes/tags.test.ts
git commit -m "feat: add recipe types and tag normalization"
```

### Task 3: Add OCR parsing heuristics

**Files:**
- Create: `apps/BakeMate/lib/recipes/parse-ocr.ts`
- Test: `apps/BakeMate/tests/recipes/parse-ocr.test.ts`

**Step 1: Write failing test**

```ts
import { suggestFromOcr } from "../../lib/recipes/parse-ocr";

it("extracts title, ingredients, and steps", () => {
  const text = [
    "Best Pancakes",
    "Ingredients",
    "2 cups flour",
    "1 cup milk",
    "Instructions",
    "Mix",
    "Cook",
  ].join("\n");

  const result = suggestFromOcr(text);

  expect(result.title).toBe("Best Pancakes");
  expect(result.ingredientsText).toBe("2 cups flour\n1 cup milk");
  expect(result.stepsText).toBe("Mix\nCook");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/recipes/parse-ocr.test.ts`
Expected: FAIL with module not found.

**Step 3: Write minimal implementation**

```ts
// lib/recipes/parse-ocr.ts
const INGREDIENT_HEADINGS = ["ingredients", "ingredient"];
const STEP_HEADINGS = ["instructions", "directions", "steps", "method"];

const isHeading = (line: string, headings: string[]) =>
  headings.includes(line.trim().toLowerCase());

export function suggestFromOcr(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const title = lines[0] ?? "";
  let section: "ingredients" | "steps" | null = null;
  const ingredients: string[] = [];
  const steps: string[] = [];

  for (const line of lines.slice(1)) {
    if (isHeading(line, INGREDIENT_HEADINGS)) {
      section = "ingredients";
      continue;
    }
    if (isHeading(line, STEP_HEADINGS)) {
      section = "steps";
      continue;
    }

    if (section === "ingredients") {
      ingredients.push(line);
      continue;
    }
    if (section === "steps") {
      steps.push(line);
      continue;
    }

    const looksLikeIngredient = /\d/.test(line) || /cup|tsp|tbsp|g|kg|ml|oz/i.test(line);
    if (looksLikeIngredient) {
      ingredients.push(line);
    } else {
      steps.push(line);
    }
  }

  return {
    title,
    ingredientsText: ingredients.join("\n"),
    stepsText: steps.join("\n"),
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/recipes/parse-ocr.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/recipes/parse-ocr.ts tests/recipes/parse-ocr.test.ts
git commit -m "feat: add OCR parsing heuristics"
```

### Task 4: Add file-backed recipe store

**Files:**
- Modify: `apps/BakeMate/package.json`
- Create: `apps/BakeMate/lib/recipes/store.ts`
- Create: `apps/BakeMate/lib/recipes/store-memory.ts`
- Test: `apps/BakeMate/tests/recipes/store.test.ts`

**Step 1: Write failing test**

```ts
import { createMemoryAdapter } from "../../lib/recipes/store-memory";
import { createRecipeStore } from "../../lib/recipes/store";

const recipe = {
  id: "1",
  title: "Test",
  ingredientsText: "Sugar",
  stepsText: "Mix",
  tags: ["dessert"],
  status: "ready",
  createdAt: "2026-01-22T00:00:00.000Z",
  updatedAt: "2026-01-22T00:00:00.000Z",
};

it("persists and loads recipes", async () => {
  const store = createRecipeStore(createMemoryAdapter());
  await store.saveAll([recipe]);
  await expect(store.loadAll()).resolves.toEqual([recipe]);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/recipes/store.test.ts`
Expected: FAIL with module not found.

**Step 3: Write minimal implementation**

```ts
// lib/recipes/store.ts
import * as FileSystem from "expo-file-system";
import { Recipe } from "./types";

export type RecipeStoreAdapter = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
};

export function createRecipeStore(adapter: RecipeStoreAdapter) {
  return {
    async loadAll(): Promise<Recipe[]> {
      const raw = await adapter.read();
      if (!raw) {
        return [];
      }
      return JSON.parse(raw) as Recipe[];
    },
    async saveAll(recipes: Recipe[]): Promise<void> {
      await adapter.write(JSON.stringify(recipes));
    },
  };
}

const STORE_PATH = `${FileSystem.documentDirectory}recipes.json`;

export const fileRecipeStore = createRecipeStore({
  read: async () => {
    try {
      return await FileSystem.readAsStringAsync(STORE_PATH);
    } catch {
      return null;
    }
  },
  write: async (value) => {
    await FileSystem.writeAsStringAsync(STORE_PATH, value);
  },
});
```

```ts
// lib/recipes/store-memory.ts
import { RecipeStoreAdapter } from "./store";

export function createMemoryAdapter(): RecipeStoreAdapter {
  let data: string | null = null;

  return {
    read: async () => data,
    write: async (value) => {
      data = value;
    },
  };
}
```

Run: `npx expo install expo-file-system`

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/recipes/store.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/recipes/store.ts lib/recipes/store-memory.ts tests/recipes/store.test.ts package.json
git commit -m "feat: add file-backed recipe store"
```

### Task 5: Add OCR client

**Files:**
- Create: `apps/BakeMate/lib/ocr/client.ts`
- Test: `apps/BakeMate/tests/ocr/client.test.ts`

**Step 1: Write failing test**

```ts
import { createOcrClient } from "../../lib/ocr/client";

it("returns OCR text", async () => {
  const client = createOcrClient({
    endpoint: "https://example.test/ocr",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ text: "hello" }),
    }),
    readFileAsBase64: async () => "base64",
  });

  await expect(client.requestOcr("file://photo.jpg")).resolves.toBe("hello");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/ocr/client.test.ts`
Expected: FAIL with module not found.

**Step 3: Write minimal implementation**

```ts
// lib/ocr/client.ts
import * as FileSystem from "expo-file-system";

type OcrClientDeps = {
  endpoint?: string;
  fetchImpl?: typeof fetch;
  readFileAsBase64?: (uri: string) => Promise<string>;
};

export function createOcrClient(deps: OcrClientDeps = {}) {
  const endpoint = deps.endpoint ?? process.env.EXPO_PUBLIC_OCR_ENDPOINT;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const readFileAsBase64 =
    deps.readFileAsBase64 ??
    ((uri: string) =>
      FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      }));

  return {
    async requestOcr(photoUri: string): Promise<string> {
      if (!endpoint) {
        throw new Error("OCR endpoint not configured");
      }

      const imageBase64 = await readFileAsBase64(photoUri);
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        throw new Error("OCR request failed");
      }

      const payload = await response.json();
      return String(payload.text ?? "");
    },
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/ocr/client.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/ocr/client.ts tests/ocr/client.test.ts
git commit -m "feat: add OCR client"
```

### Task 6: Add recipe service + provider

**Files:**
- Create: `apps/BakeMate/lib/recipes/service.ts`
- Create: `apps/BakeMate/providers/recipes-provider.tsx`
- Modify: `apps/BakeMate/app/_layout.tsx`
- Test: `apps/BakeMate/tests/recipes/service.test.ts`

**Step 1: Write failing test**

```ts
import { upsertRecipe, updateRecipe } from "../../lib/recipes/service";

const base = {
  id: "1",
  title: "Test",
  ingredientsText: "Sugar",
  stepsText: "Mix",
  tags: ["dessert"],
  status: "ready",
  createdAt: "2026-01-22T00:00:00.000Z",
  updatedAt: "2026-01-22T00:00:00.000Z",
};

it("upserts recipes", () => {
  const updated = upsertRecipe([], base);
  expect(updated).toHaveLength(1);
});

it("updates recipe fields", () => {
  const updated = updateRecipe([base], "1", { title: "New" });
  expect(updated[0].title).toBe("New");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/recipes/service.test.ts`
Expected: FAIL with module not found.

**Step 3: Write minimal implementation**

```ts
// lib/recipes/service.ts
import { Recipe } from "./types";
import { dedupeTags } from "./tags";

export function upsertRecipe(recipes: Recipe[], recipe: Recipe): Recipe[] {
  const existing = recipes.find((item) => item.id === recipe.id);
  if (!existing) {
    return [...recipes, recipe];
  }
  return recipes.map((item) => (item.id === recipe.id ? recipe : item));
}

export function updateRecipe(
  recipes: Recipe[],
  id: string,
  updates: Partial<Recipe>
): Recipe[] {
  return recipes.map((item) => {
    if (item.id !== id) {
      return item;
    }
    const tags = updates.tags ? dedupeTags(updates.tags) : item.tags;
    return {
      ...item,
      ...updates,
      tags,
    };
  });
}
```

```tsx
// providers/recipes-provider.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createOcrClient } from "@/lib/ocr/client";
import { suggestFromOcr } from "@/lib/recipes/parse-ocr";
import { updateRecipe, upsertRecipe } from "@/lib/recipes/service";
import { fileRecipeStore } from "@/lib/recipes/store";
import { Recipe } from "@/lib/recipes/types";

type RecipesContextValue = {
  recipes: Recipe[];
  refresh: () => Promise<void>;
  createDraftFromPhoto: (photoUri: string) => Promise<string>;
  saveRecipe: (recipe: Recipe) => Promise<void>;
  patchRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
};

const RecipesContext = createContext<RecipesContextValue | null>(null);

export function RecipesProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const ocrClient = useMemo(() => createOcrClient(), []);
  const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const persist = useCallback(async (next: Recipe[]) => {
    setRecipes(next);
    await fileRecipeStore.saveAll(next);
  }, []);

  const refresh = useCallback(async () => {
    const loaded = await fileRecipeStore.loadAll();
    setRecipes(loaded);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createDraftFromPhoto = useCallback(
    async (photoUri: string) => {
      const now = new Date().toISOString();
      const draft: Recipe = {
        id: createId(),
        title: "",
        ingredientsText: "",
        stepsText: "",
        tags: [],
        sourcePhotoUri: photoUri,
        ocrText: "",
        status: "processing",
        createdAt: now,
        updatedAt: now,
      };

      const next = upsertRecipe(recipes, draft);
      await persist(next);

      try {
        const text = await ocrClient.requestOcr(photoUri);
        const suggestions = suggestFromOcr(text);
        const updated = updateRecipe(next, draft.id, {
          ocrText: text,
          title: suggestions.title,
          ingredientsText: suggestions.ingredientsText,
          stepsText: suggestions.stepsText,
          status: "ready",
          updatedAt: new Date().toISOString(),
        });
        await persist(updated);
      } catch {
        const updated = updateRecipe(next, draft.id, {
          status: "error",
          updatedAt: new Date().toISOString(),
        });
        await persist(updated);
      }

      return draft.id;
    },
    [ocrClient, persist, recipes]
  );

  const saveRecipe = useCallback(
    async (recipe: Recipe) => {
      const next = upsertRecipe(recipes, {
        ...recipe,
        updatedAt: new Date().toISOString(),
      });
      await persist(next);
    },
    [persist, recipes]
  );

  const patchRecipe = useCallback(
    async (id: string, updates: Partial<Recipe>) => {
      const next = updateRecipe(recipes, id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      await persist(next);
    },
    [persist, recipes]
  );

  const value = useMemo(
    () => ({ recipes, refresh, createDraftFromPhoto, saveRecipe, patchRecipe }),
    [createDraftFromPhoto, patchRecipe, recipes, refresh, saveRecipe]
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

export function useRecipes() {
  const context = useContext(RecipesContext);
  if (!context) {
    throw new Error("useRecipes must be used within RecipesProvider");
  }
  return context;
}
```

```tsx
// app/_layout.tsx (wrap provider)
import { RecipesProvider } from "@/providers/recipes-provider";

// inside RootLayout
<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
  <RecipesProvider>
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
    </Stack>
  </RecipesProvider>
  <StatusBar style="auto" />
</ThemeProvider>
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/recipes/service.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/recipes/service.ts providers/recipes-provider.tsx app/_layout.tsx tests/recipes/service.test.ts
git commit -m "feat: add recipes provider and service"
```

### Task 7: Build library screen + navigation

**Files:**
- Modify: `apps/BakeMate/app/(tabs)/_layout.tsx`
- Modify: `apps/BakeMate/app/(tabs)/index.tsx`
- Create: `apps/BakeMate/components/screens/library-screen.tsx`
- Create: `apps/BakeMate/components/recipes/recipe-card.tsx`
- Test: `apps/BakeMate/tests/screens/library-screen.test.tsx`

**Step 1: Write failing test**

```tsx
import React from "react";
import { render } from "@testing-library/react-native";
import { LibraryScreen } from "../../components/screens/library-screen";

jest.mock("@/providers/recipes-provider", () => ({
  useRecipes: () => ({ recipes: [] }),
}));

it("shows empty state", () => {
  const { getByText } = render(<LibraryScreen />);
  expect(getByText("No recipes yet")).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/screens/library-screen.test.tsx`
Expected: FAIL with module not found.

**Step 3: Write minimal implementation**

```tsx
// components/recipes/recipe-card.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
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
```

```tsx
// components/screens/library-screen.tsx
import React, { useMemo, useState } from "react";
import { FlatList, Text, TextInput, View, StyleSheet } from "react-native";
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
```

```tsx
// app/(tabs)/index.tsx
import { LibraryScreen } from "@/components/screens/library-screen";

export default function LibraryRoute() {
  return <LibraryScreen />;
}
```

```tsx
// app/(tabs)/_layout.tsx (replace tabs)
<Tabs.Screen
  name="index"
  options={{ title: "Library", tabBarIcon: ({ color }) => <IconSymbol size={24} name="book.fill" color={color} /> }}
/>
<Tabs.Screen
  name="capture"
  options={{ title: "Capture", tabBarIcon: ({ color }) => <IconSymbol size={24} name="camera.fill" color={color} /> }}
/>
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/screens/library-screen.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/screens/library-screen.tsx components/recipes/recipe-card.tsx app/(tabs)/_layout.tsx app/(tabs)/index.tsx tests/screens/library-screen.test.tsx
git commit -m "feat: add library screen"
```

### Task 8: Build capture screen + permissions

**Files:**
- Modify: `apps/BakeMate/package.json`
- Modify: `apps/BakeMate/app.json`
- Create: `apps/BakeMate/app/(tabs)/capture.tsx`
- Create: `apps/BakeMate/components/screens/capture-screen.tsx`
- Test: `apps/BakeMate/tests/screens/capture-screen.test.tsx`

**Step 1: Write failing test**

```tsx
import React from "react";
import { render } from "@testing-library/react-native";
import { CaptureScreen } from "../../components/screens/capture-screen";

jest.mock("@/providers/recipes-provider", () => ({
  useRecipes: () => ({ createDraftFromPhoto: jest.fn() }),
}));

it("renders capture actions", () => {
  const { getByText } = render(<CaptureScreen />);
  expect(getByText("Capture recipe")).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/screens/capture-screen.test.tsx`
Expected: FAIL with module not found.

**Step 3: Write minimal implementation**

```tsx
// components/screens/capture-screen.tsx
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
    } catch (error) {
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
```

```tsx
// app/(tabs)/capture.tsx
import { CaptureScreen } from "@/components/screens/capture-screen";

export default function CaptureRoute() {
  return <CaptureScreen />;
}
```

```json
// app.json (additions)
"ios": {
  "supportsTablet": true,
  "infoPlist": {
    "NSCameraUsageDescription": "Capture recipe photos for OCR.",
    "NSPhotoLibraryUsageDescription": "Select recipe photos to import."
  }
},
"android": {
  "permissions": ["CAMERA", "READ_MEDIA_IMAGES"],
  "adaptiveIcon": { ... }
}
```

Run: `npx expo install expo-image-picker`

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/screens/capture-screen.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/screens/capture-screen.tsx app/(tabs)/capture.tsx app.json package.json tests/screens/capture-screen.test.tsx
git commit -m "feat: add capture screen"
```

### Task 9: Add recipe detail + editor screens

**Files:**
- Create: `apps/BakeMate/components/screens/recipe-detail-screen.tsx`
- Create: `apps/BakeMate/components/screens/recipe-editor-screen.tsx`
- Create: `apps/BakeMate/app/recipe/[id].tsx`
- Create: `apps/BakeMate/app/recipe/edit/[id].tsx`
- Test: `apps/BakeMate/tests/screens/recipe-detail-screen.test.tsx`

**Step 1: Write failing test**

```tsx
import React from "react";
import { render } from "@testing-library/react-native";
import { RecipeDetailScreen } from "../../components/screens/recipe-detail-screen";

jest.mock("@/providers/recipes-provider", () => ({
  useRecipes: () => ({
    recipes: [{
      id: "1",
      title: "Test",
      ingredientsText: "Sugar",
      stepsText: "Mix",
      tags: ["dessert"],
      status: "ready",
      createdAt: "2026-01-22T00:00:00.000Z",
      updatedAt: "2026-01-22T00:00:00.000Z",
    }],
  }),
}));

it("renders recipe title", () => {
  const { getByText } = render(<RecipeDetailScreen recipeId="1" />);
  expect(getByText("Test")).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/screens/recipe-detail-screen.test.tsx`
Expected: FAIL with module not found.

**Step 3: Write minimal implementation**

```tsx
// components/screens/recipe-detail-screen.tsx
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
```

```tsx
// components/screens/recipe-editor-screen.tsx
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
```

```tsx
// app/recipe/[id].tsx
import { useLocalSearchParams } from "expo-router";
import { RecipeDetailScreen } from "@/components/screens/recipe-detail-screen";

export default function RecipeDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RecipeDetailScreen recipeId={id} />;
}
```

```tsx
// app/recipe/edit/[id].tsx
import { useLocalSearchParams } from "expo-router";
import { RecipeEditorScreen } from "@/components/screens/recipe-editor-screen";

export default function RecipeEditorRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RecipeEditorScreen recipeId={id} />;
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/screens/recipe-detail-screen.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/screens/recipe-detail-screen.tsx components/screens/recipe-editor-screen.tsx app/recipe/[id].tsx app/recipe/edit/[id].tsx tests/screens/recipe-detail-screen.test.tsx
git commit -m "feat: add recipe detail and editor screens"
```

### Task 10: Manual QA checklist

**Files:**
- Modify: `apps/BakeMate/docs/plans/2026-01-22-bakemate-mvp-implementation-plan.md`

**Step 1: Add manual test checklist**

```md
## Manual QA
- Capture from camera and verify draft appears in library with processing status.
- Capture from photo library and verify OCR completes.
- Edit OCR-suggested fields and save.
- Search by ingredient keyword and see recipe.
- Tag with mixed case and confirm it normalizes.
```

**Step 2: Commit**

```bash
git add docs/plans/2026-01-22-bakemate-mvp-implementation-plan.md
git commit -m "docs: add manual QA checklist"
```

## Manual QA
- Capture from camera and verify draft appears in library with processing status.
- Capture from photo library and verify OCR completes.
- Edit OCR-suggested fields and save.
- Search by ingredient keyword and see recipe.
- Tag with mixed case and confirm it normalizes.
