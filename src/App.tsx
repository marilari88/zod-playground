import {ActionIcon, Box, Button, Flex, Tooltip, useComputedColorScheme} from '@mantine/core'
import {notifications} from '@mantine/notifications'
import Editor, {Monaco, useMonaco} from '@monaco-editor/react'
import {useEffect, useMemo, useState} from 'react'
import {FiAlertCircle, FiLink} from 'react-icons/fi'
import {LuEraser} from 'react-icons/lu'

import classes from './App.module.css'
import {ColorSchemeToggle} from './features/ColorSchemeToggle'
import {CopyButton} from './features/CopyButton'
import {Validation} from './features/ValueEditor/ValueEditor'
import {VersionPicker} from './features/VersionPicker/VersionPicker'
import {Header} from './ui/Header/Header'
import * as zod from './zod'
import {DEFAULT_APP_DATA, EDITOR_OPTIONS} from './constants'
import {initMonaco, setMonacoDeclarationTypes} from './utils/monaco'
import {usePersistAppData} from './hooks/usePersistAppData'
import {
  getAppDataFromSearchParams,
  getAppDataFromLocalStorage,
  getURLwithAppData,
} from './utils/appData'

await initMonaco()

const initialAppData =
  getAppDataFromSearchParams() ?? getAppDataFromLocalStorage() ?? DEFAULT_APP_DATA

const App = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [schema, setSchema] = useState<string>(() => initialAppData.schema)
  const [values, setValues] = useState<Array<string>>(() => initialAppData.values)
  const [version, setVersion] = useState(initialAppData.version)

  const appData = useMemo(
    () => ({
      schema,
      values: values.filter((value) => typeof value === 'string'),
      version,
    }),
    [schema, values, version],
  )

  usePersistAppData(appData)

  const monaco = useMonaco()
  const computedColorScheme = useComputedColorScheme('light')

  const {data: evaluatedSchema, error: schemaError} = zod.validateSchema(schema)

  useEffect(() => {
    if (isLoading || !monaco) return

    async function updateVersion(monaco: Monaco, ver: string) {
      setIsLoading(true)
      await zod.setVersion(ver)
      await setMonacoDeclarationTypes(monaco, ver)
      setIsLoading(false)
    }

    updateVersion(monaco, version)
  }, [version, monaco])

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
      <main className={classes.main}>
        <div className={classes.leftPanel}>
          <Flex className={classes.sectionTitle} align="center" justify="space-between" gap="sm">
            <Flex gap="sm" align="center" flex={1}>
              Zod schema
              <VersionPicker
                value={version}
                onChange={async (ver) => {
                  setVersion(ver)
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
            theme={computedColorScheme == 'light' ? 'vs' : 'vs-dark'}
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
