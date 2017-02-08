import HomeScreen from './screens/home'
import NotFoundScreen from './screens/not-found'
import OverpassApp from './components/app'

export default function createRoutes (dispatch, {overpass}) {
  const notFound = {
    path: '*',
    component: NotFoundScreen
  }

  return {
    path: '/',
    component: OverpassApp,
    indexRoute: {
      component: HomeScreen
    },
    childRoutes: [notFound]
  }
}
