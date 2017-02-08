import HomeScreen from './screens/home'
import OverpassApp from './components/app'

export default function createRoutes (dispatch, {overpass}) {
  return {
    path: '/',
    component: OverpassApp,
    indexRoute: {
      component: HomeScreen
    }
  }
}
