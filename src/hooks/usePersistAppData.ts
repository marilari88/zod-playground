import {useEffect, useRef} from 'react'
import {STORAGE_KEY} from '../constants'
import {AppData} from '../App'

const usePersistAppData = (data: AppData) => {
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }, 1000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data])
}

export default usePersistAppData
