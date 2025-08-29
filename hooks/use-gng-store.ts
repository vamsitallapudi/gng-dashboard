"use client"

import useSWR from "swr"

export type Product = {
  id: string
  name: string
  sku?: string
  inventory: number
  unitPrice: number // revenue per item
  unitCost: number // cost per item (raw material)
  stockCapacity?: number // for donut charts; default 200
  waxCostPerUnit?: number
  perfumeCostPerUnit?: number
}

export type SaleItem = {
  productId: string
  quantity: number
}

export type Sale = {
  id: string
  date: string // ISO
  items: SaleItem[]
  revenue: number
  cost: number
}

type StoreState = {
  products: Product[]
  sales: Sale[]
  target: number // revenue target
}

const STORAGE_KEY = "gng-store-v1"

function loadState(): StoreState {
  if (typeof window === "undefined") return defaultState
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as StoreState
    // basic shape guard
    if (!Array.isArray(parsed.products) || !Array.isArray(parsed.sales) || typeof parsed.target !== "number") {
      return defaultState
    }
    return parsed
  } catch {
    return defaultState
  }
}

function saveState(state: StoreState) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const defaultState: StoreState = {
  products: [
    {
      id: "laddoo",
      name: "Laddoo Candle",
      sku: "LAD-001",
      inventory: 17, // Updated: remaining inventory
      unitPrice: 15,
      waxCostPerUnit: 4.2,
      perfumeCostPerUnit: 1.8,
      unitCost: 6,
      stockCapacity: 20, // Updated: total capacity
    },
    {
      id: "modak",
      name: "Modak Candle",
      sku: "MOD-001",
      inventory: 17, // Updated: remaining inventory
      unitPrice: 18,
      waxCostPerUnit: 4.9,
      perfumeCostPerUnit: 2.1,
      unitCost: 7,
      stockCapacity: 20, // Updated: total capacity
    },
  ],
  sales: [],
  target: 5000,
}

export function useGngStore() {
  const { data, mutate } = useSWR<StoreState>("gng-store", () => loadState(), {
    fallbackData: defaultState,
  })

  const state = data || defaultState

  const income = state.sales.reduce((sum, s) => sum + s.revenue, 0)
  const expenses = state.sales.reduce((sum, s) => sum + s.cost, 0)
  const profit = income - expenses
  const targetRemaining = Math.max(0, state.target - income)

  function upsertProduct(next: Product) {
    mutate((current) => {
      const cur = current || defaultState
      const existsIdx = cur.products.findIndex((p) => p.id === next.id)
      const products =
        existsIdx >= 0
          ? [...cur.products.slice(0, existsIdx), next, ...cur.products.slice(existsIdx + 1)]
          : [...cur.products, next]
      const nextState = { ...cur, products }
      saveState(nextState)
      return nextState
    }, false)
  }

  function addInventory(productId: string, qty: number) {
    mutate((current) => {
      const cur = current || defaultState
      const products = cur.products.map((p) =>
        p.id === productId ? { ...p, inventory: Math.max(0, p.inventory + qty) } : p,
      )
      const nextState = { ...cur, products }
      saveState(nextState)
      return nextState
    }, false)
  }

  function setTarget(nextTarget: number) {
    mutate((current) => {
      const cur = current || defaultState
      const nextState = { ...cur, target: Math.max(0, nextTarget) }
      saveState(nextState)
      return nextState
    }, false)
  }

  function recordSale(items: SaleItem[]) {
    mutate((current) => {
      const cur = current || defaultState
      // Validate stock
      for (const it of items) {
        const prod = cur.products.find((p) => p.id === it.productId)
        if (!prod) throw new Error("Product not found")
        if (it.quantity <= 0 || !Number.isFinite(it.quantity)) throw new Error("Invalid quantity")
        if (prod.inventory < it.quantity) throw new Error(`Insufficient stock for ${prod.name}`)
      }
      // Compute totals using raw-material breakdown if present
      let revenue = 0
      let cost = 0
      for (const it of items) {
        const prod = cur.products.find((p) => p.id === it.productId)!
        revenue += prod.unitPrice * it.quantity
        const materialCost = (prod.waxCostPerUnit ?? 0) + (prod.perfumeCostPerUnit ?? 0) || prod.unitCost
        cost += materialCost * it.quantity
      }
      // Decrement inventory
      const products = cur.products.map((p) => {
        const consumed = items.find((it) => it.productId === p.id)?.quantity ?? 0
        return consumed ? { ...p, inventory: p.inventory - consumed } : p
      })
      const sale: Sale = {
        id: `sale_${Date.now()}`,
        date: new Date().toISOString(),
        items,
        revenue,
        cost,
      }
      const nextState = { ...cur, products, sales: [sale, ...cur.sales] }
      saveState(nextState)
      return nextState
    }, false)
  }

  function getProductById(id: string) {
    return state.products.find((p) => p.id === id)
  }

  function getProductByName(name: string) {
    return state.products.find((p) => p.name.toLowerCase() === name.toLowerCase())
  }

  return {
    state,
    income,
    expenses,
    profit,
    targetRemaining,
    upsertProduct,
    addInventory,
    recordSale,
    setTarget,
    getProductById,
    getProductByName,
  }
}
