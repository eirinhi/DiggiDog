import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import CreateCompetitionForm from './components/CreateCompetitionForm';
import CompOverview from './CompOverview.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CompOverview />
  </StrictMode>,
)
