import {expect, type Page} from '@playwright/test'

import * as zod from '../src/zod'
import {test} from './fixtures'

const shareCurrentAppData = async (page: Page) => {
  // Firefox does not allow clipboard reads in Playwright, so capture the app's
  // clipboard write instead while still verifying the URL produced by Share.
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          document.documentElement.dataset.testClipboard = value
        },
      },
    })
  })

  await page.getByRole('button', {name: 'Share'}).click()

  const clipboardTarget = page.locator('html')
  await expect(clipboardTarget).toHaveAttribute('data-test-clipboard', /appdata=/)

  const sharedUrl = await clipboardTarget.getAttribute('data-test-clipboard')
  if (!sharedUrl) throw new Error('Share did not write a URL to the clipboard')

  return sharedUrl
}

test('has title "Zod Playground"', async ({page}) => {
  await expect(page).toHaveTitle(/Zod Playground/)
})

test('has header with title, share, theme toggler and github repo link', async ({page}) => {
  await expect(page.getByText('Zod Playground')).toBeVisible()
  await expect(page.getByRole('button', {name: 'Share'})).toBeVisible()
  await expect(page.getByRole('button', {name: 'Reset schema and values'})).toBeVisible()
  await expect(page.getByLabel('Switch to dark mode')).toBeVisible()
  await expect(page.getByRole('banner').getByRole('link')).toHaveAttribute(
    'href',
    'https://github.com/marilari88/zod-playground',
  )
})

test('shows the share label from the xs breakpoint', async ({page}) => {
  const shareLabel = page.getByText('Share', {exact: true})

  await page.setViewportSize({width: 560, height: 600})
  await expect(shareLabel).not.toBeVisible()

  await page.setViewportSize({width: 600, height: 600})
  await expect(shareLabel).toBeVisible()
})

test('zod version switch', async ({page}) => {
  const latestZodVersion = (await zod.getVersions('latest'))[0]
  const anotherZodVersion = (await zod.getVersions()).find(
    (zVersion) => zVersion.version !== latestZodVersion.version,
  )
  const zodMiniVersion = (await zod.getVersions()).find((zVersion) => zVersion.hasZodMini)

  if (!latestZodVersion) throw new Error('No zod version found')
  if (!anotherZodVersion) throw new Error('No another zod version found')
  if (!zodMiniVersion) throw new Error('No zod mini version found')

  await page.getByRole('button', {name: `zod v${latestZodVersion.version}`}).click()
  await page.getByRole('option', {name: anotherZodVersion.version}).click()

  await expect(
    page.getByRole('button', {name: `zod v${latestZodVersion.version}`}),
  ).not.toBeVisible()

  await page.getByRole('button', {name: `zod v${anotherZodVersion.version}`}).click()

  await page.getByText('zod/mini').click()
  await page.getByRole('option', {name: zodMiniVersion.version}).click()

  await expect(
    page.getByRole('button', {name: `zod mini v${zodMiniVersion.version}`}),
  ).toBeVisible()
})

test('closing the version picker discards an unsubmitted package selection', async ({page}) => {
  const latestZodVersion = (await zod.getVersions('latest'))[0]
  const versionPicker = page.getByRole('button', {name: `zod v${latestZodVersion.version}`})

  await versionPicker.click()
  await page.getByText('zod/mini').click()
  await page.keyboard.press('Escape')

  await expect(versionPicker).toBeVisible()

  await versionPicker.click()
  await expect(page.locator('input[value="zod"]')).toBeChecked()
})

test('switching packages swaps the untouched default schema in both directions', async ({
  page,
  codeEditors,
}) => {
  const latestZodVersion = (await zod.getVersions('latest'))[0]

  const initialSchema = await codeEditors.getSchemaEditorContent()
  expect(initialSchema).toContain('birth_year:z.number().optional()')

  await page.getByRole('button', {name: `zod v${latestZodVersion.version}`}).click()
  await page.getByText('zod/mini').click()
  await page.getByRole('option', {name: latestZodVersion.version}).click()

  const miniSchema = await codeEditors.getSchemaEditorContent()
  expect(miniSchema).toContain('birth_year:z.optional(z.number())')

  await page.getByRole('button', {name: `zod mini v${latestZodVersion.version}`}).click()
  await page.getByText('zod', {exact: true}).click()
  await page.getByRole('option', {name: latestZodVersion.version}).click()

  const restoredSchema = await codeEditors.getSchemaEditorContent()
  expect(restoredSchema).toContain('birth_year:z.number().optional()')
})

