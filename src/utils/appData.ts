import LZString from 'lz-string'

import {DEFAULT_APP_DATA, STORAGE_KEY} from '../constants'

export type AppData = {
  schema: string
  values: string[]
  version: string
  isZodMini: boolean
} | null

function parseAppData(appData: string): AppData {
  const parsed = JSON.parse(appData)

  // backward compatibility
  if (!parsed.version) parsed.version = DEFAULT_APP_DATA.version
  if (!parsed.isZodMini) parsed.isZodMini = false

  return parsed
}

export function getAppDataFromLocalStorage(): AppData {
  const appData = localStorage.getItem(STORAGE_KEY)
  return appData ? parseAppData(appData) : null
}

export function getAppDataFromSearchParams(): AppData {
  const urlParams = new URLSearchParams(window.location.search)
  const compressedAppData = urlParams.get('appdata')

  if (compressedAppData) {
    const appData = LZString.decompressFromEncodedURIComponent(compressedAppData)
    return parseAppData(appData)
  }

  return null
}

export function getURLwithAppData(appData: AppData): string {
  const queryParams = new URLSearchParams()
  const compressedAppData = LZString.compressToEncodedURIComponent(JSON.stringify(appData))

  queryParams.set('appdata', compressedAppData)

  return `${window.location.protocol}//${window.location.host}?${queryParams}`
}
