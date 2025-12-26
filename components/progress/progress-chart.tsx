"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ProgressChartProps {
  new: number;
  learning: number;
  known: number;
  notStarted: number;
}

export function ProgressChart({ new: newCount, learning, known, notStarted }: ProgressChartProps) {
  const data = [
    { name: "Not Started", value: notStarted, color: "hsl(var(--muted))" },
    { name: "New", value: newCount, color: "hsl(var(--primary))" },
    { name: "Learning", value: learning, color: "hsl(var(--chart-2))" },
    { name: "Known", value: known, color: "hsl(var(--chart-3))" },
  ].filter((item) => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Distribution</CardTitle>
        <CardDescription>Breakdown of your flashcard progress</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
