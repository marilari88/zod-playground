import LZString from 'lz-string'

import {STORAGE_KEY} from '../constants'

export type AppData = {
  schema: string
  values: string[]
  version: string
} | null

export function getAppDataFromLocalStorage(): AppData {
  const persisted = localStorage.getItem(STORAGE_KEY)
  return persisted ? JSON.parse(persisted) : null
}

export function getAppDataFromSearchParams(): AppData {
  const urlParams = new URLSearchParams(window.location.search)
  const compressedAppData = urlParams.get('appdata')

  if (compressedAppData) {
    const appData = LZString.decompressFromEncodedURIComponent(compressedAppData)
    return JSON.parse(appData)
  }

  return null
}

export function getURLwithAppData(appData: AppData): string {
  const queryParams = new URLSearchParams()
  const compressedAppData = LZString.compressToEncodedURIComponent(JSON.stringify(appData))

  queryParams.set('appdata', compressedAppData)

  return `${window.location.protocol}//${window.location.host}?${queryParams}`
}
