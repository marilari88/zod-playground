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

const schema = `z.object({
  name: z.string(),
  birth_year: z.number().optional()
})`

const values = ['{name: "John"}']

const version = (await zod.getVersions('latest'))[0]

export const DEFAULT_APP_DATA = {
  schema,
  values,
  version,
}

export const STORAGE_KEY = 'zod-playground'
