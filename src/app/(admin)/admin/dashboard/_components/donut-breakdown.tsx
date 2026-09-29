"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  fillClassName: string;
  dotClassName: string;
}

interface Props {
  slices: DonutSlice[];
  emptyLabel: string;
}

export function DonutBreakdown({ slices, emptyLabel }: Props) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const data = slices.map((s) => ({ name: s.key, value: s.value }));

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-32 w-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="65%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.key} className={s.fillClassName} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-foreground">{total}</span>
          <span className="text-[10px] text-muted-foreground">total</span>
        </div>
      </div>

      <ul className="flex-1 space-y-2.5">
        {slices.map((s) => {
          const pct = Math.round((s.value / total) * 100);
          return (
            <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-foreground">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", s.dotClassName)} />
                {s.label}
              </span>
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{s.value}</span> · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
