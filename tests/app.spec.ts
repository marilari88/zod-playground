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
  const zodMiniVersion = (await zod.getVersions()).find(
    (zVersion) => zVersion.packageName === '@zod/mini',
  )

  if (!latestZodVersion) throw new Error('No zod version found')
  if (!anotherZodVersion) throw new Error('No another zod version found')
  if (!zodMiniVersion) throw new Error('No zod mini version found')

  await page.getByRole('button', {name: `zod v${latestZodVersion.version}`}).click()
  await page.getByRole('option', {name: anotherZodVersion.version}).click()

  await expect(
    page.getByRole('button', {name: `zod v${latestZodVersion.version}`}),
  ).not.toBeVisible()

  await page.getByRole('button', {name: `zod v${anotherZodVersion.version}`}).click()

  await page.getByText('@zod/mini').click()
  await page.getByRole('option', {name: zodMiniVersion.version}).click()

  await expect(
    page.getByRole('button', {name: `@zod/mini v${zodMiniVersion.version}`}),
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
