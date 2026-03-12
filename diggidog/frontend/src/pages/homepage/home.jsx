import HowItWorks from "../../components/HowItWorks.jsx"
import Hero from "../../components/Hero.jsx"
import "./Home.css"
import Ad from "../../components/Ad.jsx"
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      const savedUser = localStorage.getItem("user");
      if (!savedUser) {
        setIsAdmin(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(savedUser);
        setIsAdmin(!!parsedUser?.is_admin);
      } catch {
        setIsAdmin(false);
      }
    };

    checkUser();
    window.addEventListener("userChanged", checkUser);
    return () => window.removeEventListener("userChanged", checkUser);
  }, []);

  return (
    <div className="homePage">
      <div className="homeLayout">
        <aside className="homeSideAd">
          <div className="homeAdBox">
            {isAdmin && (
              <Link className="homeAddAdLink" to="/upload_ad">+ Add Ad</Link>
            )}
            
            {<Ad/>}
             {<Ad/>}
              {<Ad/>}
               {<Ad/>}
          </div>
        </aside>

        <main className="homeContent">
          <Hero />
          <HowItWorks />
        </main>
      </div>
    </div>
  );
}