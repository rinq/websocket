import React from 'react'
import {connect} from 'react-redux'

import ExampleLog from '../../example/ui/log'
import Layout from '../components/layout'

const home = () => {
  const title = 'Log'
  const content = <ExampleLog />

  return <Layout title={title} content={content} />
}

const Home = connect()(home)
export default Home
