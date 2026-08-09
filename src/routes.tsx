import { createBrowserRouter } from 'react-router'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Live from './pages/Live'

export const router = createBrowserRouter([
  { path: '/', Component: Landing },
  { path: '/dashboard', Component: Dashboard },
  { path: '/live', Component: Live },
  { path: '*', Component: Landing },
])
