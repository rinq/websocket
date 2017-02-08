import React from 'react'
import {connect} from 'react-redux'

import Heading from 'grommet/components/Heading'

import ExampleNotification from '../example/components/notification'
import ExampleLog from '../example/components/log'
import Layout from '../components/layout'

export function HomeScreen (props) {
  return <Layout title='Dashboard'>
    <Heading tag='h2'>Latest notification</Heading>
    <ExampleNotification />

    <Heading tag='h2'>Command log</Heading>
    <ExampleLog />
  </Layout>
}

export default connect()(HomeScreen)
