import {useEffect, useRef} from 'react'
import {STORAGE_KEY} from '../constants'
import type {AppData} from '../utils/appData'

export function usePersistAppData(data: AppData) {
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const saveData = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }

    timeoutRef.current = setTimeout(() => {
      saveData()
    }, 1000)

    // This saves the data if the user close the tab within the 1 second timeframe
    window.addEventListener('beforeunload', saveData)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data])
}
