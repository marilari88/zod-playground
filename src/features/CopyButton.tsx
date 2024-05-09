import {CopyButton as _CopyButton, Tooltip, ActionIcon} from "@mantine/core"
import {FiCheck, FiCopy} from "react-icons/fi"

export const CopyButton = (
    {value} : {value: string}
  ) => {
    return (
      <_CopyButton value={value} timeout={1000}>
        {({copied, copy}) => (
          <Tooltip
            label={copied ? 'Copied' : 'Copy schema'}
            withArrow
            position="top"
          >
            <ActionIcon disabled={!value} variant="light" onClick={copy}>
              {copied ? <FiCheck /> : <FiCopy />}
            </ActionIcon>
          </Tooltip>
        )}
      </_CopyButton>
    )
  }