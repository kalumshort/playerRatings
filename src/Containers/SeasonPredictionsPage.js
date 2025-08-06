import React, { useEffect, useState } from "react";
import { ContentContainer, InnerContent } from "./GlobalContainer";
import { Button, ButtonGroup, MenuItem, Select } from "@mui/material";
import PlayersSelect from "../Components/Widgets/PlayersSelect";
import {
  firebaseGetCollecion,
  firebaseGetDocument,
  handleSeasonPredictions,
} from "../Firebase/Firebase";
import useGroupData from "../Hooks/useGroupsData";
import { useAuth } from "../Providers/AuthContext";
import useGlobalData from "../Hooks/useGlobalData";

import { useSelector } from "react-redux";
import { selectSquadDataObject } from "../Selectors/squadDataSelectors";
import { Spinner } from "./Helpers";

// OPTIONS
const selectOptions = {
  totalPoints: [
    "0-10",
    "11-20",
    "21-30",
    "31-40",
    "41-50",
    "51-60",
    "61-70",
    "71-80",
    "81-90",
    "91-100",
    "100+",
  ],
  totalGoalsScored: [
    "0-10",
    "11-20",
    "21-30",
    "31-40",
    "41-50",
    "51-60",
    "61-70",
    "71-80",
    "81-90",
    "91-100",
    "100+",
  ],
  totalGoalsConceded: [
    "0-10",
    "11-20",
    "21-30",
    "31-40",
    "41-50",
    "51-60",
    "61-70",
    "71-80",
    "81-90",
    "91-100",
    "100+",
  ],
  furthestCupRound: [
    "Group Stage",
    "Third Round",
    "Fourth Round",
    "Fifth Round",
    "Quarter-Finals",
    "Semi-Finals",
    "Final",
    "Winners",
  ],
  fastestGoalMinute: [
    ...Array.from({ length: 10 }, (_, i) => `${i + 1}'`),
    "11+ min",
  ],
  longestUnbeatenRun: [
    ...Array.from({ length: 11 }, (_, i) => `${i + 1}`),
    "12+",
  ],
  biggestWinScoreline: [
    "1-0",
    "2-0",
    "3-0",
    "3-1",
    "4-0",
    "4-1",
    "4-2",
    "5-0",
    "5-1",
    "5-2",
    "5-3",
    "6-0",
    "6-1",
    "6-2",
    "7-0",
    "7-1",
    "Other",
  ],
  gamesWith3PlusGoals: [...Array.from({ length: 13 }, (_, i) => `${i}`), "13+"],
};
const buttonOptions = {
  qualifyEurope: ["Yes", "No"],
  winTrophy: ["Yes", "No"],
};

// QUESTION CONFIGS
const achievementQuestions = [
  {
    key: "leaguePosition",
    label: "League Position",
    type: "select",
    options: Array.from({ length: 20 }, (_, i) => `${i + 1}`),
  },
  {
    key: "totalPoints",
    label: "Total Points Earned",
    type: "select",
    options: selectOptions.totalPoints,
  },
  {
    key: "furthestCupRound",
    label: "Furthest round reached in domestic cup(s)",
    type: "select",
    options: selectOptions.furthestCupRound,
  },
  {
    key: "qualifyEurope",
    label: "Will the team qualify for Europe?",
    type: "buttonGroup",
    options: buttonOptions.qualifyEurope,
  },
  {
    key: "winTrophy",
    label: "Will the team win any trophies?",
    type: "buttonGroup",
    options: buttonOptions.winTrophy,
  },
];

const goalsQuestions = [
  {
    key: "totalGoalsScored",
    label: "Total goals scored in the league",
    type: "select",
    options: selectOptions.totalGoalsScored,
  },
  {
    key: "totalGoalsConceded",
    label: "Total goals conceded in the league",
    type: "select",
    options: selectOptions.totalGoalsConceded,
  },
  {
    key: "topScorer",
    label: "Top scorer",
    type: "player",
  },
  {
    key: "mostAssists",
    label: "Most Assists",
    type: "player",
  },
];

const funQuestions = [
  {
    key: "fastestGoalMinute",
    label: "Fastest goal scored (minute)",
    type: "select",
    options: selectOptions.fastestGoalMinute,
  },
  {
    key: "longestUnbeatenRun",
    label: "Longest unbeaten run (matches)",
    type: "select",
    options: selectOptions.longestUnbeatenRun,
  },
  {
    key: "biggestWinScoreline",
    label: "Biggest win (scoreline)",
    type: "select",
    options: selectOptions.biggestWinScoreline,
  },
  {
    key: "gamesWith3PlusGoals",
    label: "Games with 3+ goals scored",
    type: "select",
    options: selectOptions.gamesWith3PlusGoals,
  },
];

