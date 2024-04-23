import {
  Box,
  Button,
  Center,
  Flex,
  SimpleGrid,
  Stack,
  Textarea,
  useMantineTheme,
} from '@mantine/core'
import Editor, {loader} from '@monaco-editor/react'
import {editor} from 'monaco-editor'
import {useRef, useState} from 'react'
import {FiCheckCircle, FiXCircle} from 'react-icons/fi'
import {ZodSchema, z} from 'zod'
import {generateErrorMessage} from 'zod-error'

import str2 from '../node_modules/zod/lib/types.d.ts?raw'
import classes from './App.module.css'
import {Header} from './ui/Header/Header'

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

const libUri = 'file:///node_modules/zod/lib/index.d.ts'

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

  const theme = useMantineTheme()

  return (
    <Box className={classes.layout}>
      <Header />
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
                response: validationRes.success
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
        <SimpleGrid cols={2} h="80%" spacing={0}>
          <div className={classes.leftPanel}>
            <div className={classes.sectionTitle}>Zod schema</div>
            <div className={classes.editor}>
              <Editor
                height="90%"
                defaultLanguage="typescript"
                onMount={(editor) => {
                  editorRef.current = editor
                }}
                options={editorOptions}
              />
            </div>
          </div>

          <div>
            <Flex
              className={classes.sectionTitle}
              align="center"
              justify="space-between"
            >
              Value to be parsed using the Zod schema
              <Button
                size="compact-xs"
                onClick={() => {
                  setValues((values) => [...values, {value: ''}])
                }}
              >
                Add a value
              </Button>
            </Flex>
            <Stack className={classes.valuesStack}>
              {values.map((value, index) => {
                return (
                  <Stack
                    gap={theme.spacing.sm}
                    key={`val${index}`}
                    className={classes.valueCards}
                  >
                    <Textarea
                      error={!!value.response && !value.response.success}
                      name="value"
                      autosize={true}
                      rightSection={
                        value.response &&
                        (value.response?.success ? (
                          <FiCheckCircle color={theme.colors.green[8]} />
                        ) : (
                          <FiXCircle color={theme.colors.red[8]} />
                        ))
                      }
                    />
                    {value.response && (
                      <div className={classes.valueResult}>
                        {value.response.success && (
                          <div>{JSON.stringify(value.response?.data)}</div>
                        )}
                        {!value.response.success && (
                          <div>{JSON.stringify(value.response?.error)}</div>
                        )}
                      </div>
                    )}
                  </Stack>
                )
              })}
            </Stack>
          </div>
        </SimpleGrid>
        <Box style={{gridColumn: '1 / -1'}}>
          <Center w="100%" p="md">
            <Button type="submit">Validate</Button>
          </Center>
          {error && <div>{JSON.stringify(error)}</div>}
        </Box>
      </form>
    </Box>
  )
}

export default App
