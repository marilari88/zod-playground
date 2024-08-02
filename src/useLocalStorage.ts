import {useEffect, useState} from 'react'
import {getAppDataFromLocalStorage} from './utils/getAppDataFromLocalStorage'
import {STORAGE_KEY} from './constants'

export const useLocalStorage = () => {
  const [value, setValue] = useState(() => getAppDataFromLocalStorage)

  // todo throttle

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  }, [value])

  return [value, setValue]
}
