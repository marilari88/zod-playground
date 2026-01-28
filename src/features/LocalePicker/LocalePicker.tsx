import {Badge, Combobox, useCombobox} from '@mantine/core'
import {useState} from 'react'
import {FiChevronDown} from 'react-icons/fi'

export function LocalePicker({
  value,
  locales,
  onChange,
  disabled,
}: {
  value: string
  locales: string[]
  onChange: (value: string) => void
  disabled: boolean
}) {
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption()
      combobox.focusTarget()
      setSearchValue('')
    },

    onDropdownOpen: () => {
      combobox.focusSearchInput()
    },
  })

  const [searchValue, setSearchValue] = useState('')

  const filteredLocales = locales.filter((locale) =>
    locale.toLowerCase().includes(searchValue.toLowerCase()),
  )

  const options = filteredLocales.map((locale) => (
    <Combobox.Option value={locale} key={locale}>
      {locale}
    </Combobox.Option>
  ))

  return (
    <Combobox
      width="fit-content"
      onOptionSubmit={(optionValue) => {
        onChange(optionValue)
        setSearchValue(optionValue)
        combobox.closeDropdown()
      }}
      withinPortal={false}
      store={combobox}
      position="bottom-start"
      withArrow
    >
      <Combobox.Target>
        <Badge
          variant="default"
          size="lg"
          tt="none"
          onClick={() => combobox.toggleDropdown()}
          component="button"
          rightSection={<FiChevronDown size={18} />}
          disabled={disabled}
          style={{opacity: disabled ? 0.5 : 1}}
        >
          {value}
        </Badge>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Search
          placeholder="Search a locale"
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.currentTarget.value)
            combobox.resetSelectedOption()
          }}
        />
        <Combobox.Options mah={400} style={{overflowY: 'auto'}}>
          {options}
          {filteredLocales.length === 0 && <Combobox.Empty>No results found</Combobox.Empty>}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
