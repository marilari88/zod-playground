import {Box, Button, Center, Stack, Text, Textarea} from '@mantine/core'
import Editor, {loader} from '@monaco-editor/react'
import {editor} from 'monaco-editor'
import {useRef, useState} from 'react'
import {HiOutlineSquaresPlus} from 'react-icons/hi2'
import {ZodSchema, z} from 'zod'
import {generateErrorMessage} from 'zod-error'

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
const valueSchema = z.string()

type Values = {
  value: string
  response?: {success: true; data: unknown} | {success: false; error: string}
}

function App() {
  const [error, setError] = useState<string | null>()
  const [values, setValues] = useState<Values[]>([{value: ''}])
  const formRef = useRef<HTMLFormElement>(null)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  return (
    <form
      style={{height: '100%', width: '100%'}}
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault()

        if (formRef.current == null) return

        const formData = new FormData(formRef.current)

        try {
          const schema = schemaSchema.parse(editorRef.current?.getValue())

          const values = formData.getAll('value')

          const newValues: Values[] = values.map((v) => {
            const parsedValue = valueSchema.parse(v)
            const validationRes = schema.safeParse(
              new Function(`return ${parsedValue}`)(),
            )
            return {
              value: parsedValue,
              response: !!validationRes.success
                ? {success: true, data: validationRes.data}
                : {
                    success: false,
                    error: generateErrorMessage(validationRes.error.issues),
                  },
            }
          })
          setValues(newValues)
          setError(null)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'error')
        }
      }}
    >
      <Box
        h="100vh"
        style={(theme) => ({
          display: 'grid',
          gridTemplateRows: ' 60px 1fr auto',
          gridTemplateColumns: '1fr 1fr',
          columnGap: theme.spacing.md,
        })}
      >
        <Box p="md" bg="blue" style={{gridColumn: '1 / -1', height: '60px'}}>
          <Text style={{color: 'white'}}>Zod Playground</Text>
        </Box>
        <Box p="md">
          <label>
            Zod schema
            <Editor
              height="90%"
              defaultLanguage="typescript"
              onMount={(editor) => {
                editorRef.current = editor
              }}
              options={editorOptions}
            />
          </label>
        </Box>

        <Box p="md" style={{overflow: 'auto', maxHeight: '100%'}}>
          <Box style={{width: '100%', textAlign: 'right'}}>
            <Button
              onClick={() => {
                setValues((values) => [...values, {value: ''}])
              }}
              title="Add a value to validate"
            >
              <HiOutlineSquaresPlus />
            </Button>
          </Box>
          <Stack>
            {values.map((value, index) => {
              return (
                <div key={`val${index}`}>
                  <label>
                    Value
                    <Textarea name="value" />
                  </label>
                  {!!value.response?.success && (
                    <div>{JSON.stringify(value.response?.data)}</div>
                  )}
                  {!value.response?.success && (
                    <div>{JSON.stringify(value.response?.error)}</div>
                  )}
                </div>
              )
            })}
          </Stack>
        </Box>
        <Box style={{gridColumn: '1 / -1'}}>
          <Center w="100%" p="md">
            <Button type="submit">Validate</Button>
          </Center>
          {error && <div>{JSON.stringify(error)}</div>}
        </Box>
      </Box>
    </form>
  )
}

export default App
