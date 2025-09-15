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
      blue: "bg-blue-50 border-blue-200 text-blue-600",
      green: "bg-green-50 border-green-200 text-green-600",
      purple: "bg-purple-50 border-purple-200 text-purple-600",
      orange: "bg-orange-50 border-orange-200 text-orange-600",
    }
    return colorMap[color] || colorMap.blue
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const isPositive = stat.change.startsWith("+")

        return (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-600 text-sm font-medium">{stat.title}</h3>
              <div className={`p-2 rounded-lg border ${getColorClasses(stat.color)}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium px-2 py-1 rounded-lg ${
                    isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
