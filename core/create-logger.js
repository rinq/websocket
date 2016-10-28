module.exports = function createLogger (console) {
  return function log (primary, secondary) {
    if (!secondary) {
      console.log.apply(null, primary)

      return
    }

    if (console.groupCollapsed) {
      console.groupCollapsed.apply(null, primary)
    } else {
      console.group.apply(null, primary)
    }

    for (var i = 0; i < secondary.length; ++i) {
      console.log.apply(null, secondary[i])
    }

    console.groupEnd()
  }
}
