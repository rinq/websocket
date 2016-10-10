import React from 'react'
import {Provider} from 'react-redux'

import router from './components/router'

export default function createUi (store) {
  return <Provider store={store}>{router}</Provider>
}
