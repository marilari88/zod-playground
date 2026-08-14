import LZString from 'lz-string'

import {DEFAULT_APP_DATA, STORAGE_KEY} from '../constants'

export type AppData = {
  schema: string
  values: string[]
  version: string
  isZodMini: boolean
}

function parseAppData(appData: string): AppData {
  const parsed = JSON.parse(appData)

  // backward compatibility
  if (!parsed.version) parsed.version = DEFAULT_APP_DATA.version
  if (!parsed.isZodMini) parsed.isZodMini = false

  return parsed
}

export function getAppDataFromLocalStorage(): AppData | null {
  const appData = localStorage.getItem(STORAGE_KEY)
  return appData ? parseAppData(appData) : null
}

export function getAppDataFromSearchParams(): AppData | null {
  const urlParams = new URLSearchParams(window.location.search)
  const compressedAppData = urlParams.get('appdata')

  if (compressedAppData) {
    const appData = LZString.decompressFromEncodedURIComponent(compressedAppData)
    return parseAppData(appData)
  }

  return null
}

export function getURLwithAppData(
  appData: AppData,
  baseUrl = `${window.location.protocol}//${window.location.host}`,
): string {
  const url = new URL(baseUrl)
  const compressedAppData = LZString.compressToEncodedURIComponent(JSON.stringify(appData))

  url.searchParams.set('appdata', compressedAppData)

  return url.toString()
}

export function getURLwithoutAppData(): string {
  const url = new URL(window.location.href)
  url.searchParams.delete('appdata')
  return url.toString()
}

export function persistAppData(appData: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData))
}
