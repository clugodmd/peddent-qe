import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AccessCodeGate } from './components/AccessCodeGate.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AccessCodeGate>
      <App />
    </AccessCodeGate>
  </React.StrictMode>,
)
