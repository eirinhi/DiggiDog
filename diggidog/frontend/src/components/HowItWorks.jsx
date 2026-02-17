import "./HowItWorks.css"
import { UserRound, Trophy, ClipboardCheck, UsersRound } from "lucide-react";

export default function HowItWorks() {
  return (
    <section className="howitworks" id="how-it-works">
      <div className="howitworks__inner">
        <h2 className="howitworks__title">How It Works</h2>

        <div className="howitworks__grid">
          <div className="howitworks__card">
            <UserRound className="cardIcon" aria-hidden="true" />
            <h3 className="howitworks__cardTitle">Create a Profile</h3>
            <p className="howitworks__cardText">Sign up and add photos of your dog</p>
          </div>

          <div className="howitworks__card">
            <Trophy className="cardIcon" aria-hidden="true" />
            <h3 className="howitworks__cardTitle">Enter a Competition</h3>
            <p className="howitworks__cardText">Find a show that suits you, and sign up your dog</p>
          </div>

          <div className="howitworks__card">
            <ClipboardCheck className="cardIcon" aria-hidden="true" />
            <h3 className="howitworks__cardTitle">Vote & Comment</h3>
            <p className="howitworks__cardText">Vote for your favourite in the competitions, and leave encouraging comments</p>
          </div>

          <div className="howitworks__card">
            <UsersRound className="cardIcon" aria-hidden="true" />
            <h3 className="howitworks__cardTitle">Join the Community</h3>
            <p className="howitworks__cardText">Connect with the dog show community!</p>
          </div>
        </div>
      </div>
    </section>
  );
}
