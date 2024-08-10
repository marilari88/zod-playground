import {Badge, Combobox, Loader, useCombobox} from '@mantine/core'
import {useEffect, useState} from 'react'
import {FiChevronDown} from 'react-icons/fi'
import * as zod from '../../zod'

export function VersionPicker({
  value,
  onChange,
  disabled,
}: {
  value: string
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

  const [loading, setLoading] = useState(false)
  const [versions, setVersions] = useState<string[] | null>(null)
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    setLoading(true)

    zod
      .getVersions()
      .then((versions) => {
        setVersions(versions)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const filteredVersions = versions?.filter((el) => el.includes(searchValue)) || []

  const options = filteredVersions.map((item) => (
    <Combobox.Option value={item} key={item}>
      {item}
    </Combobox.Option>
  ))

  return (
    <Combobox
      width={300}
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
          rightSection={loading ? <Loader size={18} /> : <FiChevronDown size={18} />}
          disabled={disabled}
          style={{opacity: disabled ? 0.5 : 1}}
        >
          v{value}
        </Badge>
      </Combobox.Target>

      <Combobox.Dropdown hidden={versions === null}>
        <Combobox.Search
          placeholder="Search a version"
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.currentTarget.value)
            combobox.resetSelectedOption()
          }}
        />
        <Combobox.Options mah={400} style={{overflowY: 'auto'}}>
          {options}
          {versions?.length === 0 && <Combobox.Empty>No results found</Combobox.Empty>}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
