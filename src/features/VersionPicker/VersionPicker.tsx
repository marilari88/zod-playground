import {Badge, Combobox, Loader, useCombobox} from '@mantine/core'
import {matchSorter} from 'match-sorter'
import {useEffect, useState} from 'react'
import {FiChevronDown} from 'react-icons/fi'

type Metadata = {
  versions: Array<{version: string}>
  tags: Record<string, string>
}

async function getMetadata() {
  const res = await fetch('https://data.jsdelivr.com/v1/packages/npm/zod')
  const metadata = (await res.json()) as Metadata
  return metadata.versions
    .filter((v) => {
      return !v.version.includes('alpha') && !v.version.includes('canary')
    })
    .map(({version}) => version)
}

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
  const [versionList, setVersionList] = useState<string[] | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const empty = versionList && versionList.length === 0

  useEffect(() => {
    setLoading(true)
    getMetadata()
      .then((result) => {
        setVersionList(result)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const matchedVersions = matchSorter(versionList || [], searchValue, {
    baseSort: (a, b) => (a > b ? -1 : 1),
  })

  const options = (matchedVersions || []).map((item) => (
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
          rightSection={
            loading ? <Loader size={18} /> : <FiChevronDown size={18} />
          }
          disabled={disabled}
          style={{opacity: disabled ? 0.5 : 1}}
        >
          v{value}
        </Badge>
      </Combobox.Target>

      <Combobox.Dropdown hidden={versionList === null}>
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
          {empty && <Combobox.Empty>No results found</Combobox.Empty>}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
