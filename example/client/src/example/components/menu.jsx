import React from 'react'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'

import Anchor from 'grommet/components/Anchor'
import Menu from 'grommet/components/Menu'

import {closeNavigation} from '../../navigation/actions'
import {exampleCall} from '../thunks'
import {getLayout} from '../../navigation/selectors'
import {isOverpassReady} from '../../overpass/selectors'

export function ExampleMenu (props) {
  const {
    layout,
    isAReady,
    isBReady,
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

  if (isAReady) {
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

  if (isBReady) {
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

  return <Menu primary>
    <Anchor disabled={!isAReady} onClick={callASuccess}>A: Success</Anchor>
    <Anchor disabled={!isAReady} onClick={callAFailure}>A: Failure</Anchor>
    <Anchor disabled={!isAReady} onClick={callAError}>A: Error</Anchor>
    <Anchor disabled={!isAReady} onClick={callAUndefined}>A: Undefined</Anchor>
    <Anchor disabled={!isAReady} onClick={callATimeout}>A: Timeout</Anchor>

    <Anchor disabled={!isBReady} onClick={callBSuccess}>B: Success</Anchor>
    <Anchor disabled={!isBReady} onClick={callBFailure}>B: Failure</Anchor>
    <Anchor disabled={!isBReady} onClick={callBError}>B: Error</Anchor>
    <Anchor disabled={!isBReady} onClick={callBUndefined}>B: Undefined</Anchor>
    <Anchor disabled={!isBReady} onClick={callBTimeout}>B: Timeout</Anchor>
  </Menu>
}

export default connect(
    function mapStateToProps (state) {
      return {
        layout: getLayout(state),
        isAReady: isOverpassReady(state, {contextId: 'a'}),
        isBReady: isOverpassReady(state, {contextId: 'b'})
      }
    },
    function mapDispatchToProps (dispatch) {
      return bindActionCreators({closeNavigation, exampleCall}, dispatch)
    }
)(ExampleMenu)
