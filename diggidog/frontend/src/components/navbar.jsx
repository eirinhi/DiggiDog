import "./navbar.css";
import logo from "../assets/logo.png"; 
import { Link } from 'react-router-dom'
import { useEffect, useState } from "react"
  

export default function Navbar() {

  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkUser = () => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setLoggedIn(true);
      const user = JSON.parse(savedUser);
      setIsAdmin(!!user.is_admin);
    } else {
      setLoggedIn(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    checkUser();
    window.addEventListener("userChanged", checkUser);
    return () => window.removeEventListener("userChanged", checkUser);
  }, []);
  

  return (
    <nav className="navBar">
      <div className="navBar__inner">
        {/* 1fr auto 1fr med en tom venstrekolonne skal sikre at logoen alltid er sentrert*/}
        <div className="navBar__box navBar__boxleft">
          {loggedIn && isAdmin && (
            <Link className="navBar__admin" to="/admin">Create Competition</Link>
          )}
        </div>
        <div className="navBar__box navBar__boxcenter">
          <Link className="navBar__logo" to="/"> {/*Link i stedet for <a>, som gir klient-side navigasjon uten full refresh*/}
            <img className="navBar__logoImage" src={logo} alt="DiggiDog" />
          </Link>
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
                localStorage.removeItem("user");
                window.dispatchEvent(new Event("userChanged"));
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