import {expect, type Locator, type Page} from '@playwright/test'
import type {AppData} from '../src/utils/appData'
import {test} from './fixtures'

test.use({viewport: {width: 1920, height: 1080}})

async function expectEditorContent(
  page: Page,
  editor: Locator,
  kind: 'schema' | 'value',
  expected: string,
) {
  // Persistence happens after React commits and the app's debounce expires.
  // Waiting for it lets us check the caret again after pending updates settle.
  await expect
    .poll(() =>
      page.evaluate((kind) => {
        const saved = localStorage.getItem('zod-playground')
        if (!saved) return
        const data: AppData = JSON.parse(saved)
        return kind === 'schema' ? data.schema : data.values[0]
      }, kind),
    )
    .toBe(expected)

  // Check the editor too: a stale controlled update can change Monaco without
  // firing onChange, leaving React state and the visible document different.
  await expect(editor.locator('.view-lines')).toHaveText(expected)
}

for (const kind of ['schema', 'value'] as const) {
  test(`${kind} editor preserves text and caret during rapid typing`, async ({
    page,
    context,
    browserName,
    codeEditors,
  }) => {
    // Allow for initial Zod loading and CPU throttling on CI.
    test.setTimeout(60_000)
    await expect(page.getByRole('button', {name: 'Valid', exact: true}).first()).toBeVisible({
      timeout: 15_000,
    })

    const editor = page.getByRole('code').nth(kind === 'schema' ? 0 : 1)
    const prefix = kind === 'schema' ? 'z.literal("left' : '"left'
    const suffix = kind === 'schema' ? 'right")' : 'right"'
    let expected = prefix + suffix

    // Pasting is only setup. The regression requires separate keyboard events.
    if (kind === 'schema') {
      await codeEditors.writeSchema({text: expected})
    } else {
      await codeEditors.writeValue({text: expected})
    }
    await expectEditorContent(page, editor, kind, expected)

    await page.keyboard.press('Home')
    for (let i = 0; i < prefix.length; i++) {
      await page.keyboard.press('ArrowRight')
    }

    // Slow the renderer to increase overlap between typing and React updates.
    // Firefox still exercises the same editing behavior without CDP throttling.
    const session = browserName === 'chromium' ? await context.newCDPSession(page) : undefined
    try {
      await session?.send('Emulation.setCPUThrottlingRate', {rate: 6})

      let inserted = ''
      for (const burst of ['abcdefgh', 'ijklmnop', 'qrstuvwx']) {
        // Letters inside an existing string avoid auto-closing and completion.
        // Do not wait between characters or reposition the caret between bursts.
        await page.keyboard.type(burst, {delay: 0})
        inserted += burst
        expected = prefix + inserted + suffix
        await expectEditorContent(page, editor, kind, expected)
      }

      // A jump after the final character can leave all text intact. Typing once
      // more after updates settle checks that the caret is still before suffix.
      await page.keyboard.type('Z')
      await expectEditorContent(page, editor, kind, `${prefix}${inserted}Z${suffix}`)
    } finally {
      await session?.send('Emulation.setCPUThrottlingRate', {rate: 1})
      await session?.detach()
    }
  })
}
