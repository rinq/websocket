import React from 'react'
import {connect} from 'react-redux'

import Connect from 'grommet/components/icons/base/Connect'

import * as actions from '../actions'

const indicator = (props) => {
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

const NetworkIndicator = connect(
    function mapStateToProps (state) {
      return {
        isConnected: state.overpass.a.isConnected,
        isError: state.overpass.a.isError,
        isOnline: state.network.isOnline
      }
    }
)(indicator)

export default NetworkIndicator
