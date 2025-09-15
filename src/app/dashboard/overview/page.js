"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2, BarChart3, TrendingUp } from "lucide-react"
import { useToast } from "@/app/contexts/ToastContext"
import StatsGrid from "@/app/components/StatsGrid"
import RecentActivity from "@/app/components/RecentActivity"
import Loader from "@/app/components/Loader"

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    revenue: 0,
    inventoryItems: 0,
    activeUsers: 0,
  })

  const router = useRouter()
  const { error: toastError } = useToast()

  // Handle authentication errors
  const handleAuthError = async () => {
    try {
      await fetch("/api/logout", { method: "POST" })
      toastError("Session expired. Please login again.")
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/login")
    }
  }

  // Check API response for authentication errors
  const checkAuthResponse = async (response, data) => {
    if (response.status === 401 || response.status === 403 || (response.status === 400 && data?.requiresLogin)) {
      await handleAuthError()
      return true
    }
    return false
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError("")

      // Fetch total orders count
      const ordersResponse = await fetch("/api/dashboard/orders-count")
      const ordersData = await ordersResponse.json()

      if (await checkAuthResponse(ordersResponse, ordersData)) return

      if (!ordersResponse.ok) {
        throw new Error(ordersData.error || "Failed to fetch dashboard data")
      }

      setDashboardData({
        totalOrders: ordersData.totalOrders || 0,
        revenue: 45678, // Placeholder - implement when revenue API is available
        inventoryItems: 567, // Placeholder - implement when inventory API is available
        activeUsers: 89, // Placeholder - implement when users count API is available
      })
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError(`Failed to load dashboard data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 space-y-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <BarChart3 className="h-10 w-10 text-blue-600" />
            <span className="text-gray-800">Dashboard Overview</span>
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <BarChart3 className="h-10 w-10 text-blue-600" />
          <span className="text-gray-800">Dashboard Overview</span>
        </h1>
        <p className="text-gray-600">Monitor your business performance and key metrics</p>
      </div>

      <StatsGrid dashboardData={dashboardData} />

            <RecentActivity />

    </div>
  )
}
