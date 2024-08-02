import {AppData} from '../App'
import {STORAGE_KEY} from '../constants'

export const getAppDataFromLocalStorage = () => {
  const persisted = localStorage.getItem(STORAGE_KEY)

  return persisted ? (JSON.parse(persisted) as AppData) : null
}
