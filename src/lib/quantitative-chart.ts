import { z } from "zod";

const ChartPointSchema = z.object({ label: z.string().min(1).max(80), value: z.number().finite() });

export const QuantitativeChartSchema = z.object({
  type: z.enum(["bar", "line"]),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  x_axis: z.string().min(1).max(80),
  y_axis: z.string().min(1).max(80),
  data: z.array(ChartPointSchema).min(2).max(24),
}).strict();

export type QuantitativeChart = z.infer<typeof QuantitativeChartSchema>;

export function parseQuantitativeChart(source: string): QuantitativeChart | null {
  if (source.length > 8_000) return null;
  try { return QuantitativeChartSchema.parse(JSON.parse(source)); } catch { return null; }
}
