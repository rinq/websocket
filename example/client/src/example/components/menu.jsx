import React from 'react'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'

import Anchor from 'grommet/components/Anchor'
import Header from 'grommet/components/Header'
import Heading from 'grommet/components/Heading'
import Menu from 'grommet/components/Menu'

import {closeNavigation} from '../../navigation/actions'
import {contexts, commands} from '../../services'
import {exampleCall} from '../thunks'
import {getLayout} from '../../navigation/selectors'
import {overpassContexts} from '../../overpass/selectors'

export function ExampleMenu (props) {
  const {
    layout,
    contextState,
    closeNavigation,
    exampleCall
  } = props
  let menuItems = []

  contexts.map(function (context) {
    const isReady = contextState.getIn([context.id, 'isReady'])

    const menuHeader = <Header key={`context.${context.id}`} pad={{horizontal: 'medium'}}>
      <Heading tag='h4' margin='none' strong>{context.label}</Heading>
    </Header>
    menuItems.push(menuHeader)

    let i = 0

    commands.map(function (command) {
      const handler = isReady && function () {
        if (layout === 'single') closeNavigation()
        exampleCall(context.id, command.ns, command.command, command.payload)
      }

      const menuItem = <Anchor key={`command.${context.id}.${i++}`} disabled={!isReady} onClick={handler}>
        {command.label}
      </Anchor>
      menuItems.push(menuItem)
    })
  })

  return <Menu primary size='small'>{menuItems}</Menu>
}

export default connect(
    function mapStateToProps (state) {
      return {
        layout: getLayout(state),
        contextState: overpassContexts(state)
      }
    },
    function mapDispatchToProps (dispatch) {
      return bindActionCreators({closeNavigation, exampleCall}, dispatch)
    }
)(ExampleMenu)
