# AGENTS.md - Zod Playground

Guidelines for AI coding agents working in this repository.

## Project Overview

Zod Playground is a React web application built with Vite.
It provides an interactive browser-based playground for testing Zod schema validation.
The UI uses Mantine components and Monaco Editor for code editing.

## Build, Lint, and Test Commands

This is an overview of the main npm scripts available in this project.
Look at `package.json` for the full list of scripts.

Do NOT use `npm run test -- --debug`, it requires a GUI environment.

### Development
```bash
npm run dev              # Start development server (http://localhost:5173)
npm run build            # Production build (runs tsc + vite build)
npm run preview          # Preview production build locally
npm run types            # Type-check only (no emit)
```

### Linting and Formatting
```bash
npm run biome:check      # Check for lint/format issues
npm run biome:write      # Auto-fix lint/format issues
npm run biome:ci         # CI mode (fails on issues)
```

### Testing
```bash
npm run test             # Run all tests
npm run test:ui          # Run tests with Playwright UI
npm run test:install     # Install browser dependencies

# Run a single test file
npm run test -- tests/app.spec.ts

# Run a single test by name
npm run test -- --grep "has title"

# Run tests in a specific browser
npm run test -- --project=chromium
npm run test -- --project=firefox
```

## Code Style Guidelines

This project uses **Biome** for linting and formatting. Configuration is in `biome.json`.

### Import Order
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

## Tests

### Structure
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

### Best Practices
- Use role-based selectors: `page.getByRole('button', {name: 'Share'})`
- Use label selectors: `page.getByLabel('Toggle color scheme')`
- Wait for elements: `await expect(element).toBeVisible()`
