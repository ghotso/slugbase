import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'

// Apply initial dark mode based on browser preference before React renders
// This ensures dark mode is applied immediately, even on login page
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (prefersDark) {
  document.documentElement.classList.add('dark');
}

// Listen for changes to browser preference
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  // Only apply if user hasn't set a preference (i.e., no user logged in or theme is 'auto')
  const root = document.documentElement;
  const hasUserTheme = root.dataset.userTheme === 'true';
  if (!hasUserTheme) {
    if (e.matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
