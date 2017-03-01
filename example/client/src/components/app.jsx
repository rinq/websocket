import React from 'react'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'

import App from 'grommet/components/App'
import Helmet from 'react-helmet'

import {initializeApp} from '../thunks'

export class ExampleApp extends React.Component {
  componentWillMount () {
    this.props.initializeApp()
  }

  render () {
    return <App className='example-app' centered={false}>
      <Helmet defaultTitle='Rinq' titleTemplate='%s | Rinq' />
      {this.props.children}
    </App>
  }
}

export default connect(
  null,
  function mapDispatchToProps (dispatch) {
    return bindActionCreators({initializeApp}, dispatch)
  }
)(ExampleApp)
