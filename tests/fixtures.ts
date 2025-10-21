import type {Locator, Page} from '@playwright/test'
import {test as base} from '@playwright/test'

export const test = base.extend<{
  codeEditors: CodeEditors
}>({
  codeEditors: async ({page}, use) => {
    const codeEditors = new CodeEditors(page)
    await use(codeEditors)
  },
  page: async ({baseURL, page}, use) => {
    if (!baseURL) throw new Error('baseURL is required')
    await page.goto(baseURL)
    await use(page)
  },
})

export class CodeEditors {
  private readonly codeEditors: Locator

  constructor(public readonly page: Page) {
    this.codeEditors = this.page.getByRole('code')
  }

  async getSchemaEditorContent({formatOutput = true}: {formatOutput?: boolean} = {}) {
    return await getMonacoContent({locator: this.codeEditors.first(), formatOutput})
  }

  async getValueEditorsContent({
    nth = 0,
    formatOutput = true,
  }: {
    nth?: number
    formatOutput?: boolean
  } = {}) {
    return await getMonacoContent({locator: this.codeEditors.nth(nth + 1), formatOutput})
  }

  async writeSchema({
    text,
    replacePreviousContent = true,
  }: {
    text: string
    replacePreviousContent?: boolean
  }) {
    await writeInMonaco({
      locator: this.codeEditors.first(),
      page: this.page,
      text,
      replacePreviousContent,
    })
  }

  async writeValue({
    nth = 0,
    text,
    replacePreviousContent = true,
  }: {
    nth?: number
    text: string
    replacePreviousContent?: boolean
  }) {
    await writeInMonaco({
      locator: this.codeEditors.nth(nth + 1),
      page: this.page,
      text,
      replacePreviousContent,
    })
  }
}

/**
 * This function can be used to write some content within a monaco editor
 *
 * @param {Object} params - The parameters object
 * @param {Locator} params.locator - The locator for the editor element
 * @param {Page} params.page - The Playwright page object
 * @param {string} params.text - The text to write inside the editor
 * @param {boolean} [params.replacePreviousContent=true] - Optionally delete the existing content in the editor. Defaults to true
 */
const writeInMonaco = async ({
  locator,
  page,
  text,
  replacePreviousContent,
}: {
  locator: Locator
  page: Page
  text: string
  replacePreviousContent?: boolean
}) => {
  await locator.click()
  if (replacePreviousContent) {
    await page.keyboard.press('ControlOrMeta+KeyA')
  }
  await page.keyboard.type(text)
}

/**
 * This function can be used to retrieve the full content within a monaco editor
 *
 * @param {Object} params - The parameters object
 * @param {Locator} params.locator - The locator for the editor element
 * @param {Page}  params.page - The playwright page object
 * @param {boolean} [params.formatOutput=true] - Optionally clean the string to have a more reliable way of asserting equalities. Defaults to true
 */
export const getMonacoContent = async ({
  locator,
  formatOutput = true,
}: {
  locator: Locator
  formatOutput?: boolean
}) => {
  // Wait for Monaco editor to be fully loaded and have content
  await locator.waitFor({state: 'visible'})

  const value = await locator.textContent()

  if (formatOutput) {
    return value?.replace(/\s+/g, '')
  }

  return value
}
