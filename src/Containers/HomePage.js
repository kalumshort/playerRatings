import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css"; // Make sure to import the new CSS

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          {/* <img src={whiteLogo} alt="11Votes Logo" className="logo" /> */}
          <h1 className="hero-title">Upgrading Football Fan Engagement</h1>
          <p className="hero-subtitle">
            Join the 11Votes beta today! Vote, rate, and choose your favorite
            lineups while shaping the future of football.
          </p>
          <Link to="/profile" className="cta-button">
            Join the Beta Now!
          </Link>
          <div className="beta-info">
            <p style={{ fontSize: "14px", fontStyle: "italic" }}>
              * Beta available for Manchester United games only{" "}
            </p>
          </div>
        </div>
      </section>
      <section className="features">
        <div className="features-content">
          <h2 className="section-title">Why Join?</h2>
          <div className="feature-item">
            <div className="feature-icon">⚽</div>
            <h3 className="feature-title">Interactive Voting</h3>
            <p className="feature-description">
              Vote on team lineups, scores, and more. Your opinion matters!
            </p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">💬</div>
            <h3 className="feature-title">Community Engagement</h3>
            <p className="feature-description">
              Engage with a community of football lovers and share your
              thoughts.
            </p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Instant Insights</h3>
            <p className="feature-description">
              Get immediate statistics and analysis after every match.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
