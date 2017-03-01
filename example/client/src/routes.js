import HomeScreen from './screens/home'
import ExampleApp from './components/app'

export default function createRoutes () {
  return {
    path: '/',
    component: ExampleApp,
    indexRoute: {
      component: HomeScreen
    }
  }
}
