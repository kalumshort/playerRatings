import React from "react";

import { ContentContainer } from "../../../Containers/GlobalContainer";

export default function Statistics({ fixture }) {
  if (!fixture.statistics) {
    return (
      <ContentContainer
        className="statistics-container"
        style={{
          minHeight: "200px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "0px",
        }}
      >
        <h2 className="heading2" style={{ margin: "10px" }}>
          No Statistics
        </h2>
      </ContentContainer>
    );
  }

  const [team1, team2] = fixture?.statistics;
  if (!team1 || !team2) {
    return;
  }
  return (
    <ContentContainer className="statistics-container containerMargin">
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div style={{ flex: 1, textAlign: "center" }}>
            <img
              src={team1.team.logo}
              alt={team1.team.name}
              style={{ width: "50px" }}
            />
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <h2 className="heading2">Statistics</h2>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <img
              src={team2.team.logo}
              alt={team2.team.name}
              style={{ width: "50px" }}
            />
          </div>
        </div>
        <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
          {team1.statistics.map((stat, index) => {
            const team2Stat = team2.statistics.find(
              (s) => s.type === stat.type
            );

            const team1Value = stat.value ?? 0;
            const team2Value = team2Stat?.value ?? 0;
            const total = team1Value + team2Value;

            // Calculate percentage
            const team1Percentage = total > 0 ? (team1Value / total) * 100 : 50;
            {
              /* const team2Percentage = 100 - team1Percentage; */
            }

            return (
              <li
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  margin: "8px 0",
                  padding: "6px",
                  background: `linear-gradient(
            to right,
            rgba(65, 65, 65, 0.6) ${team1Percentage}%,
            rgba(0, 0, 0, 0.22) ${team1Percentage}%
          )`,
                }}
              >
                <div
                  style={{ flex: 1, textAlign: "center", fontWeight: "bold" }}
                >
                  {team1Value}
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>{stat.type}</div>
                <div
                  style={{ flex: 1, textAlign: "center", fontWeight: "bold" }}
                >
                  {team2Value}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </ContentContainer>
  );
}
