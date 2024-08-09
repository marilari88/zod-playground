import {Page} from '@playwright/test'

/**
 * This function can be used  to write some content within a monaco editor
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
  page: Page
  text: string
  editorNth?: number
  deletePreviousContent?: boolean
}) => {
  const monacoEditor = page.locator('.monaco-editor').nth(editorNth)
  await monacoEditor.click()
  if (deletePreviousContent) {
    await page.keyboard.press('ControlOrMeta+KeyA')
  }
  await page.keyboard.type(text)
}
