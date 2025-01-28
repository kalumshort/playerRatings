import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Barchart = ({
  barchartData,
  height = 220,
  width = 300,
  withLegend = false,
  withGrid = false,
}) => {
  return (
    <ResponsiveContainer width={width} height={height}>
      <BarChart data={barchartData} className="barChart">
        {withGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="name" />

        {withLegend && <Legend />}

        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4e73df" />
            <stop offset="100%" stopColor="#9b59b6" />
          </linearGradient>
        </defs>
        <Bar dataKey="value" fill="url(#gradient1)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default Barchart;
