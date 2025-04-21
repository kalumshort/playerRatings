import React from "react";
import Lottie from "react-lottie";
import animationData from "../assets/animations/football-loader.json"; // Import the Lottie JSON data
import whiteLogo from "../assets/logo/11votes-nobg-clear-white.png";

export default function Spinner({ text }) {
  const defaultOptions = {
    loop: true,
    autoplay: true, // Animation will autoplay
    animationData: animationData, // Provide the animation JSON data
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice", // Make sure the animation fits the container
    },
  };

  return (
    <div className="spinner-container">
      <Lottie options={defaultOptions} height={200} width={100} />
      <img
        src={whiteLogo}
        alt="11Votes Logo"
        style={{ height: "50px", position: "absolute", bottom: "15px" }}
      />
      {text && <p>{text}</p>}
    </div>
  );
}
