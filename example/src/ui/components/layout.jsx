import React from 'react'
import {connect} from 'react-redux'

import App from 'grommet/components/App'
import Article from 'grommet/components/Article'
import Button from 'grommet/components/Button'
import Cluster from 'grommet/components/icons/base/Cluster'
import Connect from 'grommet/components/icons/base/Connect'
import Header from 'grommet/components/Header'
import Section from 'grommet/components/Section'
import Split from 'grommet/components/Split'
import Title from 'grommet/components/Title'

import * as actions from '../actions'
import NetworkIndicator from '../../network/ui/indicator'
import OverpassSidebar from '../components/sidebar'

const layout = (props) => {
  const {title, content, isNavigationOpen, openNavigation, updateLayout} = props
  let colorIndex

  if (isNavigationOpen) {
    return <App centered={false}>
      <Split flex='right' priority='left' onResponsive={updateLayout}>
        <OverpassSidebar />

        <Article>
          <Header justify='between' pad={{horizontal: 'medium'}}>
            <Title>{title}</Title>
            <NetworkIndicator />
          </Header>

          <Section pad={{horizontal: 'medium'}}>
            {content}
          </Section>
        </Article>
      </Split>
    </App>
  }

  return <App centered={false}>
    <Article>
      <Header justify='between' pad={{horizontal: 'medium'}}>
        <Title responsive={false} onClick={openNavigation}>
          <Cluster colorIndex='brand' />
          {title}
        </Title>

        <NetworkIndicator />
      </Header>

      <Section pad={{horizontal: 'medium'}}>
        {content}
      </Section>
    </Article>
  </App>
}

const Layout = connect(
    function mapStateToProps (state) {
      return {
        isNavigationOpen: state.ui.isNavigationOpen
      }
    },
    function mapDispatchToProps (dispatch) {
      return {
        openNavigation: state => dispatch(actions.openNavigation()),
        updateLayout: state => dispatch(actions.updateLayout(state))
      }
    }
)(layout)

export default Layout
