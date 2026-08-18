import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.js'
import { PoliticasPage } from './pages/politicas.js'
import { TermosPage } from './pages/termos.js'
import { NotFoundPage } from './pages/not-found.js'

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

function Root() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/'

  if (pathname === '/' || pathname === '/index.html') {
    return <App />
  }
  if (pathname === '/politicas') {
    return <PoliticasPage />
  }
  if (pathname === '/termos') {
    return <TermosPage />
  }
  return <NotFoundPage />
}

createRoot(root).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
