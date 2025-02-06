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
      <div style={{ color: "#fff", fontFamily: "Arial, sans-serif" }}>
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
            return (
              <li
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  margin: "8px 0",
                  padding: "6px",
                  borderBottom: "2px solid #282828",
                }}
              >
                <div style={{ flex: 1, textAlign: "center" }}>
                  {stat.value ?? "N/A"}
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>{stat.type}</div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  {team2Stat?.value ?? "N/A"}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </ContentContainer>
  );
}
