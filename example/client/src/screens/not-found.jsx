import React, {PropTypes} from 'react'

import OverpassNotFound from '../components/not-found'
import OverpassLayout from '../components/layout'

export function NotFoundScreen (props) {
  let {heading, message} = props

  heading = heading || 'Page not found'
  message = message || 'The requested page could not be found.'

  return <OverpassLayout>
    <OverpassNotFound heading={heading} message={message} />
  </OverpassLayout>
}

NotFoundScreen.propTypes = {
  heading: PropTypes.string,
  message: PropTypes.string
}

export default NotFoundScreen
