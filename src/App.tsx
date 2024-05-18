import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Flex,
  Tooltip,
  useMantineTheme,
} from '@mantine/core'
import {notifications} from '@mantine/notifications'
import Editor, {loader} from '@monaco-editor/react'
import LZString from 'lz-string'
import {editor} from 'monaco-editor'
import {useState} from 'react'
import {FiAlertCircle, FiLink} from 'react-icons/fi'
import {LuEraser} from 'react-icons/lu'
import {ZodSchema, z} from 'zod'

import zodTypes from '../node_modules/zod/lib/types.d.ts?raw'
import {dependencies} from '../package.json'
import classes from './App.module.css'
import {CopyButton} from './features/CopyButton'
import {Validation} from './features/ValueEditor/ValueEditor'
import {AppData, appDataSchema} from './types'
import {Header} from './ui/Header/Header'

const ZOD_VERSION = dependencies.zod.split('^')[1]

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: {enabled: false},
  theme: 'vs',
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

loader.init().then((monaco) => {
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `declare namespace z{${zodTypes}}`,
  )
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  })
})

const getAppDataFromSearchParams = (): AppData => {
  const urlParams = new URLSearchParams(window.location.search)
  const compressedAppData = urlParams.get('appdata')

  if (!compressedAppData)
    return {
      schema: '',
      values: [],
    }

  const decompressedAppData =
    LZString.decompressFromEncodedURIComponent(compressedAppData)
  const appData = JSON.parse(decompressedAppData)

  return appDataSchema.parse(appData)
}

const getURLwithAppData = (appData: AppData): string => {
  const queryParams = new URLSearchParams()
  const compressedAppData = LZString.compressToEncodedURIComponent(
    JSON.stringify(appData),
  )
  queryParams.set('appdata', compressedAppData)

  return `${window.location.protocol}//${window.location.host}?${queryParams}`
}

const schemaSchema = z
  .string()
  .min(2)
  .transform((s, ctx) => {
    try {
      return eval(s)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Invalid schema'

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: errorMessage,
      })
      return z.NEVER
    }
  })
  .pipe(z.custom<ZodSchema>())

const sampleZodSchema = `z.object({
  name: z.string(),
  birth_year: z.number().optional()
})`

const sampleValue = '{name: "John"}'

const appData = getAppDataFromSearchParams()

const evaluateSchema = (schema: string) => {
  try {
    const evaluatedSchema = schemaSchema.parse(schema)
    return {evaluatedSchema}
  } catch (e) {
    if (e instanceof z.ZodError) return {error: e.message}

    return {error: 'Invalid schema'}
  }
}

const App = () => {
  const [schema, setSchema] = useState<string>(() => {
    return appData.schema || sampleZodSchema
  })

  const [values, setValues] = useState<Array<string>>(() => {
    return appData.values.length ? appData.values : [sampleValue]
  })

  const {evaluatedSchema, error: schemaError} = evaluateSchema(schema)

  const theme = useMantineTheme()

  return (
    <Box className={classes.layout}>
      <Header>
        <Tooltip
          withArrow
          label="Create a link to share the current schema and values"
        >
          <Button
            variant="light"
            onClick={() => {
              const urlWithAppData = getURLwithAppData({
                schema,
                values: values.filter(
                  (value): value is string => typeof value == 'string',
                ),
              })
              navigator.clipboard.writeText(urlWithAppData)
              notifications.show({
                title: 'The link has been copied to the clipboard',
                message: 'Share it with your friends!',
                icon: <FiLink />,
              })
            }}
            rightSection={<FiLink />}
          >
            Share
          </Button>
        </Tooltip>
      </Header>
      <main className={classes.main}>
        <div className={classes.leftPanel}>
          <Flex
            className={classes.sectionTitle}
            align="center"
            justify="space-between"
            gap="sm"
            bg={schemaError ? theme.colors.red[0] : theme.colors.gray[0]}
          >
            <Flex gap="sm" align="center" flex={1}>
              Zod schema
              <Badge variant="default" size="lg" tt="none">
                v{ZOD_VERSION}
              </Badge>
              <Button
                rel="noopener noreferrer"
                target="_blank"
                size="compact-xs"
                variant="transparent"
                component="a"
                href="https://zod.dev/"
              >
                Docs
              </Button>
            </Flex>
            <CopyButton value={schema} />
            <Tooltip label="Clear schema" withArrow>
              <ActionIcon
                variant="light"
                aria-label="Clear schema"
                onClick={() => setSchema('')}
              >
                <LuEraser />
              </ActionIcon>
            </Tooltip>
            {schemaError && (
              <Tooltip label={schemaError}>
                <Flex align="center">
                  <FiAlertCircle color="red" size="1.125rem" />
                </Flex>
              </Tooltip>
            )}
          </Flex>

          <Editor
            className={classes.editor}
            onChange={(value) => {
              setSchema(value ?? '')
            }}
            defaultLanguage="typescript"
            options={editorOptions}
            value={schema}
          />
        </div>

        <div className={classes.rightPanel}>
          <div className={classes.valuesStack}>
            {values.map((value, index) => {
              return (
                <Validation
                  key={`val${index}`}
                  schema={evaluatedSchema}
                  value={value}
                  index={index}
                  onAdd={() => {
                    setValues((values) => [...values, ''])
                  }}
                  onRemove={
                    values.length > 1
                      ? () => {
                          setValues((values) => {
                            return values.filter((_, i) => i !== index)
                          })
                        }
                      : undefined
                  }
                  onClear={(clearedIndex) => {
                    setValues((values) => {
                      const newValues = [...values]
                      newValues[clearedIndex] = ''
                      return newValues
                    })
                  }}
                  onChange={(newValue) => {
                    setValues((values) => {
                      const newValues = [...values]
                      newValues[index] = newValue
                      return newValues
                    })
                  }}
                />
              )
            })}
          </div>
        </div>
      </main>
    </Box>
  )
}

export default App
