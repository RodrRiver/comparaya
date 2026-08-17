"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PricePoint {
  date: string;
  price: number;
  store: string;
}

const COLORS = [
  "hsl(255, 70%, 55%)",
  "hsl(55, 70%, 50%)",
  "hsl(150, 50%, 45%)",
  "hsl(330, 60%, 55%)",
  "hsl(200, 60%, 50%)",
  "hsl(30, 70%, 55%)",
  "hsl(0, 60%, 55%)",
];

export function PriceChart({ data }: { data: PricePoint[] }) {
  const stores = [...new Set(data.map((d) => d.store))];
  const dates = [...new Set(data.map((d) => d.date))].sort();

  const chartData = dates.map((date) => {
    const point: Record<string, string | number> = { date };
    for (const store of stores) {
      const entry = data.find((d) => d.date === date && d.store === store);
      if (entry) point[store] = entry.price;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => {
            const d = new Date(v + "T00:00:00");
            return d.toLocaleDateString("es-SV", { month: "short", day: "numeric" });
          }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `$${v}`}
          domain={["dataMin - 50", "dataMax + 50"]}
        />
        <Tooltip
          formatter={(value: unknown) => [`$${Number(value).toFixed(2)}`, ""]}
          labelFormatter={(label: unknown) => {
            const d = new Date(String(label) + "T00:00:00");
            return d.toLocaleDateString("es-SV", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          }}
        />
        <Legend />
        {stores.map((store, i) => (
          <Line
            key={store}
            type="monotone"
            dataKey={store}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
