import React from 'react'
import {connect} from 'react-redux'

import App from 'grommet/components/App'
import Section from 'grommet/components/Section'

import header from '../components/header'

const home = () => <App>
  {header}
  <Section pad='medium'><p>Home</p></Section>
</App>

const Home = connect()(home)
export default Home
