import "./navbar.css";
import logo from "../assets/logo.png"; 
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

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

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userChanged"));
  };

  return (
    <nav className="navBar">
      <div className="navBar__inner">
        <div className="navBar__box navBar__boxleft">
          {loggedIn && isAdmin && (
            <>
              <Link className="navBar__admin" to="/admin">Create Competition</Link>
              <Link className="navBar__admin navBar__adminSecondary" to="/upload_ad">Add Ad</Link>
            </>
          )}
        </div>
        <div className="navBar__box navBar__boxcenter">
          <Link className="navBar__logo" to="/"><img className="navBar__logoImage" src={logo} alt="DiggiDog"/></Link>
        </div>
        <div className="navBar__box navBar__boxright">
          {loggedIn ? (
            <Link className="navBar__login" onClick={handleLogout} to="/">Log out</Link>
          ) : (
            <Link className="navBar__login" to="/login">Sign In</Link>
          )}
        </div>

      </div>
    </nav>
  );
}