test('switching packages preserves a custom schema', async ({page, codeEditors}) => {
  const latestZodVersion = (await zod.getVersions('latest'))[0]

  await codeEditors.writeSchema({text: 'z.string()'})
  const customSchema = await codeEditors.getSchemaEditorContent()

  await page.getByRole('button', {name: `zod v${latestZodVersion.version}`}).click()
  await page.getByText('zod/mini').click()
  await page.getByRole('option', {name: latestZodVersion.version}).click()

  expect(await codeEditors.getSchemaEditorContent()).toBe(customSchema)

  await page.getByRole('button', {name: `zod mini v${latestZodVersion.version}`}).click()
  await page.getByText('zod', {exact: true}).click()
  await page.getByRole('option', {name: latestZodVersion.version}).click()

  expect(await codeEditors.getSchemaEditorContent()).toBe(customSchema)
})

test('has default schema', async ({codeEditors}) => {
  const editorValue = await codeEditors.getSchemaEditorContent()

  // The leading digits "123456789" come from Monaco editor's line number gutter:
  // the DOM's textContent() includes the line numbers rendered on the left side
  // of the editor. The default schema has 9 lines (including comments and a
  // return statement), so Monaco renders numbers from 1 to 9 in the DOM, which
  // get concatenated to "123456789" after whitespace stripping in getMonacoContent().
  expect(editorValue).toEqual(
    '123456789//Configurethelocaleforerrormessages(optional)//z.config(z.locales.it())constschema=z.object({name:z.string(),birth_year:z.number().optional()})returnschema',
  )
})

test('loads the expected Monaco runtime with Zod TypeScript completions', async ({
  page,
  codeEditors,
}) => {
  // Verify that the browser runs Monaco 0.56 instead of only using its npm types.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const monacoResourceUrls = performance
          .getEntriesByType('resource')
          .map(({name}) => name)
          .filter((url) => url.includes('cdn.jsdelivr.net/npm/monaco-editor@'))

        return (
          monacoResourceUrls.length > 0 &&
          monacoResourceUrls.every((url) => url.includes('monaco-editor@0.56.0/min/vs'))
        )
      }),
    )
    .toBe(true)

  // Wait until the selected Zod version and its declaration files have loaded.
  await expect(
    page
      .locator('button')
      .filter({hasText: /^Valid$/})
      .first(),
  ).toBeVisible()

  // Filter completions with `z.obj` so the virtualized list renders the expected Zod API.
  await codeEditors.writeSchema({text: 'z.obj'})
  await page.keyboard.press('Control+Space')

  const suggestions = page.locator('.suggest-widget.visible')
  await expect(suggestions).toBeVisible()
  await expect(
    suggestions.locator('.monaco-list-row').filter({hasText: 'object'}).first(),
  ).toBeVisible()
})

test('has invalid marker when an invalid value is in the Value Editor', async ({
  page,
  codeEditors,
}) => {
  await codeEditors.writeValue({
    text: 'Invalid value',
  })

  await expect(page.locator('button').filter({hasText: /^Invalid$/})).toBeVisible()
})

test('reset schema and values clears a shared URL and persists defaults', async ({
  page,
  codeEditors,
}) => {
  const latestZodVersion = (await zod.getVersions('latest'))[0]
  const anotherZodVersion = (await zod.getVersions()).find(
    (zVersion) => zVersion.version !== latestZodVersion.version,
  )

  if (!anotherZodVersion) throw new Error('No another zod version found')

  await codeEditors.writeSchema({text: 'z.string()'})
  await codeEditors.writeValue({text: '123'})

  await page.getByRole('button', {name: `zod v${latestZodVersion.version}`}).click()
  await page.getByRole('option', {name: anotherZodVersion.version}).click()
  await expect(page.getByRole('button', {name: `zod v${anotherZodVersion.version}`})).toBeVisible()

  const sharedUrl = await shareCurrentAppData(page)
  await page.goto(sharedUrl)

  const resetButton = page.getByRole('button', {name: 'Reset schema and values'})
  await expect(resetButton).toBeEnabled()
  await resetButton.click()

  await expect(page).not.toHaveURL(/appdata=/)
  await expect(page.getByRole('button', {name: `zod v${latestZodVersion.version}`})).toBeVisible()
  expect(await codeEditors.getSchemaEditorContent()).toContain('birth_year:z.number().optional()')
  expect(await codeEditors.getValueEditorsContent()).toContain('{name:"John"}')

  await page.reload()

  await expect(page).not.toHaveURL(/appdata=/)
  expect(await codeEditors.getSchemaEditorContent()).toContain('birth_year:z.number().optional()')
  expect(await codeEditors.getValueEditorsContent()).toContain('{name:"John"}')
})

