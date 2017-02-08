import React, {PropTypes} from 'react'

import Box from 'grommet/components/Box'

export function OverpassNotFound (props) {
  return <Box pad={{between: 'medium'}}>
    Not found.
  </Box>
}

OverpassNotFound.propTypes = {
  heading: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired
}

export default OverpassNotFound
