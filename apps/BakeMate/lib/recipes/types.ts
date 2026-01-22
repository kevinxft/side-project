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
