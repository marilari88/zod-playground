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
