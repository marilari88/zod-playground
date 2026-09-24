import {expect} from '@playwright/test'
import {test} from './fixtures'

test('switches between input and output for transforms, defaults, coercion, and typed schemas', async ({
  page,
  codeEditors,
}) => {
  const panel = page.getByRole('region', {name: 'Inferred type', exact: true})
  const preview = panel.locator('pre')
  const input = panel.getByRole('radio', {name: 'Input', exact: true})
  const output = panel.getByRole('radio', {name: 'Output', exact: true})
  await expect(preview).toContainText('name: string;')
  await expect(output).toBeChecked()

  await codeEditors.writeSchema({text: 'z.string().transform(value => value.length)'})
  await expect(preview).toHaveText('type InferredOutput = number')
  await panel.getByText('Input', {exact: true}).click()
  await expect(preview).toHaveText('type InferredInput = string')
  await expect(panel.getByRole('button', {name: 'Copy input type'})).toBeEnabled()

  await codeEditors.writeSchema({text: 'z.string().default("fallback")'})
  await expect(input).toBeChecked()
  await expect(preview).toHaveText('type InferredInput = string | undefined')
  await panel.getByText('Output', {exact: true}).click()
  await expect(preview).toHaveText('type InferredOutput = string')

  await codeEditors.writeSchema({text: 'z.coerce.number()'})
  await expect(preview).toHaveText('type InferredOutput = number')
  await panel.getByText('Input', {exact: true}).click()
  await expect(preview).toHaveText('type InferredInput = unknown')

  await codeEditors.writeSchema({text: 'z.string()\nz.union([z.literal("ok"), z.null()])'})
  await expect(preview).toHaveText('type InferredInput = "ok" | null')
  await panel.getByText('Output', {exact: true}).click()
  await expect(preview).toHaveText('type InferredOutput = "ok" | null')

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
  await expect(panel.getByRole('button', {name: 'Copy output type'})).toBeDisabled()

  await page.getByRole('button', {name: 'Clear schema', exact: true}).click()
  await expect(panel).toContainText('Write a schema to see its inferred type.')

  await codeEditors.writeSchema({text: 'z.boolean()'})
  await expect(preview).toHaveText('type InferredOutput = boolean')
})

test('refreshes inference when switching to Mini and Zod 3', async ({page}) => {
  const panel = page.getByRole('region', {name: 'Inferred type', exact: true})
  const preview = panel.locator('pre')
  await expect(preview).toContainText('name: string;')

  await panel.getByText('Input', {exact: true}).click()
  await expect(preview).toContainText('type InferredInput')

  await page.getByRole('button', {name: /^Zod v/}).click()
  await page.getByText('zod/mini', {exact: true}).click()
  await page.getByRole('option').first().click()
  await expect(page.getByRole('button', {name: /^Zod Mini v/})).toBeVisible()
  await expect(preview).toContainText('name: string;')
  await expect(preview).toContainText('birth_year?: number')
  await expect(panel.getByRole('radio', {name: 'Input', exact: true})).toBeChecked()

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
  await expect(panel.getByRole('button', {name: 'Copy output type'})).toBeDisabled()
})
