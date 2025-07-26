"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { financialData } from "@/lib/mock-data";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  value: {
    label: "Net Worth",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function NetWorthChart() {
  const chartData = financialData.netWorthHistory;
  
  const years = useMemo(() => {
    return [...new Set(chartData.map((item) => item.year))].sort((a, b) => b - a);
  }, [chartData]);
  
  const [selectedYear, setSelectedYear] = useState(years[0]);

  const filteredData = useMemo(() => {
    return chartData.filter((item) => item.year === selectedYear);
  }, [chartData, selectedYear]);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Net Worth Growth</CardTitle>
                <CardDescription>
                  Your net worth trend for {selectedYear}.
                </CardDescription>
            </div>
            <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                    {years.map(year => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <AreaChart
            accessibilityLayer
            data={filteredData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${Number(value) / 100000}L`}
            />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => (
                    <div className="flex flex-col">
                      <span className="font-bold">{item.payload.month} {item.payload.year}</span>
                      <span>₹{Number(value).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                />
              }
            />
             <defs>
              <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-value)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-value)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="value"
              type="monotone"
              fill="url(#fillValue)"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={{
                r: 4,
                strokeWidth: 2,
                fill: 'hsl(var(--background))'
              }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                fill: 'hsl(var(--background))'
              }}
              animationDuration={1500}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
