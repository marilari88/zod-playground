import {test, expect} from '@playwright/test'
import {writeInMonaco} from './fixtures'

import * as zod from '../src/zod'

test('has title "Zod Playground', async ({page}) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Zod Playground/)
})

test('has header with title, share, theme toggler and github repo link', async ({page}) => {
  await page.goto('/')

  await expect(page.getByText('Zod Playground')).toBeVisible()
  await expect(page.getByRole('button', {name: 'Share'})).toBeVisible()
  await expect(page.getByLabel('Toggle color scheme')).toBeVisible()
  await expect(page.getByRole('banner').getByRole('link')).toHaveAttribute(
    'href',
    'https://github.com/marilari88/zod-playground',
  )
})

test('zod version switch', async ({page}) => {
  await page.goto('/')

  const latestZodVersion = (await zod.getVersions('latest'))[0]
  const anotherZodVersion = (await zod.getVersions()).find(
    (zVersion) => zVersion !== latestZodVersion,
  )

  await page.getByRole('button', {name: `v${latestZodVersion}`}).click()
  await page.getByRole('option', {name: anotherZodVersion}).click()

  await expect(page.getByRole('button', {name: `v${latestZodVersion}`})).not.toBeVisible()
  await expect(page.getByRole('button', {name: `v${anotherZodVersion}`})).toBeVisible()
})

test('has default schema', async ({page}) => {
  await page.goto('/')

  const editor = await page.getByRole('textbox').nth(0)
  const editorValue = await editor.evaluate((e) => e.textContent)
  await expect(editorValue).toContain(`z.object({
  name: z.string(),
  birth_year: z.number().optional()
})`)
})

test('has invalid marker when an invalid value is in the Value Editor', async ({page}) => {
  await page.goto('/')

  await writeInMonaco({page, text: 'Invalid value'})

  await expect(page.locator('div').filter({hasText: /^Invalid$/})).toBeVisible()
})
