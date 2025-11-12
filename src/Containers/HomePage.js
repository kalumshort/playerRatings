import React, { useEffect, useRef } from "react";
// import { Link } from "react-router-dom";
import "./HomePage.css"; // Make sure to import the new CSS
import {
  Box,
  // Button,
  // Card,
  // CardContent,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

// import GroupsIcon from "@mui/icons-material/Groups";
// import HowToVoteIcon from "@mui/icons-material/HowToVote";
// import BarChartIcon from "@mui/icons-material/BarChart";
import Login from "../Components/Auth/Login";

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
    const videos = [videoRef1, videoRef2, videoRef3, videoRef4];

    const handleCanPlayThrough = (videoRef) => {
      if (videoRef.current) {
        videoRef.current.muted = true; // Ensure the video is muted for autoplay
        videoRef.current.play().catch((error) => {
          console.error("Autoplay failed:", error);
        });
      }
    };

    videos.forEach((videoRef) => {
      if (videoRef.current) {
        videoRef.current.addEventListener("canplaythrough", () =>
          handleCanPlayThrough(videoRef)
        );
      }
    });

    // Cleanup the event listeners
    return () => {
      videos.forEach((videoRef) => {
        if (videoRef.current) {
          videoRef.current.removeEventListener(
            "canplaythrough",
            handleCanPlayThrough
          );
        }
      });
    };
  }, []);

  return (
    <div className="home-page">
      <Box
        component="section"
        sx={{
          pt: { xs: 14, md: 18 },
          pb: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography
                variant="overline"
                sx={{
                  letterSpacing: 1.5,
                  fontWeight: 700,
                }}
              >
                Premier League
              </Typography>
              <Typography
                variant="h2"
                sx={{ fontWeight: 900, lineHeight: 1.1, mt: 1 }}
              >
                Your team. Your votes. Your voice.
              </Typography>
              <Typography
                variant="h6"
                sx={{ mt: 2, color: "text.secondary", maxWidth: 600 }}
              >
                Join your club’s fan group to predict scores, rate players, and
                react to every match. See what the crowd thinks and be part of
                the conversation that shapes the game.
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ mt: 4 }}
              ></Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper elevation={3} sx={{ padding: 3 }}>
                <Login />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
      {/* <HowItWorks /> */}
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
                preload="auto"
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
                preload="auto"
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
                preload="auto"
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
                preload="auto"
              >
                <source src={videos[3].src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* <section className="features">
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
      </section> */}
    </div>
  );
}
// function HowItWorks() {
//   const steps = [
//     {
//       title: "Join your club",
//       desc: "Pick your Premier League team and become part of its fan group community.",
//       icon: <GroupsIcon fontSize="large" />,
//     },
//     {
//       title: "Make your picks",
//       desc: "Predict scores, rate players, and share your matchday reactions.",
//       icon: <HowToVoteIcon fontSize="large" />,
//     },
//     {
//       title: "See the consensus",
//       desc: "Watch live averages of ratings, predictions, and mood from fans like you.",
//       icon: <BarChartIcon fontSize="large" />,
//     },
//   ];

//   return (
//     <Box id="how-it-works" component="section" sx={{ py: { xs: 10, md: 14 } }}>
//       <Container maxWidth="lg">
//         <Typography
//           variant="h3"
//           sx={{ fontWeight: 900, textAlign: "center", mb: 6 }}
//         >
//           How It Works
//         </Typography>
//         <Grid container spacing={4}>
//           {steps.map((step, index) => (
//             <Grid item xs={12} md={4} key={index}>
//               <Card sx={{ height: "100%", textAlign: "center", p: 3 }}>
//                 <CardContent>
//                   <Box
//                     sx={{ display: "flex", justifyContent: "center", mb: 2 }}
//                   >
//                     {step.icon}
//                   </Box>
//                   <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
//                     {step.title}
//                   </Typography>
//                   <Typography variant="body1" color="text.secondary">
//                     {step.desc}
//                   </Typography>
//                 </CardContent>
//               </Card>
//             </Grid>
//           ))}
//         </Grid>
//       </Container>
//     </Box>
//   );
// }
