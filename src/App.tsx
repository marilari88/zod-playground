import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Flex,
  Popover,
  Stack,
  Text,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core'
import {useMediaQuery} from '@mantine/hooks'
import {notifications} from '@mantine/notifications'
import Editor, {type Monaco, useMonaco} from '@monaco-editor/react'
import {useEffect, useMemo, useState} from 'react'
import {FiLink, FiPlay, FiZoomIn, FiZoomOut} from 'react-icons/fi'
import {LuEraser} from 'react-icons/lu'
import {FaGithub} from 'react-icons/fa'
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
  shouldAutoValidate,
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
  const [fontSize, setFontSize] = useState(20)
  const [validateAllTrigger, setValidateAllTrigger] = useState(0)

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

  const handleValidateAll = () => {
    setValidateAllTrigger((prev) => prev + 1)
  }

  const handleGlobalZoomIn = () => {
    setFontSize((prev) => Math.min(32, prev + 2))
  }

  const handleGlobalZoomOut = () => {
    setFontSize((prev) => Math.max(8, prev - 2))
  }

  const schemaEditorOptions = useMemo(
    () => ({
      ...EDITOR_OPTIONS,
      fontSize,
    }),
    [fontSize],
  )

  useEffect(() => {
    if (!monaco) return

    setIsLoading(true)
    loadZodVersion({version, isZodMini, monaco}).then(() => {
      setIsLoading(false)
    })
  }, [version, isZodMini, monaco])

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on mount to check URL params
  useEffect(() => {
    if (shouldAutoValidate()) {
      handleValidateAll()
    }
  }, [])

  return (
    <Box className={classes.layout}>
      <Header>
        <Popover position="bottom" withArrow shadow="md">
          <Popover.Target>
            <Button variant="light" rightSection={<FiLink />} color="primary">
              Share
            </Button>
          </Popover.Target>
          <Popover.Dropdown>
            <Stack gap="sm">
              <Text size="sm" fw={500}>
                Share options
              </Text>
              <Checkbox
                label="Auto-validate on load"
                description="Automatically validate all values when someone opens the link"
                defaultChecked={false}
                id="autoValidateCheckbox"
              />
              <Button
                size="sm"
                onClick={() => {
                  const autoValidate = (
                    document.getElementById('autoValidateCheckbox') as HTMLInputElement
                  )?.checked
                  const urlWithAppData = getURLwithAppData(appData, autoValidate)
                  navigator.clipboard.writeText(urlWithAppData)
                  notifications.show({
                    title: 'The link has been copied to the clipboard',
                    message: 'Share it with your friends!',
                    icon: <FiLink />,
                  })
                }}
                leftSection={<FiLink />}
                color="primary"
              >
                Copy Link
              </Button>
            </Stack>
          </Popover.Dropdown>
        </Popover>
        <ColorSchemeToggle />
        <Tooltip withArrow label="View source on GitHub">
          <ActionIcon
            variant="light"
            component="a"
            href="https://github.com/marilari88/zod-playground"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            size="lg"
          >
            <FaGithub size={18} />
          </ActionIcon>
        </Tooltip>
        <Flex ml="auto" gap="sm" align="center">
          <Tooltip label="Zoom out all editors" withArrow>
            <ActionIcon
              variant="light"
              onClick={handleGlobalZoomOut}
              disabled={fontSize <= 8}
              aria-label="Global zoom out"
            >
              <FiZoomOut />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Zoom in all editors" withArrow>
            <ActionIcon
              variant="light"
              onClick={handleGlobalZoomIn}
              disabled={fontSize >= 32}
              aria-label="Global zoom in"
            >
              <FiZoomIn />
            </ActionIcon>
          </Tooltip>
          <Tooltip withArrow label="Validate all values at once">
            <Button
              variant="light"
              onClick={handleValidateAll}
              leftSection={<FiPlay />}
              color="green"
            >
              Validate All
            </Button>
          </Tooltip>
        </Flex>
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
            </Flex>

            <Editor
              className={classes.editor}
              onChange={(value) => {
                setSchema(value ?? '')
              }}
              defaultLanguage="typescript"
              options={schemaEditorOptions}
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
                    schemaCode={schema}
                    value={value}
                    index={index}
                    validateTrigger={validateAllTrigger}
                    fontSize={fontSize}
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
