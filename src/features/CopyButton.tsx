import {CopyButton as _CopyButton, ActionIcon, Tooltip} from '@mantine/core'
import {FiCheck, FiCopy} from 'react-icons/fi'

export const CopyButton = ({value, label}: {value: string; label: string}) => {
  return (
    <_CopyButton value={value} timeout={1000}>
      {({copied, copy}) => (
        <Tooltip label={copied ? 'Copied' : label} withArrow position="top">
          <ActionIcon
            disabled={!value}
            variant="light"
            onClick={copy}
            aria-label={copied ? 'Copied' : label}
          >
            {copied ? <FiCheck /> : <FiCopy />}
          </ActionIcon>
        </Tooltip>
      )}
    </_CopyButton>
  )
}
