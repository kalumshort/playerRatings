import React from "react";
import { useSelector } from "react-redux";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { selectFixturesState } from "../../Selectors/fixturesSelectors";
export default function PlayerRatingsLineGraph({ allPlayerRatings }) {
  const chartData = Object.values(allPlayerRatings.matches).map(
    (entry, index) => ({
      name: `Match ${index + 1}`,
      avgRating: +(entry.totalRating / entry.totalSubmits).toFixed(2),
      id: entry.id,
    })
  );

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: -15, bottom: 5 }}
      >
        {/* <CartesianGrid strokeDasharray="5 5" /> */}
        <XAxis />
        <YAxis domain={[0, 10]} />
        <Tooltip content={<CustomTooltip />} />

        <Line
          type="monotone"
          dataKey="avgRating"
          stroke="#c61717ff"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

const CustomTooltip = ({ active, payload }) => {
  const allFixtures = useSelector(selectFixturesState).fixtures;

  if (active && payload && payload.length) {
    const matchId = payload[0].payload.id;
    const match = allFixtures.find((f) => f.id === matchId);
    if (!match) return null;

    const matchDate = new Date(match.fixture.date);

    const formattedDate = matchDate.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const { home, away } = match.teams;
    const { home: homeGoals, away: awayGoals } = match.goals || {};

    return (
      <div
        style={{
          background: "#222",
          padding: "6px",
          borderRadius: "8px",
          color: "#fff",
          maxWidth: 280,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* <p style={{ marginBottom: 8 }}>
          <strong>{label}</strong>
        </p> */}
        <p style={{ fontSize: 12, margin: 0 }}>{formattedDate} </p>

        <div style={{ display: "flex", alignItems: "center", margin: "8px 0" }}>
          <img
            src={home.logo}
            alt={home.name}
            style={{ width: 24, height: 24, marginRight: 8 }}
          />
          {/* <span style={{ fontWeight: home.winner ? "bold" : "normal" }}>
            {home.name}
          </span> */}
          <span style={{ margin: "0 6px" }}>
            <strong>
              {homeGoals} - {awayGoals}
            </strong>
          </span>
          {/* <span style={{ fontWeight: away.winner ? "bold" : "normal" }}>
            {away.name}
          </span> */}
          <img
            src={away.logo}
            alt={away.name}
            style={{ width: 24, height: 24, marginLeft: 8 }}
          />
        </div>
        <p style={{ fontSize: 25, margin: 5 }}>
          <strong>{payload[0].value}</strong>
        </p>
        {/* <p style={{ fontSize: "0.85rem", marginTop: 6 }}>
          📅 {format(new Date(date), "dd MMM yyyy, HH:mm")} UTC
        </p> */}
        {/* <p style={{ fontSize: "0.85rem" }}>
          🏟 {venue.name}, {venue.city}
        </p> */}
      </div>
    );
  }

  return null;
};
