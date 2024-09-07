import {
  ActionIcon,
  Badge,
  Box,
  Code,
  Flex,
  Popover,
  Stack,
  Text,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core'
import Editor from '@monaco-editor/react'
import type {editor} from 'monaco-editor'

import {useDisclosure, useMediaQuery} from '@mantine/hooks'
import {useState} from 'react'
import {FiAlertCircle, FiCheckCircle, FiEye, FiEyeOff, FiMinus, FiPlus} from 'react-icons/fi'
import {LuEraser} from 'react-icons/lu'
import * as zod from '../../zod'
import {CopyButton} from '../CopyButton'
import classes from './ValueEditor.module.css'

interface Props {
  schema?: zod.ZodSchema
  value: string
  index: number
  onAdd: () => void
  onRemove?: () => void
  onChange?: (value: string) => void
  onClear: (clearedIndex: number) => void
}

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: {enabled: false},
  scrollBeyondLastLine: false,
  showUnused: false,
  inlayHints: {enabled: 'off'},
  scrollbar: {
    useShadows: false,
    vertical: 'auto',
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
    alwaysConsumeMouseWheel: false,
  },
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  automaticLayout: true,
  renderLineHighlight: 'none',
}

export const Validation = ({schema, value, index, onChange, onAdd, onRemove, onClear}: Props) => {
  const [isPopoverOpen, {close, open}] = useDisclosure(false)

  const matches = useMediaQuery('(min-width: 1200px)')
  const [isResultManuallyOpen, setIsResultManuallyOpen] = useState<boolean | null>(null)
  const isResultOpen = isResultManuallyOpen ?? !!matches

  const validation = schema
    ? zod.validateValue(schema, value)
    : {success: false as const, error: 'Invalid schema'}
  const parsedData = validation.success && JSON.stringify(validation.data)

  const errors = !validation.success && validation.error

  const computedColorScheme = useComputedColorScheme('light')

  return (
    <Box className={classes.valueContainer}>
      <Flex align="center" className={classes.valueTitle} gap="sm" justify="space-between">
        <Flex gap="sm" align="center">
          Value #{index + 1}
          {validation.success && (
            <Popover opened={isPopoverOpen}>
              <Popover.Target>
                <Badge
                  variant="dot"
                  onMouseEnter={open}
                  onMouseLeave={close}
                  style={{cursor: 'default'}}
                >
                  Valid
                </Badge>
              </Popover.Target>
              <Popover.Dropdown>
                <Stack>
                  <Flex align="center" gap="xs">
                    <Flex c="green" align="center">
                      <FiCheckCircle />
                    </Flex>
                    <Text fw={500}>Success</Text>
                  </Flex>
                  <Stack gap="xs">
                    <Text>Parsed data:</Text>
                    <Code>{parsedData}</Code>
                  </Stack>
                </Stack>
              </Popover.Dropdown>
            </Popover>
          )}
          {!validation.success && (
            <Popover opened={isPopoverOpen} withArrow>
              <Popover.Target>
                <Badge
                  variant="dot"
                  color="red"
                  onMouseEnter={open}
                  onMouseLeave={close}
                  style={{cursor: 'default'}}
                >
                  Invalid
                </Badge>
              </Popover.Target>
              <Popover.Dropdown>
                <Stack>
                  <Flex align="center" gap="xs">
                    <Flex c="red" align="center">
                      <FiAlertCircle />
                    </Flex>
                    <Text fw={500}>Error</Text>
                  </Flex>
                  <Stack gap="xs">
                    <Text>Error list:</Text>
                    <Code block>{errors}</Code>
                  </Stack>
                </Stack>
              </Popover.Dropdown>
            </Popover>
          )}
        </Flex>
        <Flex gap="sm">
          <CopyButton value={value || ''} />
          <Tooltip label="Clear value" withArrow>
            <ActionIcon variant="light" aria-label="Clear value" onClick={() => onClear(index)}>
              <LuEraser />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Add value" withArrow>
            <ActionIcon variant="light" aria-label="Add value" onClick={onAdd}>
              <FiPlus />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Remove value" withArrow>
            <ActionIcon
              variant="light"
              disabled={onRemove === undefined}
              aria-label="Remove value"
              onClick={() => onRemove?.()}
            >
              <FiMinus />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={isResultOpen ? 'Hide results' : 'Show results'} withArrow>
            <ActionIcon
              variant="light"
              aria-label={isResultOpen ? 'Hide results' : 'Show results'}
              onClick={() => {
                isResultOpen ? setIsResultManuallyOpen(false) : setIsResultManuallyOpen(true)
              }}
            >
              {!isResultOpen ? <FiEye /> : <FiEyeOff />}
            </ActionIcon>
          </Tooltip>
        </Flex>
      </Flex>
      <div className={classes.valueEditorContainer}>
        <div className={classes.valueEditor}>
          <Editor
            theme={computedColorScheme === 'light' ? 'vs' : 'vs-dark'}
            onChange={(value) => {
              onChange?.(value ?? '')
            }}
            defaultLanguage="typescript"
            options={editorOptions}
            value={value}
          />
        </div>
        <Box
          style={{
            display: isResultOpen ? 'block' : 'none',
          }}
          className={classes.valueResult}
          data-open={isResultOpen}
          c={errors ? 'red' : 'neutral.8'}
        >
          {parsedData && JSON.stringify(JSON.parse(parsedData), null, 4)}
          {errors && errors}
        </Box>
      </div>
    </Box>
  )
}
