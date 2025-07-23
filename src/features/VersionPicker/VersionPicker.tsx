import {Badge, Combobox, Loader, SegmentedControl, useCombobox} from '@mantine/core'
import {useEffect, useState} from 'react'
import {FiChevronDown} from 'react-icons/fi'
import * as zod from '../../zod'

const packageVariants = ['zod', 'zod/mini']
type VersionPickerValue = {isZodMini: boolean; version: string}

export function VersionPicker({
  value,
  onChange,
  disabled,
}: {
  value: VersionPickerValue
  onChange: (value: VersionPickerValue) => void
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
  const [versions, setVersions] = useState<Array<{hasZodMini: boolean; version: string}> | null>(
    null,
  )
  const [searchValue, setSearchValue] = useState('')
  const [isZodMini, setIsZodMini] = useState(value.isZodMini)

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

  const filteredVersions =
    versions?.filter((el) => (!isZodMini || el.hasZodMini) && el.version.includes(searchValue)) ||
    []

  const options = filteredVersions.map((item) => (
    <Combobox.Option value={item.version} key={item.version}>
      {item.version}
    </Combobox.Option>
  ))

  return (
    <Combobox
      width={300}
      onOptionSubmit={(optionValue) => {
        onChange({isZodMini, version: optionValue})
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
          {isZodMini ? 'Zod Mini' : 'Zod'} v{value.version}
        </Badge>
      </Combobox.Target>

      <Combobox.Dropdown hidden={versions === null}>
        <Combobox.Header>
          <SegmentedControl
            data={packageVariants}
            fullWidth
            value={isZodMini ? 'zod/mini' : 'zod'}
            onChange={(v) => {
              setIsZodMini(v === 'zod/mini')
            }}
          />
        </Combobox.Header>
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
