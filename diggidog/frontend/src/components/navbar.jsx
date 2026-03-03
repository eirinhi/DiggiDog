import "./navbar.css";
import logo from "../assets/logo.png"; 
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);

  const checkUser = () => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setLoggedIn(true);
      const user = JSON.parse(savedUser);
    } else {
      setLoggedIn(false);
    }
  };

  useEffect(() => {
    checkUser();
    window.addEventListener("userChanged", checkUser);
    return () => window.removeEventListener("userChanged", checkUser);
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userChanged"));
  };

  return (
    <nav className="navBar">
      <div className="navBar__inner">
        <div className="navBar__box navBar__boxleft">
          <Link className="navBar__comps" to="/comps">Competitions</Link>
        </div>
        <div className="navBar__box navBar__boxcenter">
          <Link className="navBar__logo" to="/"><img className="navBar__logoImage" src={logo} alt="DiggiDog"/></Link>
        </div>
        <div className="navBar__box navBar__boxright">
          {loggedIn ? (
            <div className="navBar__userActions">
              <Link className="navBar__profileLink" to="/profile">
                <svg className="navBar__profileIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
                Profil
              </Link>
              <Link className="navBar__login" to="/" onClick={() => {
                handleLogout();
              }}>Sign Out</Link>
            </div>
          ) : (
            <Link className="navBar__login" to="/login">Sign In</Link>
          )}
        </div>

      </div>
    </nav>
  );
}