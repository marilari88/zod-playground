import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Tooltip,
  useMantineTheme,
} from '@mantine/core'
import {notifications} from '@mantine/notifications'
import Editor, {Monaco, loader} from '@monaco-editor/react'
import LZString from 'lz-string'
import {editor} from 'monaco-editor'
import {useState} from 'react'
import {FiAlertCircle, FiLink} from 'react-icons/fi'
import {LuEraser} from 'react-icons/lu'

import classes from './App.module.css'
import {CopyButton} from './features/CopyButton'
import {Validation} from './features/ValueEditor/ValueEditor'
import {VersionPicker} from './features/VersionPicker/VersionPicker'
import {Header} from './ui/Header/Header'
import * as zod from './zod'

type AppData = {
  schema: string
  values: string[]
  version: string
}

const ZOD_DEFAULT_VERSION = (await zod.getVersions('latest'))[0]

await zod.setVersion(ZOD_DEFAULT_VERSION)

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

let monaco: Monaco

loader.init().then(async (_monaco) => {
  _monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  })
  monaco = _monaco
  await setMonacoDeclarationTypes(ZOD_DEFAULT_VERSION)
})

const getAppDataFromSearchParams = (): AppData => {
  const urlParams = new URLSearchParams(window.location.search)
  const compressedAppData = urlParams.get('appdata')

  if (!compressedAppData)
    return {
      schema: '',
      values: [],
      version: ZOD_DEFAULT_VERSION,
    }

  const decompressedAppData =
    LZString.decompressFromEncodedURIComponent(compressedAppData)
  const appData = JSON.parse(decompressedAppData)

  return appData
}

const getURLwithAppData = (appData: AppData): string => {
  const queryParams = new URLSearchParams()
  const compressedAppData = LZString.compressToEncodedURIComponent(
    JSON.stringify(appData),
  )
  queryParams.set('appdata', compressedAppData)

  return `${window.location.protocol}//${window.location.host}?${queryParams}`
}

const sampleZodSchema = `z.object({
  name: z.string(),
  birth_year: z.number().optional()
})`

const sampleValue = '{name: "John"}'

const appData = getAppDataFromSearchParams()

const setMonacoDeclarationTypes = async (ver: string) => {
  const declarationTypes = await zod.getDeclarationTypes(ver)
  
  monaco.languages.typescript.typescriptDefaults.setExtraLibs([
    {
      content: `declare namespace z{${declarationTypes}}`,
    },
  ])
}

const App = () => {
  const [schema, setSchema] = useState<string>(() => {
    return appData.schema || sampleZodSchema
  })

  const [values, setValues] = useState<Array<string>>(() => {
    return appData.values.length ? appData.values : [sampleValue]
  })

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [version, setVersion] = useState(appData.version || ZOD_DEFAULT_VERSION)

  const {data: evaluatedSchema, error: schemaError} = zod.validateSchema(schema)

  const theme = useMantineTheme()

  const changeVersion = async (ver: string) => {
    await zod.setVersion(ver)
    await setMonacoDeclarationTypes(ver)
    setVersion(ver)
  }

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
                values: values.filter((value) => typeof value == 'string'),
                version,
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
              <VersionPicker
                value={version}
                onChange={async (ver) => {
                  setIsLoading(true)
                  await changeVersion(ver)
                  setIsLoading(false)
                }}
                disabled={isLoading}
              />
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