const playerQuestions = [
  {
    key: "playerOfSeason",
    label: "Player of the Season",
    type: "player",
  },
  {
    key: "mostYellowCards",
    label: "Most Yellow Cards",
    type: "player",
  },
  {
    key: "mostRedCards",
    label: "Most Red Cards",
    type: "player",
  },
];

// STYLES
const innerStyle = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
};

// GENERIC FIELD RENDERERS
const renderSelect = (q, predictions, handleChange) => (
  <InnerContent style={innerStyle} key={q.key}>
    <h2 className="subHeadingGlobal">{q.label}</h2>
    <Select
      value={predictions[q.key] || ""}
      onChange={(e) => handleChange(q.key, e.target.value)}
    >
      {q.options.map((opt) => (
        <MenuItem key={opt} value={opt}>
          {opt}
        </MenuItem>
      ))}
    </Select>
  </InnerContent>
);

const renderButtonGroup = (q, predictions, handleChange) => (
  <InnerContent style={innerStyle} key={q.key}>
    <h2 className="subHeadingGlobal">{q.label}</h2>
    <ButtonGroup>
      {q.options.map((option) => (
        <Button
          key={option}
          variant={predictions[q.key] === option ? "contained" : "outlined"}
          onClick={() => handleChange(q.key, option)}
        >
          {option}
        </Button>
      ))}
    </ButtonGroup>
  </InnerContent>
);

const renderPlayer = (q, handleChange) => (
  <InnerContent style={innerStyle} key={q.key}>
    <h2 className="subHeadingGlobal">{q.label}</h2>
    <PlayersSelect
      onChange={(e) => handleChange(q.key, e.target.value)}
      showAvatar={false}
    />
  </InnerContent>
);
// Helper section renderer
const Section = ({ title, children }) => (
  <ContentContainer style={{ padding: "10px", marginBottom: "20px" }}>
    <h2 className="globalHeading">{title}</h2>
    {children}
  </ContentContainer>
);

// Helper for showing a chart for each question
// const ResultsBar = ({ question, data }) => {
//   const totalSubmits = data.totalSubmits || 0;
//   const barchartData = question.options.map((option) => ({
//     name: option,
//     value: data[option] || 0,
//   }));
//   return (
//     <InnerContent
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "flex-start",
//         marginBottom: "24px",
//       }}
//     >
//       <div className="subHeadingGlobal" style={{ marginBottom: 8 }}>
//         {question.label}
//       </div>
//       <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
//         <Barchart barchartData={barchartData} height={220} width="100%" />
//         <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
//           {question.options
//             .map((option) => {
//               const count = data[option] || 0;
//               const percent =
//                 totalSubmits > 0
//                   ? ((count / totalSubmits) * 100).toFixed(1)
//                   : "0.0";
//               return { option, count, percent };
//             })
//             .filter(({ count }) => count > 0)
//             .map(({ option, count, percent }) => (
//               <li
//                 key={option}
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   fontSize: 16,
//                   padding: "4px 0",
//                   borderBottom: "1px solid #474747ff",
//                   gap: "8px",
//                 }}
//               >
//                 <span>
//                   {option}
//                   {option === "Winners" && " 🏆"}
//                 </span>

//                 <span>{percent}%</span>
//               </li>
//             ))}
//         </ul>
//       </div>

//       {totalSubmits === 0 && (
//         <div style={{ color: "#999", fontStyle: "italic" }}>
//           No submissions yet
//         </div>
//       )}
//     </InnerContent>
//   );
// };
// const ButtonGroupResultBar = ({ question, data }) => {
//   const totalSubmits = data.totalSubmits || 0;
//   const counts = question.options.map((option) => data[option] || 0);
//   const percents = counts.map((count) =>
//     totalSubmits > 0 ? (count / totalSubmits) * 100 : 0
//   );

//   // Two colors for the two options, you can customize them
//   const colors = ["#4e73df", "#9b59b6"];
//   const gradient = `linear-gradient(
//     to right,
//     ${colors[0]} 0%,
//     ${colors[0]} ${percents[0]}%,
//     ${colors[1]} ${percents[0]}%,
//     ${colors[1]} 100%
//   )`;

