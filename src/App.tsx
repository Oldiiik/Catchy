import { RouterProvider } from 'react-router'
import { LangProvider } from './lang'
import { router } from './routes'

export default function App() {
  return (
    <LangProvider>
      <RouterProvider router={router} />
    </LangProvider>
  )
}
