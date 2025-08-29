"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGngStore, type Product } from "@/hooks/use-gng-store"

type Props = {
  defaultProductId?: string
  onDone?: () => void
}

export function InventoryForm({ defaultProductId, onDone }: Props) {
  const { state, upsertProduct, addInventory } = useGngStore()
  const [mode, setMode] = useState<"existing" | "new">(defaultProductId ? "existing" : "new")
  const [productId, setProductId] = useState(defaultProductId || (state.products[0]?.id ?? ""))
  const [qty, setQty] = useState<number>(0)
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [unitPrice, setUnitPrice] = useState<number>(10)
  const [waxCost, setWaxCost] = useState<number>(3)
  const [perfumeCost, setPerfumeCost] = useState<number>(2)
  const [unitCost, setUnitCost] = useState<number>(waxCost + perfumeCost)
  const [capacity, setCapacity] = useState<number>(200)
  const [startQty, setStartQty] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    setUnitCost(Math.max(0, (waxCost || 0) + (perfumeCost || 0)))
  }, [waxCost, perfumeCost])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (mode === "existing") {
        if (!productId) throw new Error("Select a product")
        if (!Number.isFinite(qty)) throw new Error("Enter a quantity")
        addInventory(productId, qty)
      } else {
        if (!name.trim()) throw new Error("Enter product name")
        const id = name.toLowerCase().replace(/\s+/g, "-")
        const newProd: Product = {
          id,
          name: name.trim(),
          sku: sku || undefined,
          inventory: Math.max(0, Math.floor(startQty)),
          unitPrice: Math.max(0, unitPrice),
          waxCostPerUnit: Math.max(0, waxCost || 0),
          perfumeCostPerUnit: Math.max(0, perfumeCost || 0),
          unitCost: Math.max(0, unitCost || 0),
          stockCapacity: Math.max(1, capacity),
        }
        upsertProduct(newProd)
      }
      onDone?.()
      setQty(0)
      setName("")
      setSku("")
      setStartQty(0)
    } catch (err: any) {
      setError(err?.message || "Something went wrong")
    }
  }

  return (
    <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-lg dark:text-white">New Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "existing" ? "default" : "outline"}
              onClick={() => setMode("existing")}
            >
              Update Existing
            </Button>
            <Button type="button" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")}>
              Add New Product
            </Button>
          </div>

          {mode === "existing" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Product</label>
                <select
                  className="w-full border rounded-md h-9 px-3 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  {state.products.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name} (Stock: {p.inventory})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Add Quantity</label>
                <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Rose Candle" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">SKU (optional)</label>
                <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g., ROS-001" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Unit Price (₹)</label>
                <Input type="number" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Wax Cost (₹)</label>
                <Input type="number" value={waxCost} onChange={(e) => setWaxCost(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Perfume Cost (₹)</label>
                <Input type="number" value={perfumeCost} onChange={(e) => setPerfumeCost(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Unit Cost (auto)</label>
                <Input type="number" value={unitCost} readOnly />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Stock Capacity</label>
                <Input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Starting Inventory</label>
                <Input type="number" value={startQty} onChange={(e) => setStartQty(Number(e.target.value))} />
              </div>
            </div>
          )}

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="flex justify-end gap-2">
            {onDone && (
              <Button type="button" variant="outline" onClick={onDone}>
                Cancel
              </Button>
            )}
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