//   return (
//     <InnerContent
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "flex-start",
//         marginBottom: "24px",
//       }}
//     >
//       <div className="subHeadingGlobal" style={{ marginBottom: 8 }}>
//         {question.label}
//       </div>
//       <div
//         style={{
//           width: "100%",
//           height: 40,
//           borderRadius: 12,
//           background: gradient,
//           display: "flex",
//           alignItems: "center",
//           position: "relative",
//           boxShadow: "0 2px 10px #0001",
//           overflow: "hidden",
//         }}
//       >
//         {question.options.map((option, i) =>
//           percents[i] > 0 ? (
//             <div
//               key={option}
//               style={{
//                 position: "absolute",
//                 left: i === 0 ? 8 : undefined,
//                 right: i === 1 ? 8 : undefined,
//                 color: "#fff",
//                 fontWeight: 700,
//                 textShadow: "0 1px 3px #0005",
//                 fontSize: 18,
//                 top: "50%",
//                 transform: "translateY(-50%)",
//               }}
//             >
//               {option}: {percents[i].toFixed(1)}%
//             </div>
//           ) : null
//         )}
//       </div>
//       <div style={{ fontSize: 14, color: "#999", marginTop: 4 }}>
//         {counts[0]} {question.options[0]} / {counts[1]} {question.options[1]}
//       </div>
//     </InnerContent>
//   );
// };

const SelectPercentBar = ({ question, data }) => {
  const [activeOption, setActiveOption] = useState(null);

  const totalSubmits = data.totalSubmits || 0;
  const green = "#85e89d";
  const otherColors = ["#ffc285", "#ffb3b3", "#ffd6a5", "#ffabab", "#ff8c8c"];

  const sortedSegments = question.options
    .map((option) => {
      const count = data[option] || 0;
      const percent = totalSubmits > 0 ? (count / totalSubmits) * 100 : 0;
      return { option, count, percent };
    })
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count);

  const segments = sortedSegments.map((seg, i) => ({
    ...seg,
    color: i === 0 ? green : otherColors[(i - 1) % otherColors.length],
  }));

  if (!totalSubmits) {
    return (
      <InnerContent style={{ marginBottom: 24 }}>
        <div className="subHeadingGlobal" style={{ marginBottom: 8 }}>
          {question.label}
        </div>
        <div style={{ color: "#999", fontStyle: "italic" }}>
          No submissions yet
        </div>
      </InnerContent>
    );
  }

  const handleBarClick = (option, e) => {
    e.stopPropagation();
    setActiveOption((prev) => (prev === option ? null : option));
  };

  // Clicking anywhere in the question content (not a bar) clears selection
  const handleClearSelection = () => setActiveOption(null);

  const activeData = segments.find((seg) => seg.option === activeOption);

  return (
    <div onClick={handleClearSelection} style={{ width: "100%" }}>
      <InnerContent
        style={{
          flexDirection: "column",
          alignItems: "flex-start",
          marginBottom: "24px",
        }}
      >
        <div className="subHeadingGlobal" style={{ marginBottom: 8 }}>
          {question.label}
        </div>
        <div
          style={{
            display: "flex",
            height: 38,
            width: "100%",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 2px 10px #0001",
            cursor: "pointer",
            position: "relative",
          }}
        >
          {segments.map(({ option, percent, color }) => (
            <div
              key={option}
              style={{
                width: `${percent}%`,
                background: color,
                height: "100%",
                display: percent > 0 ? "block" : "none",
                border: activeOption === option ? "2px solid #222" : undefined,
                boxSizing: "border-box",
                transition: "width 0.5s, border 0.2s",
                cursor: "pointer",
              }}
              onClick={(e) => handleBarClick(option, e)}
              title={`Click to show percentage for "${option}"`}
              aria-label={`Show percentage for ${option}`}
            />
          ))}
        </div>
        {activeData && (
          <div
            style={{
              margin: "10px 0 0 0",
              padding: "7px 15px",
              background: "#fafcff",
              border: `2px solid ${activeData.color}`,
              borderRadius: 7,
              fontWeight: 600,
              fontSize: 16,
              color: "#333",
              boxShadow: "0 2px 7px #0001",
              alignSelf: "flex-start",
              transition: "border 0.2s",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                borderRadius: 3,
                marginRight: 8,
                background: activeData.color,
                border: "1px solid #e2e2e2",
                verticalAlign: "middle",
              }}
            />
            {activeData.option}: <b>{activeData.percent.toFixed(1)}%</b> (
            {activeData.count} vote{activeData.count !== 1 ? "s" : ""})
          </div>
        )}
        <ul
          style={{
            margin: "8px 0 0 0",
            padding: 0,
            listStyle: "none",
            fontSize: 15,
          }}
        >
          {segments.map(({ option, count, percent, color }) => (
            <li
              key={option}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 2,
                background:
                  activeOption === option
                    ? "rgba(133,232,157,0.13)"
                    : undefined,
                borderRadius: 4,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  marginRight: 8,
                  background: color,
                  border: "1px solid #e2e2e2",
                }}
              />
              <span
                style={{
                  marginRight: 8,
                  fontWeight: activeOption === option ? 700 : 400,
                }}
              >
                {option}
              </span>
              <span style={{ color: "#666" }}>
                {count} ({percent.toFixed(1)}%)
              </span>
            </li>
          ))}
        </ul>
      </InnerContent>
    </div>
  );
};

