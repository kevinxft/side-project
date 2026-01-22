import { useLocalSearchParams } from "expo-router";
import { RecipeEditorScreen } from "@/components/screens/recipe-editor-screen";

export default function RecipeEditorRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RecipeEditorScreen recipeId={id} />;
}
