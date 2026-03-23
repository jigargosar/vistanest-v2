import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import './global.css'

createRoot(document.getElementById('app')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
