"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGngStore } from "@/hooks/use-gng-store"

type Line = { productId: string; quantity: number }

type Props = {
  onDone?: () => void
}

export function SaleForm({ onDone }: Props) {
  const { state, recordSale } = useGngStore()
  const [lines, setLines] = useState<Line[]>([
    state.products[0] ? { productId: state.products[0].id, quantity: 1 } : { productId: "", quantity: 1 },
  ])
  const [error, setError] = useState<string | null>(null)

  // INR formatter
  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n)

  function setLine(idx: number, next: Line) {
    setLines((prev) => prev.map((l, i) => (i === idx ? next : l)))
  }

  function addLine() {
    setLines((prev) => [...prev, { productId: state.products[0]?.id ?? "", quantity: 1 }])
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx))
  }

  const totals = lines.reduce(
    (acc, l) => {
      const p = state.products.find((p) => p.id === l.productId)
      if (p) {
        acc.revenue += p.unitPrice * (l.quantity || 0)
        acc.cost += p.unitCost * (l.quantity || 0)
      }
      return acc
    },
    { revenue: 0, cost: 0 },
  )

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const cleaned = lines.filter((l) => l.productId && l.quantity > 0)
      if (!cleaned.length) throw new Error("Add at least one product")
      recordSale(cleaned)
      onDone?.()
    } catch (err: any) {
      setError(err?.message || "Failed to record sale")
    }
  }

  return (
    <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-lg dark:text-white">Record Sale</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-3">
            {lines.map((line, idx) => {
              const prod = state.products.find((p) => p.id === line.productId)
              return (
                <div key={idx} className="grid grid-cols-12 gap-3">
                  <div className="col-span-7">
                    <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Product</label>
                    <select
                      className="w-full border rounded-md h-9 px-3 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                      value={line.productId}
                      onChange={(e) => setLine(idx, { ...line, productId: e.target.value })}
                    >
                      {state.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.inventory})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Qty</label>
                    <Input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => setLine(idx, { ...line, quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-2 flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => removeLine(idx)}
                    >
                      Remove
                    </Button>
                  </div>
                  {prod ? (
                    <div className="col-span-12 text-xs text-gray-500 dark:text-gray-400">
                      {formatINR(prod.unitPrice)} price • {formatINR(prod.unitCost)} cost • Stock: {prod.inventory}
                    </div>
                  ) : null}
                </div>
              )
            })}
            <Button type="button" variant="outline" onClick={addLine}>
              + Add Product
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Revenue: <span className="font-medium text-gray-900 dark:text-white">{formatINR(totals.revenue)}</span> •
              Cost: <span className="font-medium text-gray-900 dark:text-white">{formatINR(totals.cost)}</span> •
              Profit:{" "}
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatINR(totals.revenue - totals.cost)}
              </span>
            </div>
            <div className="flex gap-2">
              {onDone && (
                <Button type="button" variant="outline" onClick={onDone}>
                  Cancel
                </Button>
              )}
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                Save Sale
              </Button>
            </div>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </form>
      </CardContent>
    </Card>
  )
}
