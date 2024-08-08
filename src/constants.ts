import * as zod from './zod'
import {editor} from 'monaco-editor'

export const DEFAULT_ZOD_VERSION = (await zod.getVersions('latest'))[0]

export const EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  minimap: {
      enabled: false
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

export const DEFAULT_ZOD_SCHEMA = `z.object({
  name: z.string(),
  birth_year: z.number().optional()
})`

export const DEFAULT_TEST_VALUE = '{name: "John"}'

export const DEFAULT_APP_DATA = {
  schema: '',
  values: [],
  version: DEFAULT_ZOD_VERSION,
}

export const STORAGE_KEY = 'zod-playground'
