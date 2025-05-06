import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css"; // Make sure to import the new CSS

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">The Ultimate Football Community Hub</h1>
          <p className="hero-subtitle">
            11Votes gives football communities the power to create their own
            spaces where fans can predict, vote, and discuss everything about
            upcoming matches, player ratings, and more.
          </p>
          <Link to="/profile" className="cta-button">
            Beta Is Live! Join Now
          </Link>
          <div className="beta-info">
            <p style={{ fontSize: "14px", fontStyle: "italic" }}>
              * Beta Currently available for Manchester United games only
            </p>
          </div>
        </div>
      </section>
      <section className="video-features">
        <div className="video-features-content">
          <h2 className="section-title">Features</h2>
          <div className="video-item">
            <div className="video-info">
              <div className="video-text">
                <h3 className="video-title">Predict Your Lineup</h3>
                <p className="video-description">
                  Learn how to predict your favorite team's lineup before every
                  match.
                </p>
              </div>
              <div className="video-container">
                <video autoplay loop muted className="video-player-capture">
                  <source
                    src="https://firebasestorage.googleapis.com/v0/b/player-ratings-ef06c.firebasestorage.app/o/site-assets%2Fscreenshot-videos%2Fpredict-lineup-capture.mp4?alt=media&token=955091b8-d859-438c-8f4d-7d4eb3cc09dc"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-content">
          <h2 className="section-title">Why Create a Community on 11Votes?</h2>
          <div className="feature-item">
            <div className="feature-icon">⚽</div>
            <h3 className="feature-title">Fan-Powered Voting</h3>
            <p className="feature-description">
              Empower your community to vote on team lineups, match predictions,
              and player ratings. Every fan's voice counts!
            </p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">💬</div>
            <h3 className="feature-title">
              Build a Thriving Football Community
            </h3>
            <p className="feature-description">
              Create a space for passionate fans to discuss, predict, and share
              their insights about football in real-time.
            </p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Real-Time Match Insights</h3>
            <p className="feature-description">
              After every match, gain instant statistics, analysis, and results
              from your community’s votes to stay in the know.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
