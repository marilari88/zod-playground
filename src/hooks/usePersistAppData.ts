import {useEffect, useRef} from 'react'
import {type AppData, persistAppData} from '../utils/appData'

export function usePersistAppData(data: AppData) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const saveData = () => {
      persistAppData(data)
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
      window.removeEventListener('beforeunload', saveData)
    }
  }, [data])
}
