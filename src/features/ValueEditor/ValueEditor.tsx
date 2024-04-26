import {Box} from '@mantine/core'
import Editor from '@monaco-editor/react'
import {editor} from 'monaco-editor'
import {useRef} from 'react'

import {Value} from '../../models/value'
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

    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
}

export const ValueEditor = ({
  value: valueState,
  index,
  onChange,
}: {
  value: Value
  index: number
  onChange?: (value: string) => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <Box className={classes.valueContainer}>
      <Box className={classes.valueTitle}>Value #{index}</Box>
      <div className={classes.valueEditor}>
        <Editor
          onChange={(value) => {
            inputRef.current!.value = value ?? ''
            onChange?.(value ?? '')
          }}
          defaultLanguage="typescript"
          options={editorOptions}
          value={valueState.value}
        />
      </div>
      <input type="hidden" name="value" ref={inputRef} />
      {valueState.validationResult && (
        <div className={classes.valueResult}>
          {valueState.validationResult.success && (
            <div>{JSON.stringify(valueState.validationResult?.data)}</div>
          )}
          {!valueState.validationResult.success && (
            <div>{JSON.stringify(valueState.validationResult?.error)}</div>
          )}
        </div>
      )}
    </Box>
  )
}
