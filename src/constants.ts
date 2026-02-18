import type {editor} from 'monaco-editor'
import * as zod from './zod'

export const EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  minimap: {
    enabled: false,
  },
  scrollBeyondLastLine: false,
  scrollbar: {
    useShadows: false,
  },
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  renderLineHighlight: 'none',
}

const schema = `// Configure the locale for error messages (optional)
// z.config(z.locales.it())

const schema = z.object({
  name: z.string(),
  birth_year: z.number().optional()
})

return schema`

const values = ['{name: "John"}']

const version = (await zod.getVersions('latest'))[0].version

export const DEFAULT_APP_DATA = {
  schema,
  values,
  version,
  isZodMini: false,
}

export const STORAGE_KEY = 'zod-playground'
