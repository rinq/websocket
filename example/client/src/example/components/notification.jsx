import React from 'react'
import {connect} from 'react-redux'

import Paragraph from 'grommet/components/Paragraph'

import {overpassNotification} from '../../overpass/selectors'

export function ExampleNotification (props) {
  const {notification} = props

  if (!notification) return <Paragraph>(none)</Paragraph>

  console.log(notification)

  const {type, payload} = notification

  return <Paragraph>{type}: {JSON.stringify(payload)}</Paragraph>
}

export default connect(
    function mapStateToProps (state) {
      return {
        notification: overpassNotification(state)
      }
    }
)(ExampleNotification)
