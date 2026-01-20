# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LifeStock is a React Native inventory management app built with Expo for iOS/Android/Web. It tracks three item types:
- **Stock**: Physical inventory with quantities, units, locations
- **Card**: Gift/loyalty cards with balance and recharge tracking
- **Phone**: Phone numbers with billing info

## Development Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Build and run on iOS
npm run android    # Build and run on Android
npm run web        # Start web preview
npm run lint       # Run ESLint
```

## Database

SQLite with Drizzle ORM. Schema in `/db/schema.ts`, services in `/db/services.ts`.

Generate new migration:
```bash
npx drizzle-kit generate --name <migration_name>
```

Migrations auto-run on app startup via `DatabaseProvider` context.

## Architecture

- **Expo Router** file-based routing in `/app`
- **Native Bottom Tabs** with 3 tabs: home, search, settings
- **Polymorphic items table**: single table with `kind` field discriminating stock/card/phone
- **Drizzle ORM**: typed queries, auto-migrations from `/drizzle` folder
- **Uniwind + Tailwind CSS**: styling via className on RN components

### Key Directories

- `/app` - Screens and navigation (Expo Router)
- `/db` - Schema, client initialization, CRUD services
- `/components` - Shared components (DatabaseProvider)
- `/drizzle` - SQL migration files

### Path Alias

`@/*` maps to project root (configured in tsconfig.json)

## Configuration Notes

- **Babel**: `babel-plugin-inline-import` for `.sql` files (Drizzle requirement)
- **Metro**: Extended for `.sql` source files and Uniwind CSS processing
- **react-native-screens**: Must be 4.18+ for Native Bottom Tabs icon format compatibility

## Native Bottom Tabs Icon Format

Use this format for tab icons:
```tsx
tabBarIcon: { type: "sfSymbol", name: "archivebox.fill" }
// Or for system items:
tabBarSystemItem: "search"
```
