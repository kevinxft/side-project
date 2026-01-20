# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Expo Router screens/layouts (file-based routing).
- `components/`, `hooks/`, `constants/` contain reusable UI, helpers, and shared constants.
- `assets/` stores images/fonts; `global.css` covers web styles.
- `db/` and `drizzle/` include database models/config (`drizzle.config.ts`).
- `scripts/` contains helper scripts like `reset-project`.

## Architecture & Product Notes
- Data model is task-driven: `Items` store generic fields plus type-specific `metadata` JSON.
- `Reminders` are separate from items and support one-time or recurring schedules; completion logs live in `Reminder Logs`.
- Home screen parses `metadata` per item type and supports edit mode with bulk selection/deletion.
- Calendar screen marks dates with tasks and lets users mark due items complete.
- `AddItemModal` has a fixed height and supports configuring reminders on creation.
- Dev helpers include Seed Data (magic wand) and automatic Drizzle migrations on startup; current DB file is `lifestock_v3.db`.

## Build, Test, and Development Commands
- `npm start`: start the Expo dev server.
- `npm run ios`: run iOS dev client (simulator required).
- `npm run android`: run Android dev client (emulator/device required).
- `npm run web`: run in the browser.
- `npm run lint`: run ESLint (Expo config).
- `npm run reset-project`: reset the template structure (use with care).

## Coding Style & Naming Conventions
- TypeScript with strict mode; define explicit prop types (e.g., `ThemedTextProps`).
- Use absolute imports with `@/` (e.g., `@/hooks/use-color-scheme`).
- Follow themed components with `lightColor` and `darkColor` props.
- Use `StyleSheet.create` plus Tailwind/Uniwind utilities.
- Naming: PascalCase components, camelCase functions, route files in `app/`.

## Testing Guidelines
- No test framework or scripts are configured yet.
- If you add tests, introduce a clear `npm run test` script and document conventions.

## Commit & Pull Request Guidelines
- Recent commits use an emoji prefix plus a concise description (often Chinese).
- PRs include a short summary, linked issues (if any), and screenshots for UI changes.
- Note the platforms tested (iOS, Android, web) and any environment constraints.

## Configuration Notes
- Expo settings live in `app.json` and Metro config in `metro.config.js`.
- Linting is handled via `eslint.config.js` and `npm run lint`.