test('reset schema and values can be undone', async ({page, codeEditors}) => {
  await codeEditors.writeSchema({text: 'z.string()'})
  await codeEditors.writeValue({text: '"before reset"'})

  const sharedUrl = await shareCurrentAppData(page)
  await page.goto(sharedUrl)

  const resetButton = page.getByRole('button', {name: 'Reset schema and values'})
  await expect(resetButton).toBeEnabled()
  await resetButton.click()
  await page.getByRole('button', {name: 'Undo'}).click()

  await expect(page).toHaveURL(sharedUrl)
  expect(await codeEditors.getSchemaEditorContent()).toContain('z.string()')
  expect(await codeEditors.getValueEditorsContent()).toContain('"beforereset"')
})

test('should display results by default on wide screen', async ({page, codeEditors}) => {
  await page.setViewportSize({width: 1920, height: 1080})
  await codeEditors.writeSchema({
    text: '----',
  })

  await expect(page.getByText(/invalid schema/i)).toBeVisible()

  await page.getByRole('button', {name: 'Hide results'}).click()
  await expect(page.getByText(/invalid schema/i)).not.toBeVisible()

  await page.getByRole('button', {name: 'Show results'}).click()
  await expect(page.getByText(/invalid schema/i)).toBeVisible()
})

test('should hide results by default on narrow screen', async ({page, codeEditors}) => {
  await page.setViewportSize({width: 800, height: 600})
  await codeEditors.writeSchema({
    text: '----',
  })

  await expect(page.getByText(/invalid schema/i)).not.toBeVisible()
  await page.getByRole('button', {name: 'Show results'}).click()
  await expect(page.getByText(/invalid schema/i)).toBeVisible()

  await page.getByRole('button', {name: 'Hide results'}).click()
  await expect(page.getByText(/invalid schema/i)).not.toBeVisible()
})

test('supports TypeScript enum with z.nativeEnum()', async ({page, codeEditors}) => {
  await codeEditors.writeSchema({
    text: `enum ProductTypes {
  AvatarDecoration = 0,
  ProfileEffect = 1,
  Bundle = 1000
}

z.nativeEnum(ProductTypes)`,
  })

  // Write a valid enum value
  await codeEditors.writeValue({
    text: '0',
  })

  // Should show Valid badge
  await expect(page.locator('button').filter({hasText: /^Valid$/})).toBeVisible()

  // Test invalid enum value
  await codeEditors.writeValue({
    text: '999',
  })

  // Should show Invalid badge
  await expect(page.locator('button').filter({hasText: /^Invalid$/})).toBeVisible()
})

test('supports const declarations in schema', async ({page, codeEditors}) => {
  await codeEditors.writeSchema({
    text: `const nameSchema = z.string().min(2)

z.object({
  name: nameSchema,
  age: z.number()
})`,
  })

  await codeEditors.writeValue({
    text: '{name: "John", age: 30}',
  })

  await expect(page.locator('button').filter({hasText: /^Valid$/})).toBeVisible()
})

test('setting locale then removing it resets to English', async ({page, codeEditors}) => {
  await codeEditors.writeSchema({
    text: `// Configure locale to Spanish
z.config(z.locales.es())

const schema = z.object({
  name: z.string().min(5)
})

return schema`,
  })

  await codeEditors.writeValue({text: '{name: "a"}'})

  await expect(page.locator('button').filter({hasText: /^Invalid$/})).toBeVisible()
  await expect(page.getByText(/demasiado|peque|caracteres/i)).toBeVisible()

  await codeEditors.writeSchema({
    text: `// Remove locale config so errors fall back to English
const schema = z.object({
  name: z.string().min(5)
})

return schema`,
  })

  await expect(page.locator('button').filter({hasText: /^Invalid$/})).toBeVisible()
  await expect(page.getByText(/too small|expected string|characters/i)).toBeVisible()
})

test('supports nested schemas with const declarations', async ({page, codeEditors}) => {
  await codeEditors.writeSchema({
    text: `const addressSchema = z.object({
  street: z.string(),
  city: z.string()
})

z.object({
  name: z.string(),
  address: addressSchema
})`,
  })

  await codeEditors.writeValue({
    text: '{name: "John", address: {street: "123 Main St", city: "NYC"}}',
  })

  await expect(page.locator('button').filter({hasText: /^Valid$/})).toBeVisible()

  // Test invalid nested object
  await codeEditors.writeValue({
    text: '{name: "John", address: {street: "123 Main St"}}',
  })

  await expect(page.locator('button').filter({hasText: /^Invalid$/})).toBeVisible()
})

test('supports explicit return statement in schema', async ({page, codeEditors}) => {
  await codeEditors.writeSchema({
    text: `enum Status {
  Active = "active",
  Inactive = "inactive"
}

const metaSchema = z.object({
  createdAt: z.string()
})

return z.object({
  status: z.nativeEnum(Status),
  meta: metaSchema
})`,
  })

  await codeEditors.writeValue({
    text: '{status: "active", meta: {createdAt: "2025-01-01"}}',
  })

  await expect(page.locator('button').filter({hasText: /^Valid$/})).toBeVisible()
})

