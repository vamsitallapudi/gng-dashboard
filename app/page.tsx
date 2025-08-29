"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Search,
  Bell,
  Home,
  Settings,
  Target,
  Plus,
  Sun,
  Moon,
  ReceiptText,
  IndianRupee,
  LineChartIcon,
  Package,
  ShoppingCart,
  BarChart3,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useGngStore } from "@/hooks/use-gng-store"
import { InventoryDonut } from "@/components/gng/donut"
import { InventoryForm } from "@/components/gng/inventory-form"
import { SaleForm } from "@/components/gng/sale-form"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"
import Lottie from "lottie-react"


export default function EcommerceDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [themeInitialized, setThemeInitialized] = useState(false)
  const [showInventoryForm, setShowInventoryForm] = useState(false)
  const [showSaleForm, setShowSaleForm] = useState(false)
  const [targetInput, setTargetInput] = useState<string>("")

  const { state, income, expenses, profit, targetRemaining, setTarget, getProductByName } = useGngStore()

  const THEME_KEY = 'themeV1'

  // Initialize theme on client load (only once)
  useEffect(() => {
    if (typeof window !== 'undefined' && !themeInitialized) {
      try {
        const savedTheme = localStorage.getItem(THEME_KEY)
        if (savedTheme === 'dark') {
          setIsDarkMode(true)
        } else if (savedTheme === 'light') {
          setIsDarkMode(false)
        } else {
          // Check system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          setIsDarkMode(prefersDark)
        }
      } catch {}
      setThemeInitialized(true)
    }
  }, [themeInitialized])

  useEffect(() => {
    if (themeInitialized) {
      if (isDarkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      // Persist theme
      try {
        localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light')
      } catch {}
    }
  }, [isDarkMode, themeInitialized])

  useEffect(() => {
    setTargetInput(String(state.target))
  }, [state.target])

  const laddoo = getProductByName("Laddoo Candle")
  const modak = getProductByName("Modak Candle")

  const recentOrders = state.sales.slice(0, 5)

  // INR formatter
  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n)

  const kpis = useMemo(
    () => [
      {
        label: "Income",
        value: formatINR(income),
        sub: "Total revenue",
        icon: IndianRupee,
      },
      {
        label: "Expenses",
        value: formatINR(expenses),
        sub: "Raw material costs",
        icon: ReceiptText,
      },
      {
        label: "Profit",
        value: formatINR(profit),
        sub: "Income - Expenses",
        icon: IndianRupee,
      },
      {
        label: "Target Remaining",
        value: formatINR(targetRemaining),
        sub: "Revenue target left",
        icon: Target,
      },
    ],
    [income, expenses, profit, targetRemaining],
  )

  // Build sales trend (group by date)
  const salesByDay = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; cost: number; profit: number }>()
    for (const s of state.sales) {
      const day = new Date(s.date)
      const key = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString()
      const cur = map.get(key) || { date: key, revenue: 0, cost: 0, profit: 0 }
      cur.revenue += s.revenue
      cur.cost += s.cost
      cur.profit = cur.revenue - cur.cost
      map.set(key, cur)
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [state.sales])

  // Raw materials breakdown (Wax vs Perfume) across sales
  const rawMaterialsData = useMemo(() => {
    let wax = 0
    let perfume = 0
    for (const sale of state.sales) {
      for (const it of sale.items) {
        const prod = state.products.find((p) => p.id === it.productId)
        if (!prod) continue
        const waxUnit = prod.waxCostPerUnit ?? prod.unitCost * 0.7
        const perfumeUnit = prod.perfumeCostPerUnit ?? prod.unitCost * 0.3
        wax += waxUnit * it.quantity
        perfume += perfumeUnit * it.quantity
      }
    }
    return [
      { name: "Wax", value: wax },
      { name: "Perfume", value: perfume },
    ]
  }, [state.sales, state.products])

  // Wax inventory data
  const waxData = [
    { name: "Remaining", value: 600 },
    { name: "Used", value: 400 },
  ]

  // Perfume inventory data
  const perfumeData: Record<string, Array<{ name: string; value: number }>> = {
    "Vanilla": [
      { name: "Remaining", value: 50 },
      { name: "Used", value: 50 },
    ],
    "Garden": [
      { name: "Remaining", value: 30 },
      { name: "Used", value: 70 },
    ],
    "Ocean Breeze": [
      { name: "Remaining", value: 80 },
      { name: "Used", value: 20 },
    ],
  }

  const [selectedPerfume, setSelectedPerfume] = useState<keyof typeof perfumeData>("Vanilla")

  // Import Lottie animation data  
  const [upArrowAnimation, setUpArrowAnimation] = useState(null)

  useEffect(() => {
    // Load the up arrow animation
    fetch('/lottie/Up Arrow.json')
      .then(response => response.json())
      .then(data => setUpArrowAnimation(data))
      .catch(error => console.error('Error loading up arrow animation:', error))
  }, [])



  // Lottie Animation Data
  const lottieAnimationData = useMemo(() => {
    return {
      "Laddoo Candle": {
        path: "/lottie/laddoo.json",
        loop: true,
        autoplay: true,
      },
      "Modak Candle": {
        path: "/lottie/modak.json",
        loop: true,
        autoplay: true,
      },
    }
  }, [])

  // Colors (within the chosen palette)
  const GREEN = "#10b981"
  const ORANGE = "#f59e0b"
  const SLATE = "#64748b"

  const rmTotal = Math.max(1, rawMaterialsData[0].value + rawMaterialsData[1].value)
  const angle1 = 360 * (rawMaterialsData[0].value / rmTotal) // Wax
  const angle2 = 360 - angle1 // Perfume
  const largestIndex = rawMaterialsData[0].value >= rawMaterialsData[1].value ? 0 : 1
  const rmStartAngle =
    largestIndex === 0
      ? 180 + angle1 / 2 // center Wax on left
      : 180 + angle1 + angle2 / 2 // center Perfume on left
  const rmEndAngle = rmStartAngle - 360

  function saveTarget() {
    const n = Number(targetInput)
    if (Number.isFinite(n)) setTarget(n)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">G</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Gifts N Glimmers</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <span>Dashboard</span> <span className="mx-1">/</span> <span>Overview</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search products or orders..."
              className="pl-10 w-80 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-700 dark:text-white"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode((v) => !v)}
            className="dark:text-gray-300 dark:hover:text-white"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="relative dark:text-gray-300 dark:hover:text-white">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>GN</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 dark:bg-gray-800 dark:border-gray-700">
              <DropdownMenuLabel className="dark:text-white">Manager</DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:border-gray-600" />
              <DropdownMenuItem className="dark:text-gray-300 dark:hover:bg-gray-700">Profile</DropdownMenuItem>
              <DropdownMenuItem className="dark:text-gray-300 dark:hover:bg-gray-700">Settings</DropdownMenuItem>
              <DropdownMenuItem className="dark:text-gray-300 dark:hover:bg-gray-700">Support</DropdownMenuItem>
              <DropdownMenuSeparator className="dark:border-gray-600" />
              <DropdownMenuItem className="dark:text-gray-300 dark:hover:bg-gray-700">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4">
            <nav className="space-y-1">
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Home className="w-4 h-4 mr-3" />
                Overview
              </Button>
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                <ShoppingCart className="w-4 h-4 mr-3" />
                Orders
              </Button>
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Package className="w-4 h-4 mr-3" />
                Inventory
              </Button>
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Sales
              </Button>
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                <LineChartIcon className="w-4 h-4 mr-3" />
                Analytics
              </Button>
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                <FileText className="w-4 h-4 mr-3" />
                Reports
              </Button>
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Package className="w-4 h-4 mr-3" />
                Products
              </Button>
              <Button
                variant="ghost"
                className="flex items-center w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                <ReceiptText className="w-4 h-4 mr-3" />
                Raw Materials
              </Button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-800">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white text-balance">
                  Ecommerce Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Track inventory, sales, and profitability</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    className="w-40 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    type="number"
                    aria-label="Set revenue target"
                  />
                  <Button
                    variant="outline"
                    className="bg-transparent dark:border-gray-600 dark:text-gray-300"
                    onClick={saveTarget}
                  >
                    Set Target
                  </Button>
                </div>
                <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowInventoryForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Inventory
                </Button>
                <Button
                  variant="outline"
                  className="dark:border-gray-600 dark:text-gray-300 bg-transparent"
                  onClick={() => setShowSaleForm(true)}
                >
                  Record Sale
                </Button>
              </div>
            </div>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi, idx) => (
              <Card key={idx} className="border-gray-200 dark:border-gray-700 dark:bg-gray-900 relative overflow-visible">
                <CardContent className="p-6 relative overflow-visible">
                  <div className="flex items-center justify-between mb-3 relative overflow-visible">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg ${
                      kpi.label === "Income" ? "bg-gradient-to-br from-emerald-500 to-emerald-600" :
                      kpi.label === "Expenses" ? "bg-gradient-to-br from-red-500 to-red-600" :
                      kpi.label === "Profit" ? "bg-gradient-to-br from-blue-500 to-blue-600" :
                      "bg-gradient-to-br from-purple-500 to-purple-600"
                    }`}>
                      {kpi.label === "Income" && (
                        <div className="w-8 h-8 text-white animate-pulse">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            <path d="M7 14l3 3 7-7-1.41-1.41L10 14.17 8.41 12.59 7 14z"/>
                          </svg>
                        </div>
                      )}
                      {kpi.label === "Expenses" && (
                        <div className="w-8 h-8 text-white animate-pulse">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            <path d="M7 10l3-3 7 7-1.41 1.41L10 9.83 8.41 11.41 7 10z"/>
                          </svg>
                        </div>
                      )}
                      {kpi.label === "Profit" && (
                        <div className="w-8 h-8 text-white animate-pulse">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            <path d="M12 6l-1.5 3.5L7 10.5l3.5 1.5L12 15.5l1.5-3.5L17 10.5l-3.5-1.5L12 6z"/>
                          </svg>
                        </div>
                      )}
                      {kpi.label === "Target Remaining" && (
                        <div className="w-8 h-8 text-white animate-pulse">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            <path d="M12 6l-1.5 3.5L7 10.5l3.5 1.5L12 15.5l1.5-3.5L17 10.5l-3.5-1.5L12 6z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="w-16 h-16 ml-2 relative z-50">
                      {kpi.label === "Income" && (
                        <div className="w-full h-full flex items-center justify-center relative z-[60] overflow-visible">
                          {upArrowAnimation ? (
                            <div className="w-full h-full relative z-[70] overflow-visible">
                              <Lottie
                                animationData={upArrowAnimation}
                                loop={true}
                                autoplay={true}
                              />
                            </div>
                          ) : (
                            <svg className="w-12 h-12 text-green-500 animate-bounce relative z-[70]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 4l-8 8h5v8h6v-8h5l-8-8z"/>
                            </svg>
                          )}
                        </div>
                      )}
                      {kpi.label === "Expenses" && (
                        <div className="w-full h-full flex items-center justify-center relative z-[60] overflow-visible">
                          {upArrowAnimation ? (
                            <div className="w-full h-full relative z-[70] overflow-visible mt-20" style={{ transform: "rotate(180deg)", filter: "hue-rotate(220deg) saturate(300%) brightness(0.7) contrast(1.2)" }}>
                              <Lottie
                                animationData={upArrowAnimation}
                                loop={true}
                                autoplay={true}
                              />
                            </div>
                          ) : (
                            <svg className="w-12 h-12 text-red-500 animate-bounce relative z-[70]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 20l8-8h-5V4H9v8H4l8 8z"/>
                            </svg>
                          )}
                        </div>
                      )}
                      {kpi.label === "Profit" && (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-green-500 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 7.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5H12v1h1.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5H12v-1h-1.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5z"/>
                          </svg>
                        </div>
                      )}
                      {kpi.label === "Target Remaining" && (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center animate-pulse shadow-lg transform hover:scale-110 transition-transform duration-200">
                          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            <path d="M12 6l-1.5 3.5L7 10.5l3.5 1.5L12 15.5l1.5-3.5L17 10.5l-3.5-1.5L12 6z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{kpi.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{kpi.label}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{kpi.sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="col-span-2 space-y-8">
              {/* Charts Section: Inventory Donuts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InventoryDonut
                  title="Laddoo Candle"
                  subtitle="Inventory remaining"
                  value={laddoo?.inventory ?? 0}
                  capacity={laddoo?.stockCapacity ?? 200}
                />
                <InventoryDonut
                  title="Modak Candle"
                  subtitle="Inventory remaining"
                  value={modak?.inventory ?? 0}
                  capacity={modak?.stockCapacity ?? 200}
                />
              </div>

              {/* Sales Trend */}
              <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold dark:text-white">Sales Trend</CardTitle>
                  <CardDescription className="dark:text-gray-400">Revenue, cost, and profit over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      revenue: { label: "Revenue", color: GREEN },
                      cost: { label: "Cost", color: ORANGE },
                      profit: { label: "Profit", color: SLATE },
                    }}
                    className="h-[320px]"
                  >
                    <LineChart data={salesByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) =>
                          new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                        }
                      />
                      <YAxis tickFormatter={(v) => new Intl.NumberFormat("en-IN").format(v)} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => (
                              <div className="flex items-center justify-between w-full gap-4">
                                <span className="text-muted-foreground">{name}</span>
                                <span className="font-mono">{formatINR(Number(value))}</span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" dot={false} />
                      <Line type="monotone" dataKey="cost" stroke="var(--color-cost)" dot={false} />
                      <Line type="monotone" dataKey="profit" stroke="var(--color-profit)" dot={false} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Forms (conditionally rendered) */}
              {showInventoryForm && <InventoryForm onDone={() => setShowInventoryForm(false)} />}

              {showSaleForm && <SaleForm onDone={() => setShowSaleForm(false)} />}

              {/* Inventory Table */}
              <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold dark:text-white">Inventory</CardTitle>
                  <CardDescription className="dark:text-gray-400">All products and current stock</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">Product</th>
                          <th className="text-left px-4 py-3 font-medium">SKU</th>
                          <th className="text-left px-4 py-3 font-medium">Inventory</th>
                          <th className="text-left px-4 py-3 font-medium">Price</th>
                          <th className="text-left px-4 py-3 font-medium">Cost</th>
                          <th className="text-left px-4 py-3 font-medium">Capacity</th>
                          <th className="text-left px-4 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {state.products.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 text-gray-900 dark:text-white">{p.name}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.sku || "-"}</td>
                            <td className="px-4 py-3 text-gray-900 dark:text-white">{p.inventory}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatINR(p.unitPrice)}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatINR(p.unitCost)}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.stockCapacity ?? 200}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="dark:border-gray-600 dark:text-gray-300 bg-transparent"
                                  onClick={() => setShowInventoryForm(true)}
                                >
                                  + Add
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="dark:border-gray-600 dark:text-gray-300 bg-transparent"
                                  onClick={() => setShowSaleForm(true)}
                                >
                                  Sell
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Recent Orders */}
              <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold dark:text-white">Recent Orders</CardTitle>
                  <CardDescription className="dark:text-gray-400">Last 5 recorded sales</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {recentOrders.length === 0 ? (
                      <div className="p-4 text-sm text-gray-600 dark:text-gray-300">No orders yet.</div>
                    ) : (
                      recentOrders.map((o) => {
                        const itemsText = o.items
                          .map((it) => {
                            const prod = state.products.find((p) => p.id === it.productId)
                            return `${prod?.name ?? it.productId} x${it.quantity}`
                          })
                          .join(", ")
                        const dateStr = new Date(o.date).toLocaleString()
                        return (
                          <div
                            key={o.id}
                            className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2"></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                  {itemsText}
                                </div>
                                <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                  +{formatINR(o.revenue)}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {dateStr} • Cost {formatINR(o.cost)} • Profit {formatINR(o.revenue - o.cost)}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Raw Materials Breakdown */}
              <div className="space-y-6">
                {/* Wax Inventory */}
                <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold dark:text-white">Wax Inventory</CardTitle>
                    <CardDescription className="dark:text-gray-400">1000g total stock</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={waxData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {waxData.map((d, idx) => (
                              <Cell key={d.name} fill={idx === 0 ? "#3b82f6" : "#f43f5e"} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">600g</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Remaining</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Perfume Inventory */}
                <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold dark:text-white">Perfume Inventory</CardTitle>
                    <CardDescription className="dark:text-gray-400">Select perfume type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <select
                        value={selectedPerfume}
                        onChange={(e) => setSelectedPerfume(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="Vanilla">Vanilla (100ml total)</option>
                        <option value="Garden">Garden (100ml total)</option>
                        <option value="Ocean Breeze">Ocean Breeze (100ml total)</option>
                      </select>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={perfumeData[selectedPerfume]}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {perfumeData[selectedPerfume].map((d, idx) => (
                              <Cell key={d.name} fill={idx === 0 ? "#8b5cf6" : "#f59e0b"} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {perfumeData[selectedPerfume][0].value}ml
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Remaining</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
