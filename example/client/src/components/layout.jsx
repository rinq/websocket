import React from 'react'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'

import App from 'grommet/components/App'
import Article from 'grommet/components/Article'
import Cluster from 'grommet/components/icons/base/Cluster'
import Header from 'grommet/components/Header'
import Heading from 'grommet/components/Heading'
import Section from 'grommet/components/Section'
import Split from 'grommet/components/Split'
import Title from 'grommet/components/Title'

import NetworkIndicator from '../network/components/indicator'
import OverpassSidebar from '../navigation/components/sidebar'
import {isNavigationOpen} from '../navigation/selectors'
import {openNavigation, updateLayout} from '../navigation/actions'

export function OverpassLayout (props) {
  const {title, children, isNavigationOpen, openNavigation, updateLayout} = props

  if (isNavigationOpen) {
    return <App centered={false}>
      <Split flex='right' priority='left' onResponsive={updateLayout}>
        <OverpassSidebar />

        <Article>
          <Section pad={{horizontal: 'medium'}}>
            <Heading tag='h1' margin='medium'>{title}</Heading>

            {children}
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
          Overpass
        </Title>

        <NetworkIndicator />
      </Header>

      <Section pad={{horizontal: 'medium'}}>
        <Heading tag='h1' margin='medium'>{title}</Heading>

        {children}
      </Section>
    </Article>
  </App>
}

export default connect(
    function mapStateToProps (state) {
      return {
        isNavigationOpen: isNavigationOpen(state)
      }
    },
    function mapDispatchToProps (dispatch) {
      return bindActionCreators({openNavigation, updateLayout}, dispatch)
    }
)(OverpassLayout)
