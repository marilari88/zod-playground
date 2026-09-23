import {ActionIcon, Box, Flex, Loader, Text, Tooltip} from '@mantine/core'
import {useId, useState} from 'react'
import {FiChevronDown, FiChevronUp} from 'react-icons/fi'
import {usePanelRef} from 'react-resizable-panels'
import {ResizablePanel} from '../../ui/Resizable/resizable'
import {CopyButton} from '../CopyButton'
import classes from './InferredType.module.css'
import {useInferredType} from './useInferredType'

const COLLAPSED_HEIGHT = 40

type Props = Parameters<typeof useInferredType>[0] & {defaultCollapsed: boolean}

export const InferredType = ({defaultCollapsed, ...props}: Props) => {
  const {type, message, isPending} = useInferredType(props)
  // Capture the initial size so viewport changes do not override the user's choice.
  const [defaultSize] = useState(() => (defaultCollapsed ? COLLAPSED_HEIGHT : '30%'))
  const [isOpen, setIsOpen] = useState(!defaultCollapsed)
  const panelRef = usePanelRef()
  const titleId = useId()
  const contentId = useId()

  return (
    <ResizablePanel
      panelRef={panelRef}
      defaultSize={defaultSize}
      minSize="80px"
      collapsible
      collapsedSize={COLLAPSED_HEIGHT}
      onResize={({inPixels}) => setIsOpen(inPixels > COLLAPSED_HEIGHT + 1)}
    >
      <section className={classes.panel} aria-labelledby={titleId}>
        <Flex className={classes.title} align="center" justify="space-between" gap="sm">
          <Flex align="center" gap="sm">
            <span id={titleId}>Inferred type</span>
            {isPending && <Loader size={16} aria-label="Inferring type" />}
          </Flex>
          <Flex gap="sm">
            <CopyButton
              value={type && !type.isAbbreviated ? type.text : ''}
              label="Copy inferred type"
            />
            <Tooltip label={isOpen ? 'Hide inferred type' : 'Show inferred type'} withArrow>
              <ActionIcon
                variant="light"
                aria-label={isOpen ? 'Hide inferred type' : 'Show inferred type'}
                aria-expanded={isOpen}
                aria-controls={contentId}
                onClick={() => {
                  if (isOpen) panelRef.current?.collapse()
                  else panelRef.current?.expand()
                }}
              >
                {isOpen ? <FiChevronDown /> : <FiChevronUp />}
              </ActionIcon>
            </Tooltip>
          </Flex>
        </Flex>
        <div id={contentId} className={classes.content} hidden={!isOpen} aria-busy={!!isPending}>
          {type ? (
            <>
              <Box component="pre" className={classes.code}>
                {type.text}
              </Box>
              {type.isAbbreviated && (
                <Text size="xs" c="dimmed">
                  This type is abbreviated. Copying is unavailable for incomplete previews.
                </Text>
              )}
            </>
          ) : (
            <Text size="sm" c="dimmed" className={classes.message}>
              {message}
            </Text>
          )}
        </div>
      </section>
    </ResizablePanel>
  )
}
