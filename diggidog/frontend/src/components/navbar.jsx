import "./navbar.css";
import logo from "../assets/logo.png"; 
import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navBar">
      <div className="navBar__inner">
        {/* 1fr auto 1fr med en tom venstrekolonne skal sikre at logoen alltid er sentrert*/}
        <div className="navBar__box navBar__boxleft" aria-hidden="true" /> 
        <div className="navBar__box navBar__boxcenter">
          <Link className="navBar__logo" to="/"> {/*Link i stedet for <a>, som gir klient-side navigasjon uten full refresh*/}
            <img className="navBar__logoImage" src={logo} alt="DiggiDog" />
          </Link>
        </div>
        <div className="navBar__box navBar__boxright">
          <Link className="navBar__login" to="/login">Sign In</Link>
        </div>
      </div>
    </nav>
  );
}