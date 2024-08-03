import * as zod from './zod'
import {editor} from 'monaco-editor'

export const ZOD_DEFAULT_VERSION = (await zod.getVersions('latest'))[0]

export const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: {enabled: false},
  scrollBeyondLastLine: false,
  scrollbar: {
    // Subtle shadows to the left & top. Defaults to true.
    useShadows: false,
    vertical: 'auto',

    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  renderLineHighlight: 'none',
}

export const sampleZodSchema = `z.object({
  name: z.string(),
  birth_year: z.number().optional()
})`

export const sampleValue = '{name: "John"}'

export const defaultAppData = {
  schema: '',
  values: [],
  version: ZOD_DEFAULT_VERSION,
}

export const STORAGE_KEY = 'zod-playground'
