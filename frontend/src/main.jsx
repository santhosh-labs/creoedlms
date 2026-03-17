import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Apply saved theme on load (default: dark) ──────────────
const savedTheme = localStorage.getItem('creoed-theme') || 'dark';
const savedAccent = localStorage.getItem('creoed-accent') || 'green';

const resolvedTheme = savedTheme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : savedTheme;
document.documentElement.setAttribute('data-theme', resolvedTheme);

// Apply accent colour
const ACCENT_MAP = {
    green:  '#1aae64',
    blue:   '#1976d2',
    purple: '#7c3aed',
    orange: '#ea580c',
    teal:   '#0d9488',
};
const hex = ACCENT_MAP[savedAccent] || ACCENT_MAP.green;
document.documentElement.style.setProperty('--primary', hex);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

