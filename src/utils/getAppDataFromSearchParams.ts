import LZString from 'lz-string'

import type {AppData} from '../App'

const getAppDataFromSearchParams = (): AppData | null => {
  const urlParams = new URLSearchParams(window.location.search)
  const compressedAppData = urlParams.get('appdata')

  if (compressedAppData) {
    const decompressedAppData =
      LZString.decompressFromEncodedURIComponent(compressedAppData)
    const appData = JSON.parse(decompressedAppData)

    return appData
  }

  return null
}

export default getAppDataFromSearchParams
