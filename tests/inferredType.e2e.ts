import {expect} from '@playwright/test'
import {test} from './fixtures'

test('updates inference for expressions, transforms, and typed schemas', async ({
  page,
  codeEditors,
}) => {
  const preview = page.getByRole('region', {name: 'Inferred type', exact: true}).locator('pre')
  await expect(preview).toContainText('name: string;')

  await codeEditors.writeSchema({text: 'z.string().transform(value => value.length)'})
  await expect(preview).toHaveText('type Inferred = number')

  await codeEditors.writeSchema({text: 'z.string()\nz.union([z.literal("ok"), z.null()])'})
  await expect(preview).toHaveText('type Inferred = "ok" | null')

  await codeEditors.writeSchema({
    text: 'const schema = z.custom<{id: string; tags?: string[]}>()\nreturn schema',
  })
  await expect(preview).toContainText('id: string;')
  await expect(preview).toContainText('tags?: string[]')
})

test('clears stale inference on errors and empty schemas, then recovers', async ({
  page,
  codeEditors,
}) => {
  const panel = page.getByRole('region', {name: 'Inferred type', exact: true})
  const preview = panel.locator('pre')
  await expect(preview).toContainText('name: string;')

  await codeEditors.writeSchema({text: 'z.missing()'})
  await expect(preview).not.toBeVisible()
  await expect(panel).toContainText('does not exist')
  await expect(panel.getByRole('button', {name: 'Copy inferred type'})).toBeDisabled()

  await page.getByRole('button', {name: 'Clear schema', exact: true}).click()
  await expect(panel).toContainText('Write a schema to see its inferred type.')

  await codeEditors.writeSchema({text: 'z.boolean()'})
  await expect(preview).toHaveText('type Inferred = boolean')
})

test('refreshes inference when switching to Mini and Zod 3', async ({page}) => {
  const preview = page.getByRole('region', {name: 'Inferred type', exact: true}).locator('pre')
  await expect(preview).toContainText('name: string;')

  await page.getByRole('button', {name: /^Zod v/}).click()
  await page.getByText('zod/mini', {exact: true}).click()
  await page.getByRole('option').first().click()
  await expect(page.getByRole('button', {name: /^Zod Mini v/})).toBeVisible()
  await expect(preview).toContainText('name: string;')
  await expect(preview).toContainText('birth_year?: number')

  await page.getByRole('button', {name: /^Zod Mini v/}).click()
  await page.getByText('zod', {exact: true}).click()
  await page.getByPlaceholder('Search a version').fill('3.25.76')
  await page.getByRole('option', {name: '3.25.76', exact: true}).click()
  await expect(page.getByRole('button', {name: 'Zod v3.25.76', exact: true})).toBeVisible()
  await expect(preview).toContainText('name: string;')
  await expect(preview).toContainText('birth_year?: number')
})

test('does not offer stale types when a declaration download fails', async ({page}) => {
  await page.route('**/npm/zod@*/index.d.ts', (route) =>
    route.fulfill({status: 503, body: 'Type definitions unavailable'}),
  )
  await page.reload()

  const panel = page.getByRole('region', {name: 'Inferred type', exact: true})
  await expect(panel).toContainText('Type definitions could not be loaded.')
  await expect(panel.locator('pre')).not.toBeVisible()
  await expect(panel.getByRole('button', {name: 'Copy inferred type'})).toBeDisabled()
})
