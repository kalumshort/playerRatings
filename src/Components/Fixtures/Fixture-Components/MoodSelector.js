import React, { useEffect, useState } from "react";

import {
  firebaseGetDocument,
  handleFixtureMood,
} from "../../../Firebase/Firebase";
import { ContentContainer } from "../../../Containers/GlobalContainer";
import "./moodSelector.css";

const moods = [
  { label: "happy", emoji: "😄" },
  { label: "angry", emoji: "😡" },
  { label: "sad", emoji: "😢" },
  { label: "nervous", emoji: "😬" },
  { label: "excited", emoji: "🤩" },
];

// Example colors for each mood
const MOOD_COLORS = {
  happy: "#4EFF4E",
  excited: "#FFD700",
  sad: "#1E90FF",
  angry: "#FF4500",
  nervous: "#FF69B4",
};

const MOOD_EMOJIS = {
  happy: "😄",
  sad: "😢",
  angry: "😡",
  excited: "🤩",
  nervous: "😬",
  neutral: "😐",
};

const MoodSelector = ({ groupId, fixture, currentYear, matchId }) => {
  const [explosions, setExplosions] = useState([]);
  const [matchMoods, setMatchMoods] = useState(null);

  const matchFinished = fixture?.fixture?.status?.short === "FT";

  useEffect(() => {
    const fetchMoods = async () => {
      try {
        const data = await firebaseGetDocument(
          `groups/${groupId}/seasons/${currentYear}/fixtureMoods`,
          matchId
        );
        setMatchMoods(data);
      } catch (error) {
        console.error("Error fetching fixture moods:", error);
      }
    };

    fetchMoods();
  }, [groupId, currentYear, matchId]);

  const timeElapsed = fixture?.fixture?.status?.elapsed || 0;

  const handleClick = async (mood, e) => {
    if (matchFinished) return;
    const rect = e.target.getBoundingClientRect();
    const parentRect = e.target.parentElement.getBoundingClientRect();
    const x = rect.left - parentRect.left + rect.width / 2;
    const y = rect.top - parentRect.top + rect.height / 2;

    const id = Date.now();
    setExplosions((prev) => [...prev, { id, emoji: mood.emoji, x, y }]);
    setTimeout(
      () => setExplosions((prev) => prev.filter((exp) => exp.id !== id)),
      800
    );

    await handleFixtureMood({
      groupId,
      currentYear,
      matchId,
      timeElapsed,
      moodKey: mood.label,
    });
  };

  return (
    <ContentContainer className=" MoodSelectorContainer containerMargin">
      {!matchFinished && (
        <div
          style={{
            display: "flex",
            gap: "15px",
            position: "relative",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {moods.map((mood) => (
            <span
              key={mood.label}
              onClick={(e) => handleClick(mood, e)}
              style={{
                fontSize: "30px",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
            >
              {mood.emoji}
            </span>
          ))}

          {explosions.map((exp) => {
            const randomX = Math.random() * 100 - 50;
            const randomY = Math.random() * -150;
            return (
              <span
                key={exp.id}
                style={{
                  position: "absolute",
                  fontSize: "20px",
                  pointerEvents: "none",
                  top: exp.y,
                  left: exp.x,
                  transform: "translate(-50%, -50%)",
                  animation: `explode-${exp.id} 0.8s forwards`,
                }}
              >
                {exp.emoji}
                <style>
                  {`
                  @keyframes explode-${exp.id} {
                    0% {
                      opacity: 1;
                      transform: translate(-50%, -50%) scale(1);
                    }
                    50% {
                      opacity: 1;
                      transform: translate(calc(-50% + ${randomX}px), ${randomY}px) scale(1.5);
                    }
                    100% {
                      opacity: 0;
                      transform: translate(calc(-50% + ${randomX}px), ${randomY}px) scale(0);
                    }
                  }
                `}
                </style>
              </span>
            );
          })}
        </div>
      )}
      {matchMoods && <MoodTimeline moodsData={matchMoods} />}
    </ContentContainer>
  );
};

const MAX_BAR_HEIGHT = 100;

const MoodTimeline = ({ moodsData }) => {
  const combineMoods = (start) => {
    const combined = {};
    for (let i = start; i < start + 5; i++) {
      const minuteMoods = moodsData[i] || {};
      for (let [mood, count] of Object.entries(minuteMoods)) {
        combined[mood] = (combined[mood] || 0) + count;
      }
    }
    return combined;
  };

  const intervals = [];
  for (let i = 1; i <= 90; i += 5)
    intervals.push({ start: i, moods: combineMoods(i) });

  const maxCount = Math.max(
    ...intervals.map(({ moods }) =>
      Object.values(moods).length ? Math.max(...Object.values(moods)) : 0
    )
  );

  return (
    <div className="mood-timeline">
      <h2 className="smallHeading">Mood Timeline </h2>
      <div className="mood-bars-container">
        {intervals.map(({ start, moods }) => {
          const entries = Object.entries(moods);
          if (!entries.length) return null;

          const [topMood, topCount] = entries.reduce((a, b) =>
            a[1] > b[1] ? a : b
          );
          const scaledHeight =
            maxCount > 0 ? (topCount / maxCount) * MAX_BAR_HEIGHT : 0;

          return (
            <div
              key={start}
              className="mood-bar"
              title={`Minutes ${start}-${start + 4}: ${topMood}`}
            >
              <span className="emoji">{MOOD_EMOJIS[topMood] || "❓"}</span>
              <div
                className="bar"
                style={{
                  height: `${scaledHeight}px`,
                  backgroundColor: MOOD_COLORS[topMood] || "#888",
                }}
              ></div>
              <span className="label">
                {start}-{start + 4}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mood-legend">
        {Object.entries(MOOD_COLORS).map(([mood, color]) => (
          <div key={mood} className="legend-item">
            <div className="color-box" style={{ backgroundColor: color }}></div>
            <span style={{ textTransform: "capitalize" }}>{mood}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;
