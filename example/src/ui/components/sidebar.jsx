import React from 'react'
import {connect} from 'react-redux'

import Button from 'grommet/components/Button'
import Close from 'grommet/components/icons/base/Close'
import Cluster from 'grommet/components/icons/base/Cluster'
import Header from 'grommet/components/Header'
import Sidebar from 'grommet/components/Sidebar'
import Title from 'grommet/components/Title'

import * as actions from '../actions'
import ExampleMenu from '../../example/ui/menu'

const sidebar = props => {
  const {closeNavigation} = props

  return <Sidebar colorIndex='brand'>
    <Header justify='between' pad={{horizontal: 'medium'}}>
      <Title responsive={false} onClick={closeNavigation}>
        <Cluster />
        Overpass
      </Title>
      <Button icon={<Close />} onClick={closeNavigation} />
    </Header>

    <ExampleMenu />
  </Sidebar>
}

const OverpassSidebar = connect(
    null,
    function mapDispatchToProps (dispatch) {
      return {
        closeNavigation: () => dispatch(actions.closeNavigation()),
      }
    }
)(sidebar)

export default OverpassSidebar
