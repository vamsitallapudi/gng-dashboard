"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type DonutProps = {
  title: string
  subtitle?: string
  color?: string // tailwind hex or hsl
  value: number
  capacity?: number
}

export function InventoryDonut({ title, subtitle, color = "#f59e0b", value, capacity = 200 }: DonutProps) {
  const inStock = Math.max(0, Math.min(value, capacity))
  const completed = Math.max(0, capacity - inStock)
  const data = [
    { name: "Available", value: inStock },
    { name: "Completed", value: completed },
  ]

  // Blue and red color palette - blue for available, red for completed
  const COLORS = ["#3b82f6", "#ef4444"] // blue for available, red for completed

  const total = Math.max(1, inStock + completed)
  const availablePct = inStock / total
  const availableAngle = 360 * availablePct
  const desiredCenterLeft = 180 // 180° = left
  const startAngle = desiredCenterLeft + availableAngle / 2
  const endAngle = startAngle - 360

  return (
    <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold dark:text-white">{title}</CardTitle>
        {subtitle ? <CardDescription className="dark:text-gray-400">{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                startAngle={startAngle}
                endAngle={endAngle}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div
            className="absolute inset-0 flex items-center justify-center"
            aria-label={`${title} inventory left: ${inStock}`}
          >
            <div className="text-center">
              <div className="text-3xl font-semibold text-gray-900 dark:text-white">{inStock}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">left</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
