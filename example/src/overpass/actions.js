export const OVERPASS_CONNECT = 'OVERPASS_CONNECT'
export function overpassConnect (name) {
  return {type: OVERPASS_CONNECT, payload: {name}}
}

export const OVERPASS_DISCONNECT = 'OVERPASS_DISCONNECT'
export function overpassDisconnect (name, error) {
  return {type: OVERPASS_DISCONNECT, payload: {name, error}}
}
