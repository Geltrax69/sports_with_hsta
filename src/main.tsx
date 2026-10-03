import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'
import './bones/registry.ts'
import { reloadForNewBuild } from './lib/staleBuild'

// Vite fires this when a lazy page chunk can't load (usually a new deploy).
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewBuild()) event.preventDefault()
})

void document.fonts.load('24px "Material Symbols Outlined"').then(() => {
  document.documentElement.classList.add('ms-icons-ready')
}).catch(() => {
  document.documentElement.classList.add('ms-icons-ready')
})

createRoot(document.getElementById('root')!).render(<App />)
