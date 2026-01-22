import { dedupeTags, normalizeTag } from "../../lib/recipes/tags";

it("normalizes tags", () => {
  expect(normalizeTag("  Breads ")).toBe("breads");
});

it("dedupes normalized tags", () => {
  expect(dedupeTags(["Breads", "breads", "  "])).toEqual(["breads"]);
});
