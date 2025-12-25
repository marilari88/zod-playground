import {ActionIcon, Box, Button, Flex, Tooltip, useComputedColorScheme} from '@mantine/core'
import {useMediaQuery} from '@mantine/hooks'
import {notifications} from '@mantine/notifications'
import Editor, {type Monaco, useMonaco} from '@monaco-editor/react'
import {useEffect, useMemo, useState} from 'react'
import {FiAlertCircle, FiLink} from 'react-icons/fi'
import {LuEraser} from 'react-icons/lu'
import classes from './App.module.css'
import {DEFAULT_APP_DATA, EDITOR_OPTIONS} from './constants'
import {ColorSchemeToggle} from './features/ColorSchemeToggle'
import {CopyButton} from './features/CopyButton'
import {Validation} from './features/ValueEditor/ValueEditor'
import {VersionPicker} from './features/VersionPicker/VersionPicker'
import {usePersistAppData} from './hooks/usePersistAppData'
import {Header} from './ui/Header/Header'
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from './ui/Resizable/resizable'
import {
  getAppDataFromLocalStorage,
  getAppDataFromSearchParams,
  getURLwithAppData,
} from './utils/appData'
import {
  initMonaco,
  resetMonacoDeclarationTypes,
  setMonacoDeclarationTypes,
  setMonacoGlobalDeclarationTypes,
} from './utils/monaco'
import {getVersionDtsContents} from './versionMetadata'
import * as zod from './zod'

await initMonaco()

const loadZodVersion = async ({
  version,
  isZodMini,
  monaco,
}: {
  version: string
  isZodMini: boolean
  monaco: Monaco
}) => {
  try {
    await zod.loadVersion({version, isZodMini})
    const zodDtsFiles = await getVersionDtsContents({packageName: zod.PACKAGE_NAME, version})

    if (zodDtsFiles) {
      resetMonacoDeclarationTypes(monaco)
      setMonacoDeclarationTypes({monaco, dtsFiles: zodDtsFiles, packageName: zod.PACKAGE_NAME})
      setMonacoGlobalDeclarationTypes({
        monaco,
        packageName: zod.PACKAGE_NAME,
        path: isZodMini ? '/mini' : undefined,
      })
    }
  } catch (error) {
    console.error('Failed to load type definitions:', error)
    // Consider adding user-facing error notification here
  }
}

const initialAppData =
  getAppDataFromSearchParams() ?? getAppDataFromLocalStorage() ?? DEFAULT_APP_DATA

const App = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [schema, setSchema] = useState<string>(() => initialAppData.schema)
  const [values, setValues] = useState<Array<string>>(() => initialAppData.values)
  const [version, setVersion] = useState(initialAppData.version)
  const [isZodMini, setIsZodMini] = useState(initialAppData.isZodMini)

  const appData = useMemo(
    () => ({
      schema,
      values: values.filter((value) => typeof value === 'string'),
      version,
      isZodMini,
    }),
    [schema, values, version, isZodMini],
  )

  usePersistAppData(appData)

  const monaco = useMonaco()
  const computedColorScheme = useComputedColorScheme('light')

  const isMobile = useMediaQuery('(max-width: 768px)')

  const schemaValidation = zod.validateSchema(schema)
  const evaluatedSchema = schemaValidation.success ? schemaValidation.data : undefined
  const schemaError = !schemaValidation.success ? schemaValidation.error : undefined

  useEffect(() => {
    if (!monaco) return

    setIsLoading(true)
    loadZodVersion({version, isZodMini, monaco}).then(() => {
      setIsLoading(false)
    })
  }, [version, isZodMini, monaco])

  return (
    <Box className={classes.layout}>
      <Header>
        <Tooltip withArrow label="Create a link to share the current schema and values">
          <Button
            variant="light"
            onClick={() => {
              const urlWithAppData = getURLwithAppData(appData)
              navigator.clipboard.writeText(urlWithAppData)
              notifications.show({
                title: 'The link has been copied to the clipboard',
                message: 'Share it with your friends!',
                icon: <FiLink />,
              })
            }}
            rightSection={<FiLink />}
            color="primary"
          >
            Share
          </Button>
        </Tooltip>
        <ColorSchemeToggle />
      </Header>
      <main style={{maxWidth: '100vw'}}>
        <ResizablePanelGroup
          orientation={isMobile ? 'vertical' : 'horizontal'}
          className={classes.main}
        >
          <ResizablePanel className={classes.leftPanel} defaultSize={50} minSize={28}>
            <Flex className={classes.sectionTitle} align="center" justify="space-between" gap="sm">
              <Flex gap="sm" align="center" flex={1}>
                Schema
                <VersionPicker
                  value={{isZodMini, version}}
                  onChange={async (ver) => {
                    setVersion(ver.version)
                    setIsZodMini(ver.isZodMini)
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
                <ActionIcon variant="light" aria-label="Clear schema" onClick={() => setSchema('')}>
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
              options={EDITOR_OPTIONS}
              theme={computedColorScheme === 'light' ? 'vs' : 'vs-dark'}
              value={schema}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel className={classes.rightPanel} defaultSize={50} minSize={30}>
            <div className={classes.valuesStack}>
              {values.map((value, index) => {
                return (
                  <Validation
                    // biome-ignore lint/suspicious/noArrayIndexKey: items order does not change
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
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </Box>
  )
}

export default App
