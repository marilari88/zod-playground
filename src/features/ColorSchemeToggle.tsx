import {ActionIcon, Tooltip, useComputedColorScheme, useMantineColorScheme} from '@mantine/core'
import {FiMoon, FiSun} from 'react-icons/fi'

export function ColorSchemeToggle({onToggle}: {onToggle?: (value: 'light' | 'dark') => void}) {
  const {setColorScheme} = useMantineColorScheme()

  const computedColorScheme = useComputedColorScheme('light')
  const newColorScheme = computedColorScheme === 'light' ? 'dark' : 'light'

  return (
    <Tooltip withArrow label={`Switch to ${newColorScheme} mode`}>
      <ActionIcon
        color="primary"
        variant="light"
        onClick={() => {
          setColorScheme(newColorScheme)
          onToggle?.(newColorScheme)
        }}
        size="lg"
        aria-label="Toggle color scheme"
      >
        {computedColorScheme === 'light' ? <FiMoon /> : <FiSun />}
      </ActionIcon>
    </Tooltip>
  )
}
