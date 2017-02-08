import React from 'react'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'

import Button from 'grommet/components/Button'
import Close from 'grommet/components/icons/base/Close'
import Cluster from 'grommet/components/icons/base/Cluster'
import Header from 'grommet/components/Header'
import Sidebar from 'grommet/components/Sidebar'
import Title from 'grommet/components/Title'

import ExampleMenu from '../example/components/menu'
import {closeNavigation} from '../navigation/actions'

export function OverpassSidebar (props) {
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

export default connect(
    null,
    function mapDispatchToProps (dispatch) {
      return bindActionCreators({closeNavigation}, dispatch)
    }
)(OverpassSidebar)
