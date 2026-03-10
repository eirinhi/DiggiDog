import "./navbar.css";
import logo from "../assets/logo.png"; 
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const checkUser = () => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  };

  useEffect(() => {
    checkUser();
    window.addEventListener("userChanged", checkUser);
    return () => window.removeEventListener("userChanged", checkUser);
  }, []);

  useEffect(() => {
    setShowSearch(false);
  }, [location.pathname]);
  
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userChanged"));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowSearch(false);
    }
  };

  return (
    <>
      <nav className="navBar">
        <div className="navBar__inner">
        <div className="navBar__box navBar__boxleft">
          <Link className="navBar__comps" to="/comps">Competitions</Link>
        </div>
        <div className="navBar__box navBar__boxcenter">
          <Link className="navBar__logo" to="/" onClick={() => setShowSearch(false)}><img className="navBar__logoImage" src={logo} alt="DiggiDog"/></Link>
        </div>
        <div className="navBar__box navBar__boxright">
          <button 
            className="navBar__searchBtn"
            onClick={() => setShowSearch(!showSearch)}
            title="Search users"
          >
            <svg className="navBar__searchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          {loggedIn ? (
            <div className="navBar__userActions">
              <Link className="navBar__profileLink" to="/profile">
                <svg className="navBar__profileIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
                Profile
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

      {showSearch && (
        <div className="navBar__searchContainer">
          <form className="navBar__searchForm" onSubmit={handleSearch}>
            <input
              type="text"
              className="navBar__searchInput"
              placeholder="Search users by username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" className="navBar__searchSubmitBtn">
              Search
            </button>
          </form>
        </div>
      )}
    </>
  );
}