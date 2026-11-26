"use client"

import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Package, Users } from "lucide-react"

export default function StatsGrid({ dashboardData }) {
  // Calculate mock percentage changes (you can implement real change calculation later)
  const calculateChange = (current, previous = 0) => {
    if (previous === 0) return "+12%" // Default for demo
    const change = ((current - previous) / previous) * 100
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`
  }

  const stats = [
    {
      title: "Total Orders",
      value: dashboardData?.totalOrders?.toLocaleString() || "0",
      change: calculateChange(dashboardData?.totalOrders || 0),
      color: "blue",
      icon: ShoppingCart,
    },
    {
      title: "Revenue",
      value: `$${dashboardData?.revenue?.toLocaleString() || "0"}`,
      change: "+8%", // Placeholder
      color: "green",
      icon: DollarSign,
    },
    {
      title: "Inventory Items",
      value: dashboardData?.inventoryItems?.toLocaleString() || "0",
      change: "-3%", // Placeholder
      color: "purple",
      icon: Package,
    },
    {
      title: "Active Users",
      value: dashboardData?.activeUsers?.toLocaleString() || "0",
      change: "+15%", // Placeholder
      color: "orange",
      icon: Users,
    },
  ]

  const getColorClasses = (color) => {
    const colorMap = {
      blue: "bg-blue-50 text-blue-600",
      green: "bg-emerald-50 text-emerald-600",
      purple: "bg-violet-50 text-violet-600",
      orange: "bg-orange-50 text-orange-500",
    }
    return colorMap[color] || colorMap.blue
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const isPositive = stat.change.startsWith("+")

        return (
          <div
            key={index}
            className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-slate-200/60"
          >
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-slate-500 text-sm font-medium">{stat.title}</h3>
              <div className={`p-2 rounded-xl ${getColorClasses(stat.color)}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-end justify-between gap-2">
              <span className="text-2xl lg:text-2xl font-bold text-slate-800 leading-none">
                {stat.value}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg shrink-0 ${
                  isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {stat.change}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
