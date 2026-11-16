import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/heritage.css'
import App from './App.jsx'
import { lockAppZoom } from './utils/appContext'

lockAppZoom()

createRoot(document.getElementById('root')).render(
  <App />
)

// Register Service Worker for Notifications
// Service worker removed
