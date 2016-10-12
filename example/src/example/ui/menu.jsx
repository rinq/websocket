import React from 'react'
import {connect} from 'react-redux'

import Anchor from 'grommet/components/Anchor'
import Menu from 'grommet/components/Menu'

import * as actions from '../actions'
import {closeNavigation} from '../../ui/actions'

const menu = props => {
  const {
    layout,
    isAConnected,
    isBConnected,
    closeNavigation,
    exampleCall
  } = props
  let callASuccess,
      callAFailure,
      callAError,
      callAUndefined,
      callATimeout,
      callBSuccess,
      callBFailure,
      callBError,
      callBUndefined,
      callBTimeout

  if (isAConnected) {
    callASuccess = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('a', 'success')
    }

    callAFailure = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('a', 'fail')
    }

    callAError = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('a', 'error')
    }

    callAUndefined = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('a', 'undefined')
    }

    callATimeout = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('a', 'timeout')
    }
  }

  if (isBConnected) {
    callBSuccess = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('b', 'success')
    }

    callBFailure = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('b', 'fail')
    }

    callBError = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('b', 'error')
    }

    callBUndefined = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('b', 'undefined')
    }

    callBTimeout = () => {
      if (layout === 'single') closeNavigation()
      exampleCall('b', 'timeout')
    }
  }

  return <Menu primary={true}>
    <Anchor disabled={!isAConnected} onClick={callASuccess}>Session A: Success</Anchor>
    <Anchor disabled={!isAConnected} onClick={callAFailure}>Session A: Failure</Anchor>
    <Anchor disabled={!isAConnected} onClick={callAError}>Session A: Error</Anchor>
    <Anchor disabled={!isAConnected} onClick={callAUndefined}>Session A: Undefined</Anchor>
    <Anchor disabled={!isAConnected} onClick={callATimeout}>Session A: Timeout</Anchor>

    <Anchor disabled={!isBConnected} onClick={callBSuccess}>Session B: Success</Anchor>
    <Anchor disabled={!isBConnected} onClick={callBFailure}>Session B: Failure</Anchor>
    <Anchor disabled={!isBConnected} onClick={callBError}>Session B: Error</Anchor>
    <Anchor disabled={!isBConnected} onClick={callBUndefined}>Session B: Undefined</Anchor>
    <Anchor disabled={!isBConnected} onClick={callBTimeout}>Session B: Timeout</Anchor>
  </Menu>
}

const ExampleMenu = connect(
    function mapStateToProps (state) {
      return {
        layout: state.ui.layout,
        isAConnected: state.network.isOnline && state.overpass.a.isConnected,
        isBConnected: state.network.isOnline && state.overpass.b.isConnected
      }
    },
    function mapDispatchToProps (dispatch) {
      return {
        closeNavigation: () => dispatch(closeNavigation()),
        exampleCall: (session, command) => {
          dispatch(actions.exampleCall(session, command))
        }
      }
    }
)(menu)

export default ExampleMenu
