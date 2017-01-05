import React from 'react'
import {Router, Route, browserHistory} from 'react-router'

import Home from '../screens/home'

const router = <Router history={browserHistory}>
  <Route path='/' component={Home} />
</Router>

export default router
