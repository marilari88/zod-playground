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

  return (
    <ActionIcon
      color="primary"
      variant="light"
      onClick={() => {
        const colorScheme = computedColorScheme === 'light' ? 'dark' : 'light'
        setColorScheme(colorScheme)
        onToggle?.(colorScheme)
      }}
      size="lg"
      aria-label="Toggle color scheme"
    >
      {computedColorScheme == 'light' ? <FiSun /> : <FiMoon />}
    </ActionIcon>
  )
}
