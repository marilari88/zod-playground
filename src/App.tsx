import {AppShell, Button, Header, Text, Textarea} from '@mantine/core'
import Editor, {loader} from '@monaco-editor/react'
import {useRef, useState} from 'react'
import {z, ZodSchema} from 'zod'
import {editor} from 'monaco-editor'

import str2 from '../node_modules/zod/lib/types.d.ts?raw'

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: {enabled: false},
  theme: 'vs',
  scrollBeyondLastLine: false,
  scrollbar: {
    // Subtle shadows to the left & top. Defaults to true.
    useShadows: false,

    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  automaticLayout: true,
}

var libUri = 'file:///node_modules/zod/lib/index.d.ts'

loader.init().then((monaco) => {
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `declare namespace z{${str2}}`,
    libUri,
  )
})

const schemaSchema = z
  .string()
  .min(2)
  .transform((s) => eval(s))
  .pipe(z.custom<ZodSchema>())
const valueSchema = z.string().transform((s) => new Function(`return ${s}`))

function App() {
  const [res, setRes] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  return (
    <AppShell
      header={
        <Header height={{base: 60}} p="md" bg="violet">
          <Text color="white">Zod Playground</Text>
        </Header>
      }
    >
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault()

          if (formRef.current == null) return

          const formData = new FormData(formRef.current)

          try {
            const schema = schemaSchema.parse(editorRef.current?.getValue())
            const value = valueSchema.parse(formData.get('value'))()

            const res = schema.safeParse(value)
            setRes(res.success ? res.data : res.error)
          } catch (e) {
            setRes(e instanceof Error ? e.message : 'error')
          }
        }}
      >
        <label>
          Zod schema
          <Editor
            height="30vh"
            defaultLanguage="typescript"
            onMount={(editor) => {
              editorRef.current = editor
            }}
            options={editorOptions}
          />
        </label>
        <label>
          Value
          <Textarea name="value" />
        </label>
        <Button color="violet" type="submit">
          Validate
        </Button>
        <hr />
        <div>{JSON.stringify(res)}</div>
      </form>
    </AppShell>
  )
}

export default App
