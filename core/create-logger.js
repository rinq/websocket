module.exports = function createLogger (console) {
  return function log (primary, secondary) {
    if (!secondary) {
      console.log(...primary)

      return
    }

    if (console.groupCollapsed) {
      console.groupCollapsed(...primary)
    } else {
      console.group(...primary)
    }

    for (const args of secondary) {
      console.log(...args)
    }

    console.groupEnd()
  }
}
