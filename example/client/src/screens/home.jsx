import React from 'react'
import {connect} from 'react-redux'

import ExampleLog from '../example/components/log'
import Layout from '../components/layout'

export function HomeScreen (props) {
  const title = 'Log'
  const content = <ExampleLog />

  return <Layout title={title} content={content} />
}

export default connect()(HomeScreen)
