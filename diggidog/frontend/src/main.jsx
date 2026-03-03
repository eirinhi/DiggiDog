import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import './index.css'
import App from './App.jsx'
import CreateCompetitionForm from './components/CreateCompetitionForm';
import CompOverview from './CompOverview.jsx'
import Navbar from './components/navbar.jsx'
import Home from './pages/homepage/home.jsx'
import CC from './components/CreateCompetitionForm.jsx'
import Userpage from "./pages/userpage/userpage.jsx"

// Fikk hjelp av KI for å passe på at siden alltid var på toppen ved React-route 
function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
}
//slutt KI-hjelp


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> {/*Må wrappe i browserRouter slik at routes ikke trigger en full refresh */}
      <ScrollToTop />
      <Navbar /> {/*Ligger utenfor routes så den vises på alle sider */}
      <Routes>
        <Route path="/" element={<Home />} /> 
        <Route path="/login" element={<App />} />
        <Route path="/profile" element={<Userpage />} />
        <Route path="/admin" element={<CC />} /> 
      </Routes>
    </BrowserRouter>
  </StrictMode>
)

