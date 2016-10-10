export const OVERPASS_CONNECT = 'OVERPASS_CONNECT'
export function overpassConnect () {
  return {type: OVERPASS_CONNECT}
}

export const OVERPASS_DISCONNECT = 'OVERPASS_DISCONNECT'
export function overpassDisconnect (error) {
  return {type: OVERPASS_DISCONNECT, payload: error}
}
