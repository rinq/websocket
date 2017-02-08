import React from 'react'
import {connect} from 'react-redux'

import Connect from 'grommet/components/icons/base/Connect'

import {isNetworkOnline} from '../selectors'
import {isOverpassConnected, isOverpassError} from '../../overpass/selectors'

export function NetworkIndicator (props) {
  const {isConnected, isError, isOnline} = props
  let colorIndex

  if (!isOnline) {
    colorIndex = 'warning'
  } else if (isError) {
    colorIndex = 'critical'
  } else if (!isConnected) {
    colorIndex = 'unknown'
  } else {
    colorIndex = 'ok'
  }

  return <Connect colorIndex={colorIndex} />
}

export default connect(
    function mapStateToProps (state) {
      return {
        isConnected: isOverpassConnected(state),
        isError: isOverpassError(state),
        isOnline: isNetworkOnline(state)
      }
    }
)(NetworkIndicator)
