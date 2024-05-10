import {
  ActionIcon,
  Badge,
  Box,
  Flex,
  Tooltip,
  useMantineTheme,
  Button,
} from '@mantine/core'
import Editor, {loader} from '@monaco-editor/react'
import {editor} from 'monaco-editor'
import {useEffect, useRef, useState} from 'react'
import {FiAlertCircle} from 'react-icons/fi'
import {LuEraser} from 'react-icons/lu'
import {ZodSchema, z} from 'zod'
import {generateErrorMessage} from 'zod-error'

import zodTypes from '../node_modules/zod/lib/types.d.ts?raw'
import {dependencies} from '../package.json'
import classes from './App.module.css'
import {ValueEditor} from './features/ValueEditor/ValueEditor'
import {CopyButton} from './features/CopyButton'
import {Value} from './models/value'
import {Validation} from './models/validation'
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

function getStateFromSearchParams() {
  const urlParams = new URLSearchParams(window.location.search)
  const defaultSchema = urlParams.get('schema')
  const defaultValues = urlParams.getAll('value').map((v) => v)
  return {defaultValues, defaultSchema}
}

function saveStateToSearchParams(schemaText: string, values: string[]) {
  const queryParams = new URLSearchParams()
  queryParams.set('schema', schemaText)
  values.forEach((v) => {
    queryParams.append('value', v)
  })
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}?${queryParams.toString()}`,
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

const dataSchema = z.object({
  schema: schemaSchema,
  values: z.array(z.string()),
})

const sampleZodSchema = `z.object({
  name: z.string(),
  birth_year: z.number().optional()
})`

const sampleValue = '{name: "John"}'

function App() {
  const {defaultValues, defaultSchema} = getStateFromSearchParams()

  const [validations, setValidations] = useState<Validation[]>(() => {
    return defaultValues.length
      ? defaultValues.map((v) => ({
          value: v,
        }))
      : [{value: sampleValue}]
  })
  const [schemaString, setSchemaString] = useState<string>(
    defaultSchema ?? sampleZodSchema,
  )
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const theme = useMantineTheme()

  useEffect(() => {
    if (schemaString == '') return
    formRef.current?.requestSubmit()
  }, [schemaString])

  return (
    <Box className={classes.layout}>
      <Header />
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

            const {values, schema} = dataSchema.parse(data)

            saveStateToSearchParams(schemaString, values)
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
                schema,
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
            <CopyButton value={schemaText} />
            <Tooltip label="Clear schema" withArrow>
              <ActionIcon
                variant="light"
                aria-label="Clear schema"
                onClick={() => setSchemaText('')}
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
              setSchemaString(value ?? '')
            }}
            defaultLanguage="typescript"
            options={editorOptions}
            value={schemaString}
          />
          <input type="hidden" name="schema" value={schemaString} />
        </div>

        <div className={classes.rightPanel}>
          <div className={classes.valuesStack}>
            {validations.map((value, index) => {
              return (
                <ValueEditor
                  key={`val${index}`}
                  validation={value}
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
                    setValues((values) => {
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
