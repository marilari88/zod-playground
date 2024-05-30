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
} from '@mantine/core'
import Editor from '@monaco-editor/react'
import {editor} from 'monaco-editor'

import {useDisclosure} from '@mantine/hooks'
import {
  FiAlertCircle,
  FiCheckCircle,
  FiColumns,
  FiMinus,
  FiPlus,
} from 'react-icons/fi'
import {LuEraser} from 'react-icons/lu'
import {ValidationResult} from '../../types'
import {CopyButton} from '../CopyButton'
import classes from './ValueEditor.module.css'

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: {enabled: false},
  theme: 'vs',
  scrollBeyondLastLine: false,
  showUnused: false,
  inlayHints: {enabled: 'off'},
  scrollbar: {
    // Subtle shadows to the left & top. Defaults to true.
    useShadows: false,
    vertical: 'auto',
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
    alwaysConsumeMouseWheel: false,
  },
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  renderLineHighlight: 'none',
}

interface Props {
  validationResult: ValidationResult
  value: string
  index: number
  onAdd: () => void
  onRemove?: () => void
  onChange?: (value: string) => void
  onClear: (clearedIndex: number) => void
}

export const Validation = ({
  validationResult,
  value,
  index,
  onChange,
  onAdd,
  onRemove,
  onClear,
}: Props) => {
  const [opened, {close, open}] = useDisclosure(false)
  const [openedResult, {toggle: toggleResult}] = useDisclosure(false)

  const parsedData =
    validationResult.success && JSON.stringify(validationResult.data)

  const errors =
    !validationResult.success && JSON.stringify(validationResult.error)

  return (
    <Box className={classes.valueContainer}>
      <Flex
        align="center"
        className={classes.valueTitle}
        gap="sm"
        justify="space-between"
      >
        <Flex gap="sm" align="center">
          Value #{index + 1}
          {validationResult.success && (
            <Popover opened={opened}>
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
          {!validationResult.success && (
            <Popover opened={opened} withArrow>
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
                    <Code>{errors}</Code>
                  </Stack>
                </Stack>
              </Popover.Dropdown>
            </Popover>
          )}
        </Flex>
        <Flex gap="sm">
          <CopyButton value={value || ''} />
          <Tooltip label="Clear value" withArrow>
            <ActionIcon
              variant="light"
              aria-label="Clear value"
              onClick={() => onClear(index)}
            >
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
              disabled={onRemove == undefined}
              aria-label="Remove value"
              onClick={() => onRemove?.()}
            >
              <FiMinus />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Toggle results column" withArrow>
            <ActionIcon
              variant="light"
              aria-label="Toggle results column"
              onClick={toggleResult}
            >
              <FiColumns />
            </ActionIcon>
          </Tooltip>
        </Flex>
      </Flex>
      <div className={classes.valueEditorContainer}>
        <div className={classes.valueEditor}>
          <Editor
            onChange={(value) => {
              onChange?.(value ?? '')
            }}
            defaultLanguage="typescript"
            options={editorOptions}
            value={value}
          />
        </div>
        <div
          style={{display: openedResult ? 'block' : 'none'}}
          className={classes.valueResult}
          data-open={openedResult}
        >
          {parsedData && <Code>{parsedData}</Code>}
          {errors && (
            <Text c="red" size="sm">
              {errors}
            </Text>
          )}
        </div>
      </div>
    </Box>
  )
}
