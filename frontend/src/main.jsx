import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { WalletProvider } from './contexts/WalletContext'
import RequireWallet from './routes/RequireWallet'
import './index.css'
import App from './App'
import Home from './pages/Home'
import PredictionMarket from './pages/PredictionMarket'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Contact from './pages/Contact'
import PredictOutput from './pages/PredictOutput'

const router = createBrowserRouter([
  {
    element: <App />, // layout
    children: [
      { path: '/', element: <Home /> },
      {
        element: <RequireWallet />,
        children: [
          { path: '/prediction-market', element: <PredictionMarket /> },
          { path: '/predict-output', element: <PredictOutput /> },
        ],
      },
      { path: '/privacy', element: <Privacy /> },
      { path: '/terms', element: <Terms /> },
      { path: '/contact', element: <Contact /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WalletProvider>
      <RouterProvider router={router} />
    </WalletProvider>
  </React.StrictMode>
)
