import {ActionIcon, Box, Button, Flex, Tooltip, useComputedColorScheme} from '@mantine/core'
import {useMediaQuery} from '@mantine/hooks'
import {notifications} from '@mantine/notifications'
import Editor, {type Monaco, useMonaco} from '@monaco-editor/react'
import {useEffect, useMemo, useRef, useState} from 'react'
import {FiAlertCircle, FiLink} from 'react-icons/fi'
import {LuEraser, LuRefreshCw} from 'react-icons/lu'
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
  type AppData,
  getAppDataFromLocalStorage,
  getAppDataFromSearchParams,
  getURLwithAppData,
  getURLwithoutAppData,
  persistAppData,
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
  isCurrent,
}: {
  version: string
  isZodMini: boolean
  monaco: Monaco
  isCurrent: () => boolean
}) => {
  try {
    const didApplyVersion = await zod.loadVersion({version, isZodMini, shouldApply: isCurrent})
    if (!didApplyVersion) return

    const zodDtsFiles = await getVersionDtsContents({packageName: zod.PACKAGE_NAME, version})

    if (zodDtsFiles && isCurrent()) {
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

const RESET_NOTIFICATION_ID = 'app-data-reset'

const getDefaultAppData = (): AppData => ({
  schema: DEFAULT_APP_DATA.schema,
  values: [...DEFAULT_APP_DATA.values],
  version: DEFAULT_APP_DATA.version,
  isZodMini: DEFAULT_APP_DATA.isZodMini,
})

const isDefaultSchema = (schema: string, isZodMini: boolean) =>
  schema === (isZodMini ? DEFAULT_APP_DATA.zodMiniSchema : DEFAULT_APP_DATA.schema)

const App = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [schema, setSchema] = useState<string>(() => initialAppData.schema)
  const [values, setValues] = useState<Array<string>>(() => initialAppData.values)
  const [version, setVersion] = useState(initialAppData.version)
  const [isZodMini, setIsZodMini] = useState(initialAppData.isZodMini)
  const loadRequestRef = useRef(0)

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

  const applyAppData = (data: AppData) => {
    setSchema(data.schema)
    setValues([...data.values])
    setVersion(data.version)
    setIsZodMini(data.isZodMini)
    persistAppData(data)
  }

  const isAppDataDefault =
    schema === DEFAULT_APP_DATA.schema &&
    values.length === DEFAULT_APP_DATA.values.length &&
    values.every((value, index) => value === DEFAULT_APP_DATA.values[index]) &&
    version === DEFAULT_APP_DATA.version &&
    isZodMini === DEFAULT_APP_DATA.isZodMini

  const resetAppData = () => {
    const previousAppData: AppData = {...appData, values: [...appData.values]}
    const previousUrl = window.location.href
    const previousUrlHadAppData = new URL(previousUrl).searchParams.has('appdata')

    applyAppData(getDefaultAppData())
    window.history.replaceState(window.history.state, '', getURLwithoutAppData())

    notifications.show({
      id: RESET_NOTIFICATION_ID,
      title: 'App data reset',
      message: (
        <Flex align="center" gap="sm">
          <Box>Schema, values, and Zod version were restored to defaults.</Box>
          <Button
            variant="subtle"
            size="compact-xs"
            onClick={() => {
              applyAppData(previousAppData)
              const undoUrl = previousUrlHadAppData
                ? getURLwithAppData(previousAppData, previousUrl)
                : previousUrl
              window.history.replaceState(window.history.state, '', undoUrl)
              notifications.hide(RESET_NOTIFICATION_ID)
            }}
          >
            Undo
          </Button>
        </Flex>
      ),
      icon: <LuRefreshCw />,
      autoClose: 8000,
    })
  }

  const monaco = useMonaco()
  const computedColorScheme = useComputedColorScheme('light')

  const isMobile = useMediaQuery('(max-width: 768px)')

  const schemaValidation = isLoading ? undefined : zod.validateSchema(schema)
  const evaluatedSchema = schemaValidation?.success ? schemaValidation.data : undefined
  const schemaError =
    schemaValidation && !schemaValidation.success ? schemaValidation.error : undefined

  useEffect(() => {
    if (!monaco) return

    const requestId = ++loadRequestRef.current
    const isCurrent = () => requestId === loadRequestRef.current

    setIsLoading(true)
    loadZodVersion({version, isZodMini, monaco, isCurrent}).finally(() => {
      if (isCurrent()) setIsLoading(false)
    })

    return () => {
      if (isCurrent()) loadRequestRef.current++
    }
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
            color="primary"
            px={{base: 9, xs: 'md'}}
            aria-label="Share"
          >
            <Box mr="sm" visibleFrom="xs">
              Share
            </Box>
            <FiLink />
          </Button>
        </Tooltip>
        <ColorSchemeToggle />
        <Tooltip
          withArrow
          label={isAppDataDefault ? 'App data already uses defaults' : 'Reset app data'}
        >
          <span>
            <ActionIcon
              variant="light"
              aria-label="Reset app data"
              size="lg"
              disabled={isLoading || isAppDataDefault}
              onClick={resetAppData}
            >
              <LuRefreshCw />
            </ActionIcon>
          </span>
        </Tooltip>
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
                  onChange={(ver) => {
                    if (ver.version === version && ver.isZodMini === isZodMini) return

                    setIsLoading(true)

                    if (isDefaultSchema(schema, isZodMini)) {
                      setSchema(
                        ver.isZodMini ? DEFAULT_APP_DATA.zodMiniSchema : DEFAULT_APP_DATA.schema,
                      )
                    }

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
                  color="primary"
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
                    isLoading={isLoading}
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
