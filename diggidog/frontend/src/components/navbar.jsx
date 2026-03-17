import "./navbar.css";
import logo from "../assets/logo.png"; 
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const checkUser = () => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setLoggedIn(true);
        setIsAdmin(!!user?.is_admin);
      } catch {
        setLoggedIn(false);
        setIsAdmin(false);
      }
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
          <Link className="navBar__logo" to="/" onClick={() => setShowSearch(false)}><img className="navBar__logoImage" src={logo} alt="DiggiDog"/></Link>
        </div>
        <div className="navBar__box navBar__boxcenter">
          <Link className="navBar__compsLink" to="/">
            <svg className="navBar__compsIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
              <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            Home
          </Link>
          <Link className="navBar__compsLink" to="/comps">
            <svg className="navBar__compsIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
              <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
              <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
              <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
            </svg>
            Competitions
          </Link>
          <button 
            className="navBar__searchBtn"
            onClick={() => setShowSearch(!showSearch)}
            title="Search users"
          >
            <svg className="navBar__searchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Search
          </button>
        </div>
        <div className="navBar__box navBar__boxright">
          {loggedIn ? (
            <div className="navBar__userActions">
              {isAdmin && (
                <a href="http://127.0.0.1:8000/admin" className="navBar__dashboardBtn" type="button" aria-label="Admin Dashboard">
                  Admin Dashboard
                </a>
              )}
              <Link className="navBar__profileLink" to="/profile">
                <svg className="navBar__profileIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
                Profile
              </Link>
              <Link className="navBar__login navBar__signOut" to="/" onClick={() => {
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