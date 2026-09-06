"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { parseQuantitativeChart } from "@/lib/quantitative-chart";

export function QuantitativeChartViewer({ source }: { source: string }) {
  const chart = parseQuantitativeChart(source);
  if (!chart) return <pre className="quantitative-chart-error">Gráfico indisponível: dados inválidos.</pre>;
  const Chart = chart.type === "bar" ? BarChart : LineChart;
  const series = chart.type === "bar" ? <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} /> : <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={3} dot />;
  return <figure className="quantitative-chart" aria-label={chart.description}><figcaption><strong>{chart.title}</strong><span>{chart.description}</span></figcaption><div className="quantitative-chart__canvas"><ResponsiveContainer width="100%" height="100%"><Chart data={chart.data} margin={{ top: 12, right: 20, bottom: 8, left: 0 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="label" label={{ value: chart.x_axis, position: "insideBottom", offset: -3 }} /><YAxis label={{ value: chart.y_axis, angle: -90, position: "insideLeft" }} /><Tooltip />{series}</Chart></ResponsiveContainer></div></figure>;
}
