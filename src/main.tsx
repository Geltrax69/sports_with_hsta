import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'
import './bones/registry.ts'

void document.fonts.load('24px "Material Symbols Outlined"').then(() => {
  document.documentElement.classList.add('ms-icons-ready')
}).catch(() => {
  document.documentElement.classList.add('ms-icons-ready')
})

createRoot(document.getElementById('root')!).render(<App />)
