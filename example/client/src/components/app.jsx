import React from 'react'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'

import App from 'grommet/components/App'
import Helmet from 'react-helmet'

import {initializeApp} from '../thunks'

export class OverpassApp extends React.Component {
  componentWillMount () {
    this.props.initializeApp()
  }

  render () {
    return <App className='overpass-app' centered={false}>
      <Helmet defaultTitle='Overpass' titleTemplate='%s | Overpass' />
      {this.props.children}
    </App>
  }
}

export default connect(
  null,
  function mapDispatchToProps (dispatch) {
    return bindActionCreators({initializeApp}, dispatch)
  }
)(OverpassApp)
