import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css"; // Make sure to import the new CSS

export default function HomePage() {
  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);
  const videoRef3 = useRef(null);
  const videoRef4 = useRef(null);

  const videos = [
    {
      src: "https://firebasestorage.googleapis.com/v0/b/player-ratings-ef06c.firebasestorage.app/o/site-assets%2Fscreenshot-videos%2Fpredict-lineup-capture.mp4?alt=media&token=955091b8-d859-438c-8f4d-7d4eb3cc09dc",
      alt: "Predict Lineup",
    },
    {
      src: "https://firebasestorage.googleapis.com/v0/b/player-ratings-ef06c.firebasestorage.app/o/site-assets%2Fscreenshot-videos%2Fplayer-ratings-capture.mp4?alt=media&token=770d3346-af9e-44d2-abb4-02f4a4d522b7",
      alt: "Player Ratings",
    },
    {
      src: "https://firebasestorage.googleapis.com/v0/b/player-ratings-ef06c.firebasestorage.app/o/site-assets%2Fscreenshot-videos%2FUntitled.mp4?alt=media&token=d60270d0-fd85-452a-961f-f50c7552edec",
      alt: "Players Season Stats",
    },
    {
      src: "https://firebasestorage.googleapis.com/v0/b/player-ratings-ef06c.firebasestorage.app/o/site-assets%2Fscreenshot-videos%2Fpredictions-capture.mp4?alt=media&token=f8fb57fe-f9c9-4aa6-9c56-25383a92d143",
      alt: "Predictions",
    },
  ];
  useEffect(() => {
    // Ensure each video plays when the component is mounted
    if (videoRef1.current) {
      videoRef1.current.play().catch((error) => {
        console.error("Autoplay failed for video 1:", error);
      });
    }
    if (videoRef2.current) {
      videoRef2.current.play().catch((error) => {
        console.error("Autoplay failed for video 2:", error);
      });
    }
    if (videoRef3.current) {
      videoRef3.current.play().catch((error) => {
        console.error("Autoplay failed for video 3:", error);
      });
    }
    if (videoRef4.current) {
      videoRef4.current.play().catch((error) => {
        console.error("Autoplay failed for video 4:", error);
      });
    }
  }, []);

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
          {/* <h2 className="section-title">Features</h2> */}

          <div className="video-item">
            <div className="video-info">
              <div className="video-text">
                <h3 className="video-title">Predict Your Lineup</h3>
                <p className="video-description">
                  Pick your preferred lineup, and see the percent each player
                  was chosen.
                </p>
              </div>

              <video
                ref={videoRef1}
                autoplay
                loop
                muted
                playsInline
                className="video-player-capture"
              >
                <source src={videos[0].src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="video-item">
            <div className="video-info-reverse">
              <div className="video-text-reverse">
                <h3 className="video-title">Player Ratings</h3>
                <p className="video-description">
                  Rate players after each match and see how your ratings compare
                  to the community's.
                </p>
              </div>

              <video
                ref={videoRef2}
                autoplay
                loop
                muted
                playsInline
                className="video-player-capture"
              >
                <source src={videos[1].src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="video-item">
            <div className="video-info">
              <div className="video-text">
                <h3 className="video-title">Season Stats</h3>
                <p className="video-description">
                  Look at all the players ratings across the whole season.
                </p>
              </div>

              <video
                ref={videoRef3}
                autoplay
                loop
                muted
                playsInline
                className="video-player-capture"
              >
                <source src={videos[2].src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="video-item">
            <div className="video-info-reverse">
              <div className="video-text-reverse">
                <h3 className="video-title">Predictions</h3>
                <p className="video-description">
                  Predict the outcome of matches and see how your predictions
                  stack up against the community's.
                </p>
              </div>

              <video
                ref={videoRef4}
                autoplay
                loop
                muted
                playsInline
                className="video-player-capture"
              >
                <source src={videos[3].src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Link to="/profile" className="cta-button">
          Beta Is Live! Join Now
        </Link>
      </div>

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
