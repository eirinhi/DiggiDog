import HowItWorks from "../../components/HowItWorks.jsx"
import Hero from "../../components/Hero.jsx"
import "./Home.css"
import Ad from "../../components/Ad.jsx"
export default function Home() {
  return (
    <div className="homePage">
      <div className="homeLayout">
        <aside className="homeSideAd">
          <div className="homeAdBox">
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