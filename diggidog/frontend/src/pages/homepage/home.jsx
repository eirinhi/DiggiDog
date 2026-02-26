import HowItWorks from "../../components/HowItWorks.jsx"
import Hero from "../../components/Hero.jsx"
import "./Home.css"

export default function Home() {
  return (
    <div className="homePage">
      <main className="mainpage">
        <Hero />
        <HowItWorks />
      </main>
    </div>
  );
}