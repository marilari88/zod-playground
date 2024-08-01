import {
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'
import {useMonaco} from '@monaco-editor/react'
import {FiMoon, FiSun} from 'react-icons/fi'

export function ColorSchemeToggle({
  onToggle,
}: {
  onToggle?: (value: 'light' | 'dark') => void
}) {
  const {setColorScheme} = useMantineColorScheme()

  const computedColorScheme = useComputedColorScheme('light')

  const monaco = useMonaco()

  return (
    <ActionIcon
      color="primary"
      variant="light"
      onClick={() => {
        const colorScheme = computedColorScheme === 'light' ? 'dark' : 'light'
        setColorScheme(colorScheme)
        onToggle?.(colorScheme)
        monaco?.editor.setTheme(colorScheme == 'light' ? 'vs' : 'vs-dark')
      }}
      size="lg"
      aria-label="Toggle color scheme"
    >
      {computedColorScheme == 'light' ? <FiSun /> : <FiMoon />}
    </ActionIcon>
  )
}
