# AGENTS.md - Zod Playground

Guidelines for AI coding agents working in this repository.

## Project Overview

Zod Playground is a TypeScript/React 19 web application built with Vite 7. It provides an interactive browser-based playground for testing Zod schema validation. The UI uses Mantine components and Monaco Editor for code editing.

## Build, Lint, and Test Commands

### Development
```bash
npm run dev              # Start development server (http://localhost:5173)
npm run build            # Production build (runs tsc + vite build)
npm run preview          # Preview production build locally
npm run types            # Type-check only (no emit)
```

### Linting and Formatting (Biome)
```bash
npm run biome:check      # Check for lint/format issues
npm run biome:write      # Auto-fix lint/format issues
npm run biome:ci         # CI mode (fails on issues)
```

### Testing (Playwright E2E)
```bash
npm test                 # Run all tests
npm run test:ui          # Run tests with Playwright UI
npm run test:install     # Install browser dependencies

# Run a single test file
npx playwright test tests/app.spec.ts

# Run a single test by name
npx playwright test --grep "has title"

# Run tests in a specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox

# Debug mode
npx playwright test --debug
```

## Code Style Guidelines

This project uses **Biome** for linting and formatting. Configuration is in `biome.json`.

### Formatting Rules
- **Indentation**: 2 spaces (not tabs)
- **Line width**: 100 characters max
- **Quotes**: Single quotes for strings
- **Semicolons**: Omit when possible (`semicolons: "asNeeded"`)
- **Bracket spacing**: No spaces inside braces (`{foo}` not `{ foo }`)
- **Trailing commas**: Include in multiline structures

### Import Order
1. External libraries (React, Mantine, etc.)
2. Internal modules (components, utils, hooks)
3. CSS/style imports last

```typescript
// External libraries
import {Box, Button, Flex} from '@mantine/core'
import {useEffect, useState} from 'react'

// Internal modules
import {ColorSchemeToggle} from './features/ColorSchemeToggle'
import {usePersistAppData} from './hooks/usePersistAppData'

// Styles
import classes from './App.module.css'
```

### TypeScript Guidelines
- **Strict mode** is enabled - no implicit any, strict null checks
- Use `type` keyword for type-only imports: `import type {Monaco} from '@monaco-editor/react'`
- Prefer explicit return types for exported functions
- Use discriminated unions for result types (success/error pattern)

```typescript
type ValidationResult =
  | { success: true; data: unknown }
  | { success: false; error: string }
```

## Naming Conventions

### Files
- **Components**: PascalCase (`ColorSchemeToggle.tsx`, `Header.tsx`)
- **Utilities/hooks**: camelCase (`appData.ts`, `usePersistAppData.ts`)
- **CSS Modules**: `ComponentName.module.css`
- **Tests**: `*.spec.ts`

### Code
- **Components**: PascalCase (`function Header()`, `const ColorSchemeToggle`)
- **Functions/variables**: camelCase (`validateSchema`, `isLoading`)
- **Types/interfaces**: PascalCase (`AppData`, `ZodSchema`)
- **Constants**: SCREAMING_SNAKE_CASE (`STORAGE_KEY`, `EDITOR_OPTIONS`)
- **Hooks**: Prefix with `use` (`usePersistAppData`, `useMonaco`)

## Project Structure

```
src/
├── features/           # Feature-specific components
│   ├── ColorSchemeToggle.tsx
│   ├── CopyButton.tsx
│   ├── ValueEditor/
│   └── VersionPicker/
├── ui/                 # Reusable UI components
│   ├── Header/
│   └── Resizable/
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── assets/             # Static assets (SVGs)
├── App.tsx             # Main application component
├── main.tsx            # React entry point
├── constants.ts        # App-wide constants
└── zod.ts              # Zod validation logic

tests/                  # Playwright E2E tests
├── app.spec.ts         # Test specifications
└── fixtures.ts         # Test fixtures and helpers
```

## React Patterns

### Component Structure
- Use named function exports for components
- Props type defined inline or as separate type
- Destructure props in function signature

```typescript
export function Header({children}: {children?: React.ReactNode}) {
  return (
    <Flex component="header">
      {children}
    </Flex>
  )
}
```

### State Management
- Use React hooks (`useState`, `useEffect`, `useMemo`)
- Mantine hooks for UI state (`useComputedColorScheme`, `useMediaQuery`)
- Local storage persistence via custom hooks

### Async Operations
- Use top-level await where appropriate (ES modules)
- Handle loading states with boolean flags
- Use try/catch with typed error handling

## Error Handling

Use the success/error discriminated union pattern:

```typescript
function validateSchema(schema: string): SchemaValidation {
  try {
    // validation logic
    return { success: true, data: result }
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error }
  }
}
```

## Testing Guidelines

Tests use Playwright with custom fixtures defined in `tests/fixtures.ts`.

### Test Structure
```typescript
import {expect} from '@playwright/test'
import {test} from './fixtures'

test('descriptive test name', async ({page, codeEditors}) => {
  // Use custom fixtures for Monaco editor interactions
  await codeEditors.writeSchema({text: 'z.string()'})
  await codeEditors.writeValue({text: '"hello"'})
  
  await expect(page.locator('div').filter({hasText: /^Valid$/})).toBeVisible()
})
```

### Custom Fixtures
- `codeEditors.writeSchema()` - Write to schema editor
- `codeEditors.writeValue()` - Write to value editor
- `codeEditors.getSchemaEditorContent()` - Read schema content

### Best Practices
- Use role-based selectors: `page.getByRole('button', {name: 'Share'})`
- Use label selectors: `page.getByLabel('Toggle color scheme')`
- Wait for elements: `await expect(element).toBeVisible()`