// This takes the Firestore data object for the question (e.g., results["topScorer"])
const PlayerPodium = ({ question, data }) => {
  const squadData = useSelector(selectSquadDataObject);

  // Remove non-player fields (e.g., totalSubmits, id) and build array
  const playerCounts = Object.entries(data || {})
    .filter(([playerId]) => playerId !== "id" && playerId !== "totalSubmits")
    .map(([playerId, count]) => ({
      playerId,
      count: typeof count === "number" ? count : 0,
      ...squadData[playerId],
    }))
    .filter((player) => player.name) // skip missing players
    .sort((a, b) => b.count - a.count);
  console.log(playerCounts);
  // Take top 3
  const podium = [
    playerCounts[2], // Third place (left)
    playerCounts[0], // First place (center)
    playerCounts[1], // Second place (right)
  ].filter(Boolean);

  if (playerCounts.length === 0) {
    return (
      <InnerContent>
        <div className="subHeadingGlobal" style={{ marginBottom: 8 }}>
          {question.label}
        </div>
        <div style={{ color: "#999", fontStyle: "italic" }}>No votes yet</div>
      </InnerContent>
    );
  }

  return (
    <InnerContent
      style={{
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 24,
      }}
    >
      <div className="subHeadingGlobal" style={{ marginBottom: 8 }}>
        {question.label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 18,
        }}
      >
        {/* Podium: left (3rd), center (1st), right (2nd) */}
        {podium.map((player, idx) => {
          // Size for podiums: 2nd/3rd: 64px, 1st: 90px
          const isFirst = idx === 1;
          const sizes = {
            img: isFirst ? 90 : 64,
            box: isFirst ? 60 : 36,
            font: isFirst ? 18 : 15,
          };
          // Medal color: 1st gold, 2nd silver, 3rd bronze
          const medalColors = ["#cd7f32", "#ffd700", "#c0c0c0"];
          const podiumText = ["3rd", "1st", "2nd"];
          const color = medalColors[idx];

          return (
            <div key={player.playerId} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: sizes.img,
                  height: sizes.img,
                  borderRadius: "50%",
                  margin: "0 auto 8px auto",
                  border: `3px solid ${color}`,
                  overflow: "hidden",
                  background: "#f5f5f5",
                  boxShadow: isFirst ? "0 2px 10px #ffe58f" : "0 2px 8px #ccc",
                }}
              >
                <img
                  src={player.photo}
                  alt={player.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div
                style={{ fontWeight: 700, fontSize: sizes.font, color: color }}
              >
                {player.name}
              </div>
              <div style={{ color: "#666", fontSize: 14, marginTop: 2 }}>
                {podiumText[idx]} • {player.count} vote
                {player.count !== 1 ? "s" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </InnerContent>
  );
};

const SeasonPredictions = ({ setUserSubmission }) => {
  const [predictions, setPredictions] = React.useState({});
  const { activeGroup } = useGroupData();
  const { user } = useAuth();
  const globalData = useGlobalData();
  const handlePredictionChange = (key, value) => {
    setPredictions((prev) => ({ ...prev, [key]: value }));
  };
  const handleSeasonPredictionsSubmit = async () => {
    // Handle submit logic here, e.g., save predictions to a database

    await handleSeasonPredictions({
      predictions: predictions,
      groupId: activeGroup.groupId,
      userId: user.uid,
      currentYear: globalData.currentYear,
    });
    setUserSubmission(predictions);
  };
  const requiredKeys = [
    ...achievementQuestions.map((q) => q.key),
    ...goalsQuestions.map((q) => q.key),
    ...playerQuestions.map((q) => q.key),
    ...funQuestions.map((q) => q.key),
  ];
  return (
    <div className="containerMargin">
      <div style={{ padding: "10px", marginBottom: "20px" }}>
        <h2 className="globalHeading">Season Predictions</h2>
      </div>
      <ContentContainer style={{ padding: "10px", marginBottom: "20px" }}>
        <h2 className="globalHeading">Team Achievements</h2>
        {achievementQuestions.map((q) =>
          q.type === "select"
            ? renderSelect(q, predictions, handlePredictionChange)
            : renderButtonGroup(q, predictions, handlePredictionChange)
        )}
      </ContentContainer>
      <ContentContainer style={{ padding: "10px", marginBottom: "20px" }}>
        <h2 className="globalHeading">Goals & Scoring</h2>
        {goalsQuestions.map((q) =>
          q.type === "select"
            ? renderSelect(q, predictions, handlePredictionChange)
            : renderPlayer(q, handlePredictionChange)
        )}
      </ContentContainer>
      <ContentContainer style={{ padding: "10px", marginBottom: "20px" }}>
        <h2 className="globalHeading">Players & Stats</h2>
        {playerQuestions.map((q) => renderPlayer(q, handlePredictionChange))}
      </ContentContainer>
      <ContentContainer style={{ padding: "10px", marginBottom: "20px" }}>
        <h2 className="globalHeading">Fun/Novelty Predictions</h2>
        {funQuestions.map((q) =>
          renderSelect(q, predictions, handlePredictionChange)
        )}
      </ContentContainer>
      <Button
        variant="contained"
        color="primary"
        disabled={
          !requiredKeys.every(
            (key) => predictions[key] && predictions[key] !== ""
          )
        }
        onClick={() => handleSeasonPredictionsSubmit()}
        style={{ margin: "24px auto 0", display: "block" }}
      >
        Submit Predictions
      </Button>
    </div>
  );
};
const SeasonPredictionsResults = () => {
  const { activeGroup } = useGroupData();
  const globalData = useGlobalData();

  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  // You can move these config imports outside this file if you want
  // But for now, just use the ones already in this file (as you requested!)
  // achievementQuestions, goalsQuestions, funQuestions

  useEffect(() => {
    if (!activeGroup?.groupId || !globalData?.currentYear) {
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      const data = await firebaseGetCollecion(
        `groups/${activeGroup.groupId}/seasons/${globalData.currentYear}/seasonPredictions`
      );
      setResults(data);
      setLoading(false);
    };

    fetchResults();
  }, [activeGroup?.groupId, globalData?.currentYear]);

  if (loading) return <Spinner />;

  // Helper to render a section with bar charts for a group of questions
  const renderSection = (sectionTitle, questions) => (
    <Section title={sectionTitle}>
      {questions.map((q) =>
        q.type === "select" ? (
          <SelectPercentBar
            key={q.key}
            question={q}
            data={results[q.key] || {}}
          />
        ) : q.type === "buttonGroup" ? (
          <SelectPercentBar
            key={q.key}
            question={q}
            data={results[q.key] || {}}
          />
        ) : q.type === "player" ? (
          <PlayerPodium key={q.key} question={q} data={results[q.key] || {}} />
        ) : null
      )}
    </Section>
  );

  return (
    <div className="containerMargin">
      <div style={{ padding: "10px", marginBottom: "20px" }}>
        <h2 className="globalHeading">Season Predictions Results</h2>
      </div>
      {renderSection("Team Achievements", achievementQuestions)}
      {renderSection("Goals & Scoring", goalsQuestions)}
      {renderSection("Players & Stats", playerQuestions)}
      {renderSection("Fun/Novelty Predictions", funQuestions)}

      {/* Player questions not shown in bar chart here, can add custom render for those if you wish */}
    </div>
  );
};
export default function SeasonPredictionsPage() {
  const { user } = useAuth();
  const { activeGroup } = useGroupData();
  const globalData = useGlobalData();

  const [userSubmission, setUserSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !activeGroup?.groupId || !globalData?.currentYear) {
      setLoading(false);
      return;
    }

    const fetchUserPredictions = async () => {
      setLoading(true);
      const docData = await firebaseGetDocument(
        `users/${user.uid}/groups/${activeGroup.groupId}/seasons`,
        globalData.currentYear.toString()
      );
      if (docData && docData.seasonPredictions) {
        setUserSubmission(docData.seasonPredictions);
      }
      setLoading(false);
    };

    fetchUserPredictions();
  }, [user, activeGroup?.groupId, globalData?.currentYear]);

  if (loading) return <Spinner />;

  return userSubmission ? (
    <SeasonPredictionsResults />
  ) : (
    <SeasonPredictions
      userSubmission={userSubmission}
      setUserSubmission={setUserSubmission}
    />
  );
}
