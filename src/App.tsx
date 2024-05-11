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
import {useEffect, useRef, useState} from 'react'
import {FiAlertCircle, FiLink} from 'react-icons/fi'
import {LuEraser} from 'react-icons/lu'
import {ZodSchema, z} from 'zod'
import {generateErrorMessage} from 'zod-error'

import zodTypes from '../node_modules/zod/lib/types.d.ts?raw'
import {dependencies} from '../package.json'
import classes from './App.module.css'
import {CopyButton} from './features/CopyButton'
import {ValueEditor} from './features/ValueEditor/ValueEditor'
import {AppData, Validation, appDataSchema} from './types'
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
  const encAppData = urlParams.get('appData')
  if (!encAppData)
    return {
      schema: '',
      values: [],
    }

  return appDataSchema.parse(
    JSON.parse(LZString.decompressFromEncodedURIComponent(encAppData)),
  )
}

const storeAppDataInSearchParams = (appData: AppData) => {
  const queryParams = new URLSearchParams()
  const encAppData = LZString.compressToEncodedURIComponent(
    JSON.stringify(appData),
  )
  queryParams.set('appData', encAppData)

  window.history.replaceState(
    {},
    '',
    `${window.location.pathname}?${queryParams}`,
  )
}

const evaluateExpression = (expression: string) => {
  try {
    const evaluatedExpression = new Function(`return ${expression}`)()
    return {success: true, data: evaluatedExpression} as const
  } catch (e) {
    return {
      success: false,
      error:
        e instanceof SyntaxError
          ? 'Invalid syntax'
          : e instanceof ReferenceError
            ? 'Invalid reference'
            : 'Invalid value',
    } as const
  }
}

const validateData = (schema: ZodSchema, data: unknown) => {
  const validationRes = schema.safeParse(data)
  return validationRes.success
    ? ({success: true, data: validationRes.data} as const)
    : ({
        success: false,
        error: generateErrorMessage(validationRes.error.issues),
      } as const)
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
        path: ['schema'],
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

const App = () => {
  const [validations, setValidations] = useState<Validation[]>(() => {
    const {values} = getAppDataFromSearchParams()
    return values.length
      ? values.map((v) => ({
          value: v,
        }))
      : [{value: sampleValue}]
  })
  const [schema, setSchema] = useState<string>(() => {
    const {schema} = getAppDataFromSearchParams()
    return schema || sampleZodSchema
  })

  const [schemaError, setSchemaError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const theme = useMantineTheme()

  useEffect(() => {
    if (schema == '') return
    formRef.current?.requestSubmit()
  }, [schema])

  return (
    <Box className={classes.layout}>
      <Header>
        <Tooltip label="Copy the current schema and values to the clipboard">
          <Button
            variant="light"
            onClick={() => {
              if (!formRef.current) return
              storeAppDataInSearchParams({
                schema,
                values: validations
                  .map(({value}) => value)
                  .filter((value): value is string => typeof value == 'string'),
              })
              navigator.clipboard.writeText(window.location.href)
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
      <form
        className={classes.form}
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault()

          const formData = new FormData(e.currentTarget)

          try {
            const data = {
              schema: formData.get('schema'),
              values: formData.getAll('value'),
            }

            const {values, schema} = appDataSchema.parse(data)
            const evauluatedSchema = schemaSchema.parse(schema)

            setSchemaError(null)

            const validations = values.map((v): Validation => {
              const evaluatedExpression = evaluateExpression(v)
              if (!evaluatedExpression.success) {
                return {
                  value: v,
                  result: evaluatedExpression,
                }
              }

              const validationResult = validateData(
                evauluatedSchema,
                evaluatedExpression.data,
              )
              return {
                value: v,
                result: validationResult,
              } as const
            })
            setValidations(validations)
          } catch (e) {
            if (e instanceof z.ZodError) {
              const schemaIssue = e.issues.find((issue) =>
                issue.path.some((p) => p === 'schema'),
              )
              if (schemaIssue) {
                setSchemaError(schemaIssue.message)
                return
              }
            }
            setSchemaError('Invalid schema')
          }
        }}
      >
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
          <input type="hidden" name="schema" value={schema} />
        </div>

        <div className={classes.rightPanel}>
          <div className={classes.valuesStack}>
            {validations.map((validation, index) => {
              return (
                <ValueEditor
                  key={`val${index}`}
                  validation={validation}
                  index={index}
                  onAdd={() => {
                    setValidations((values) => [...values, {value: ''}])
                  }}
                  onRemove={
                    validations.length > 1
                      ? () => {
                          setValidations((values) => {
                            return values.filter((_, i) => i !== index)
                          })
                        }
                      : undefined
                  }
                  onClear={(clearedIndex) => {
                    setValidations((values) => {
                      const newValues = [...values]
                      newValues[clearedIndex] = {value: ''}
                      return newValues
                    })
                  }}
                  onChange={() => {
                    formRef.current?.requestSubmit()
                  }}
                />
              )
            })}
          </div>
        </div>
      </form>
    </Box>
  )
}

export default App
