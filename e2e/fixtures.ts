import {Page} from '@playwright/test'

export enum Editor {
  schema = 0,
  value = 1,
}

export const writeInMonaco = async (
  page: Page,
  text: string,
  editor: Editor = Editor.value,
  deletePreviousContent: boolean = true,
) => {
  const monacoEditor = page.locator('.monaco-editor').nth(editor)
  await monacoEditor.click()
  if (deletePreviousContent) {
    await page.keyboard.press('ControlOrMeta+KeyA')
  }
  await page.keyboard.type(text)
}
