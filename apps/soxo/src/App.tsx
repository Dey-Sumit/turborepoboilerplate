import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './pages/home';
import { About } from './pages/about';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/about',
    element: <About />,
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}

export default App;