test('supports multi-line z.union with nested z.object', async ({page, codeEditors}) => {
  await codeEditors.writeSchema({
    text: `z.union([
  // Multidirectional glossary entry deletion
  z.object({
    guid: z.string(),
  }),
  // Unidirectional glossary entry deletion
  z.object({
    term: z.object({
      language: z.string().min(2),
      value: z.string().min(1),
    }),
  })
])`,
  })

  // Test first union variant
  await codeEditors.writeValue({
    text: '{guid: "abc-123"}',
  })

  await expect(page.locator('button').filter({hasText: /^Valid$/})).toBeVisible()

  // Test second union variant
  await codeEditors.writeValue({
    text: '{term: {language: "en", value: "hello"}}',
  })

  await expect(page.locator('button').filter({hasText: /^Valid$/})).toBeVisible()

  // Test invalid value
  await codeEditors.writeValue({
    text: '{invalid: "value"}',
  })

  await expect(page.locator('button').filter({hasText: /^Invalid$/})).toBeVisible()
})

test('supports multi-line z.union with leading indentation', async ({page, codeEditors}) => {
  await codeEditors.writeSchema({
    text: `    z.union([
  // Multidirectional glossary entry deletion
  z.object({
    guid: z.string(),
  }),
  // Unidirectional glossary entry deletion
  z.object({
    term: z.object({
      language: z.string().min(2),
      value: z.string().min(1),
    }),
  })
])`,
  })

  await codeEditors.writeValue({
    text: '{guid: "test-guid"}',
  })

  await expect(page.locator('button').filter({hasText: /^Valid$/})).toBeVisible()
})

test('supports multi-line z.union with consistent indentation', async ({page, codeEditors}) => {
  await codeEditors.writeSchema({
    text: `    z.union([
    // Multidirectional glossary entry deletion
    z.object({
        guid: z.string(),
    }),
    // Unidirectional glossary entry deletion
    z.object({
        term: z.object({
        language: z.string().min(2),
        value: z.string().min(1),
        }),
    })
    ])`,
  })

  await codeEditors.writeValue({
    text: '{term: {language: "fr", value: "bonjour"}}',
  })

  await expect(page.locator('button').filter({hasText: /^Valid$/})).toBeVisible()
})

test('uses the last standalone z.* expression when iterating on schema design', async ({
  page,
  codeEditors,
}) => {
  // First attempt - simple schema with just name
  await codeEditors.writeSchema({
    text: `z.object({ name: z.string() })`,
  })

  await codeEditors.writeValue({
    text: '{name: "John"}',
  })

  await expect(page.locator('button').filter({hasText: /^Valid$/})).toBeVisible()

  // Second attempt - added age field (append to existing schema)
  // The previous value should now be invalid because it's missing 'age'
  await codeEditors.writeSchema({
    text: `// First attempt - too simple
z.object({ name: z.string() })

// Second attempt - added age
z.object({ name: z.string(), age: z.number() })`,
  })

  // Previous value {name: "John"} should be invalid now (missing age)
  await expect(page.locator('button').filter({hasText: /^Invalid$/})).toBeVisible()

  // Update value to match second attempt schema
  await codeEditors.writeValue({
    text: '{name: "John", age: 30}',
  })

  await expect(page.locator('button').filter({hasText: /^Valid$/})).toBeVisible()

  // Final version - with validation constraints (append to existing schema)
  // The previous value should now be invalid because age must be positive
  await codeEditors.writeSchema({
    text: `// First attempt - too simple
z.object({ name: z.string() })

// Second attempt - added age
z.object({ name: z.string(), age: z.number() })

// Final version - with validation
z.object({ name: z.string().min(1), age: z.number().positive() })`,
  })

  // Value {name: "John", age: 30} should still be valid
  await expect(page.locator('button').filter({hasText: /^Valid$/})).toBeVisible()

  // Test that validation constraints are enforced
  await codeEditors.writeValue({
    text: '{name: "", age: 30}',
  })

  // Should be invalid because name must have min 1 character
  await expect(page.locator('button').filter({hasText: /^Invalid$/})).toBeVisible()

  await codeEditors.writeValue({
    text: '{name: "John", age: -5}',
  })

  // Should be invalid because age must be positive
  await expect(page.locator('button').filter({hasText: /^Invalid$/})).toBeVisible()

  // Valid value for final schema
  await codeEditors.writeValue({
    text: '{name: "John", age: 25}',
  })

  await expect(page.locator('button').filter({hasText: /^Valid$/})).toBeVisible()
})
