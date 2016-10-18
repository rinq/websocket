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
    <Anchor disabled={!isAConnected} onClick={callASuccess}>A: Success</Anchor>
    <Anchor disabled={!isAConnected} onClick={callAFailure}>A: Failure</Anchor>
    <Anchor disabled={!isAConnected} onClick={callAError}>A: Error</Anchor>
    <Anchor disabled={!isAConnected} onClick={callAUndefined}>A: Undefined</Anchor>
    <Anchor disabled={!isAConnected} onClick={callATimeout}>A: Timeout</Anchor>

    <Anchor disabled={!isBConnected} onClick={callBSuccess}>B: Success</Anchor>
    <Anchor disabled={!isBConnected} onClick={callBFailure}>B: Failure</Anchor>
    <Anchor disabled={!isBConnected} onClick={callBError}>B: Error</Anchor>
    <Anchor disabled={!isBConnected} onClick={callBUndefined}>B: Undefined</Anchor>
    <Anchor disabled={!isBConnected} onClick={callBTimeout}>B: Timeout</Anchor>
  </Menu>
}

const ExampleMenu = connect(
    function mapStateToProps (state) {
      return {
        layout: state.ui.layout,
        isAConnected: state.overpass.a.isConnected,
        isBConnected: state.overpass.b.isConnected
      }
    },
    function mapDispatchToProps (dispatch) {
      return {
        closeNavigation: () => dispatch(closeNavigation()),
        exampleCall: (context, command) => {
          dispatch(actions.exampleCall(context, command))
        }
      }
    }
)(menu)

export default ExampleMenu
