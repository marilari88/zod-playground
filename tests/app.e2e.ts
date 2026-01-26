import {expect} from '@playwright/test'

import * as zod from '../src/zod'
import {test} from './fixtures'

test('has title "Zod Playground', async ({page}) => {
  await expect(page).toHaveTitle(/Zod Playground/)
})

test('has header with title, share, theme toggler and github repo link', async ({page}) => {
  await expect(page.getByText('Zod Playground')).toBeVisible()
  await expect(page.getByRole('button', {name: 'Share'})).toBeVisible()
  await expect(page.getByLabel('Toggle color scheme')).toBeVisible()
  await expect(page.getByRole('banner').getByRole('link')).toHaveAttribute(
    'href',
    'https://github.com/marilari88/zod-playground',
  )
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

test('has default schema', async ({codeEditors}) => {
  const editorValue = await codeEditors.getSchemaEditorContent()

  expect(editorValue).toEqual('1234z.object({name:z.string(),birth_year:z.number().optional()})')
})

test('has invalid marker when an invalid value is in the Value Editor', async ({
  page,
  codeEditors,
}) => {
  await codeEditors.writeValue({
    text: 'Invalid value',
  })

  await expect(page.locator('div').filter({hasText: /^Invalid$/})).toBeVisible()
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
  await expect(page.locator('div').filter({hasText: /^Valid$/})).toBeVisible()

  // Test invalid enum value
  await codeEditors.writeValue({
    text: '999',
  })

  // Should show Invalid badge
  await expect(page.locator('div').filter({hasText: /^Invalid$/})).toBeVisible()
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

  await expect(page.locator('div').filter({hasText: /^Valid$/})).toBeVisible()
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

  await expect(page.locator('div').filter({hasText: /^Valid$/})).toBeVisible()

  // Test invalid nested object
  await codeEditors.writeValue({
    text: '{name: "John", address: {street: "123 Main St"}}',
  })

  await expect(page.locator('div').filter({hasText: /^Invalid$/})).toBeVisible()
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

  await expect(page.locator('div').filter({hasText: /^Valid$/})).toBeVisible()
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

  await expect(page.locator('div').filter({hasText: /^Valid$/})).toBeVisible()

  // Test second union variant
  await codeEditors.writeValue({
    text: '{term: {language: "en", value: "hello"}}',
  })

  await expect(page.locator('div').filter({hasText: /^Valid$/})).toBeVisible()

  // Test invalid value
  await codeEditors.writeValue({
    text: '{invalid: "value"}',
  })

  await expect(page.locator('div').filter({hasText: /^Invalid$/})).toBeVisible()
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

  await expect(page.locator('div').filter({hasText: /^Valid$/})).toBeVisible()
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

  await expect(page.locator('div').filter({hasText: /^Valid$/})).toBeVisible()
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

  await expect(page.locator('div').filter({hasText: /^Valid$/})).toBeVisible()

  // Second attempt - added age field (append to existing schema)
  // The previous value should now be invalid because it's missing 'age'
  await codeEditors.writeSchema({
    text: `// First attempt - too simple
z.object({ name: z.string() })

// Second attempt - added age
z.object({ name: z.string(), age: z.number() })`,
  })

  // Previous value {name: "John"} should be invalid now (missing age)
  await expect(page.locator('div').filter({hasText: /^Invalid$/})).toBeVisible()

  // Update value to match second attempt schema
  await codeEditors.writeValue({
    text: '{name: "John", age: 30}',
  })

  await expect(page.locator('div').filter({hasText: /^Valid$/})).toBeVisible()

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
  await expect(page.locator('div').filter({hasText: /^Valid$/})).toBeVisible()

  // Test that validation constraints are enforced
  await codeEditors.writeValue({
    text: '{name: "", age: 30}',
  })

  // Should be invalid because name must have min 1 character
  await expect(page.locator('div').filter({hasText: /^Invalid$/})).toBeVisible()

  await codeEditors.writeValue({
    text: '{name: "John", age: -5}',
  })

  // Should be invalid because age must be positive
  await expect(page.locator('div').filter({hasText: /^Invalid$/})).toBeVisible()

  // Valid value for final schema
  await codeEditors.writeValue({
    text: '{name: "John", age: 25}',
  })

  await expect(page.locator('div').filter({hasText: /^Valid$/})).toBeVisible()
})

test('locale picker is visible with default locale en', async ({page}) => {
  await expect(page.getByRole('button', {name: /en/})).toBeVisible()
})

test('can change locale via locale picker', async ({page}) => {
  await page.getByRole('button', {name: /en/}).click()

  const localeOptions = await page.getByRole('option').count()

  expect(localeOptions).toBeGreaterThan(1)

  const localeElements = page.getByRole('option')
  const secondLocale = await localeElements.nth(1).textContent()

  await page.getByRole('option').nth(1).click()

  await expect(page.getByRole('button', {name: new RegExp(secondLocale || '')})).toBeVisible()
  await expect(page.getByRole('button', {name: /en/})).not.toBeVisible()
})
