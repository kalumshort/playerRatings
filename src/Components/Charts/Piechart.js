import React from "react";

import { PieChart, Pie, Cell, Tooltip } from "recharts";

export default function Piechart({
  chartData,
  width = 300,
  height = 300,
  outerRadius,
}) {
  const data = Object.entries(chartData).map(([score, count]) => ({
    name: score,
    value: count,
  }));

  return (
    <PieChart width={width} height={height} className="pieChart">
      {/* Defining the linear gradient */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4e73df" />
          <stop offset="100%" stopColor="#9b59b6" />
        </linearGradient>
      </defs>

      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={outerRadius}
        fill="url(#gradient1)" // Applying the gradient here
        label={(entry) => `${entry.name}`}
        className="pieChartScorePredictions"
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  );
}
