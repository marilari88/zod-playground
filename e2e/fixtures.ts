import type {Page} from '@playwright/test'

type BaseMonacoFixturesProps = {
  page: Page
  editorNth?: number
}

/**
 * This function can be used to write some content within a monaco editor
 *
 * @param {Page}  page - The playwright page object
 * @param {string} text - The text to write inside the editor
 * @param {number} [editorNth=0] - Optional editor number in order of appearance within the DOM. Defaults to 0
 * @param {boolean} [deletePreviousContent=true] - Optionally delete the existing content in the editor. Defaults to true
 */
export const writeInMonaco = async ({
  page,
  text,
  editorNth = 0,
  deletePreviousContent = true,
}: {
  text: string
  deletePreviousContent?: boolean
} & BaseMonacoFixturesProps) => {
  const monacoEditor = page.locator('.monaco-editor').nth(editorNth)
  await monacoEditor.click()
  if (deletePreviousContent) {
    await page.keyboard.press('ControlOrMeta+KeyA')
  }
  await page.keyboard.type(text)
}

/**
 * This function can be used to retrieve the full content within a monaco editor
 *
 * @param {Page}  page - The playwright page object
 * @param {number} [editorNth=0] - Optional editor number in order of appearance within the DOM. Defaults to 0
 * @param {boolean} [formatOutput=true] - Optionally clean the string to have a more reliable way of asserting equalities. Defaults to true
 */
export const fetchMonacoContent = async ({
  page,
  editorNth = 0,
  formatOutput = true,
}: {formatOutput?: boolean} & BaseMonacoFixturesProps) => {
  const editor = page.getByRole('code').nth(editorNth)
  const value = await editor.textContent()

  if (formatOutput) {
    return value?.replace(/\s+/g, '')
  }

  return value
}
