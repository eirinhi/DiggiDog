import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import CompOverview from './CompOverview.jsx'
import Navbar from './components/navbar.jsx'
import Home from './homepage/home.jsx'
import CC from './components/CreateCompetitionForm.jsx'
import AdUploadForm from './components/AdUploadForm.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> {/*Må wrappe i browserRouter slik at routes ikke trigger en full refresh */}
      <Navbar /> {/*Ligger utenfor routes så den vises på alle sider */}
      <Routes>
        <Route path="/" element={<Home />} /> 
        <Route path="/login" element={<App />} /> 
        <Route path="/admin" element={<CC />} /> 
        <Route path="/upload_ad" element={<AdUploadForm />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
