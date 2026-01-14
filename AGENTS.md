# BakeMate Agent Guidelines

## Commands
- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator  
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint (no test framework configured)

## Code Style
- **Framework**: Expo Router with React Native
- **Language**: TypeScript with strict mode enabled
- **Imports**: Use absolute imports with `@/*` alias (e.g., `@/hooks/use-color-scheme`)
- **Components**: Follow existing themed component pattern with light/dark color support
- **Types**: Use explicit type definitions for props (e.g., `ThemedTextProps`)
- **Styling**: Use StyleSheet.create for component styles, Tailwind for utility classes
- **File Structure**: File-based routing in `app/` directory, components in `components/`
- **Linting**: Follow expo ESLint config, ignores `dist/` directory

## Conventions
- Export themed components with lightColor/darkColor props
- Use React Native hooks and Expo Router patterns
- Follow existing naming conventions (PascalCase components, camelCase functions)