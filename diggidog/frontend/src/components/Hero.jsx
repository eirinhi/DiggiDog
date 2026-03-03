import "./Hero.css";
import dog from "../assets/lab.png"
import Ad from "./Ad.jsx"

export default function Hero(){
    return(
        <section className="hero">
            <div className="hero__inner">
                <div className="hero__left">
                    <h1 className="hero__title">Welcome to DiggiDog</h1>
                    <p className="hero__text">Your digital platform for dog shows</p>
                </div>
                
                <div className="hero__right">
                    <img className="hero__img" src={dog} alt="Dog illustration" />
                </div>
                      
            </div>
        </section>

    );

}