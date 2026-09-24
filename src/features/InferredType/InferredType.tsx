import {ActionIcon, Box, Flex, SegmentedControl, Text, Tooltip} from '@mantine/core'
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
  const {types, message} = useInferredType(props)
  const [typeView, setTypeView] = useState<'input' | 'output'>('output')
  const type = types?.[typeView]
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
          <span id={titleId} className={classes.heading}>
            Inferred type
          </span>
          <Flex gap="xs" align="center" className={classes.controls}>
            <SegmentedControl<'input' | 'output'>
              aria-label="Inferred type view"
              size="xs"
              value={typeView}
              onChange={setTypeView}
              data={[
                {value: 'input', label: 'Input'},
                {value: 'output', label: 'Output'},
              ]}
            />
            <CopyButton
              value={type && !type.isAbbreviated ? type.text : ''}
              label={`Copy ${typeView} type`}
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
        <div id={contentId} className={classes.content} hidden={!isOpen}>
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
            message && (
              <Text size="sm" c="dimmed" className={classes.message}>
                {message}
              </Text>
            )
          )}
        </div>
      </section>
    </ResizablePanel>
  )
}
