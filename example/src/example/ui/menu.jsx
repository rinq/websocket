import React from 'react'
import {connect} from 'react-redux'

import Anchor from 'grommet/components/Anchor'
import Menu from 'grommet/components/Menu'

import * as actions from '../actions'
import {closeNavigation} from '../../ui/actions'

const menu = props => {
  const {layout, isConnected, closeNavigation, exampleCall} = props
  let callSuccess, callFailure, callError, callUndefined, callTimeout

  if (isConnected) {
    callSuccess = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('success')
    }

    callFailure = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('fail')
    }

    callError = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('error')
    }

    callUndefined = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('undefined')
    }

    callTimeout = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('timeout')
    }
  }

  return <Menu primary={true}>
    <Anchor disabled={!isConnected} onClick={callSuccess}>Success</Anchor>
    <Anchor disabled={!isConnected} onClick={callFailure}>Failure</Anchor>
    <Anchor disabled={!isConnected} onClick={callError}>Error</Anchor>
    <Anchor disabled={!isConnected} onClick={callUndefined}>Undefined</Anchor>
    <Anchor disabled={!isConnected} onClick={callTimeout}>Timeout</Anchor>
  </Menu>
}

const ExampleMenu = connect(
    function mapStateToProps (state) {
      return {
        layout: state.ui.layout,
        isConnected: state.network.isOnline && state.overpass.isConnected
      }
    },
    function mapDispatchToProps (dispatch) {
      return {
        closeNavigation: () => dispatch(closeNavigation()),
        exampleCall: command => dispatch(actions.exampleCall(command))
      }
    }
)(menu)

export default ExampleMenu
