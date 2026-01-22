# BakeMate MVP Design

## Summary
BakeMate's MVP focuses on helping home bakers capture and organize recipes quickly. The primary success metric is OCR captures completed. The core flow is capture a recipe photo, run OCR, suggest structure, and save the recipe with tags and search. Accounts and sync are deferred, but the schema stays sync-ready.

## Goals
- Make recipe capture from photos fast and reliable.
- Keep organization simple with freeform tags and search-first discovery.
- Preserve raw OCR text while nudging users toward structured recipes.

## Non-goals (MVP)
- Scheduling or bake planning
- Scaling and conversions
- Nutrition analysis
- Social sharing or selling
- Cloud sync and accounts

## Primary User
Home bakers who save recipes from cookbooks, handwritten notes, or printed pages.

## Core Flows
1. Capture photo -> OCR -> review text -> auto-suggest structure -> save recipe.
2. Search recipes by name or ingredients; optionally filter by tags.
3. Edit recipe, adjust tags, and correct OCR-derived text.

## Data Model (MVP)
- Recipe
  - id (stable UUID)
  - title
  - ingredients_text (raw or structured list)
  - steps_text (raw or structured list)
  - tags (string list)
  - source_photo_uri
  - ocr_text
  - created_at, updated_at

## Architecture
- Local-first storage (SQLite or local KV store).
- Hybrid OCR pipeline: capture offline, queue upload, process in cloud, return text.
- Auto-suggest structure runs locally on OCR text with lightweight heuristics.
- Search indexes title + ingredient text for fast lookup.

## UI Surface
- Capture screen (camera + photo picker)
- OCR review screen (raw text + suggested fields)
- Recipe editor (editable title, ingredients, steps, tags)
- Library screen (search + tag filters)
- Recipe detail view
- Processing state for queued OCR jobs

## Error Handling
- Permission denied: fall back to photo picker with guidance.
- Offline/failed OCR: keep draft queued and allow manual retry.
- OCR failure: preserve photo, allow manual entry.
- Low-confidence parsing: fall back to raw text editor.

## Testing
- Unit tests for parsing heuristics and tag normalization.
- Integration tests for capture -> OCR -> recipe save (mock OCR).
- Manual checks: offline capture, OCR retry, tag rename, ingredient search.

## Future Considerations
- Account and sync support.
- Structured ingredients/steps schema.
- Scaling and conversions.
- Smart tag suggestions.
