import {AppData} from '../App'
import LZString from 'lz-string'

const getURLwithAppData = (appData: AppData): string => {
  const queryParams = new URLSearchParams()
  const compressedAppData = LZString.compressToEncodedURIComponent(
    JSON.stringify(appData),
  )
  queryParams.set('appdata', compressedAppData)

  return `${window.location.protocol}//${window.location.host}?${queryParams}`
}

export default getURLwithAppData
