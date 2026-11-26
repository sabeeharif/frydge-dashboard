"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, BarChart3 } from "lucide-react"
import { useToast } from "@/app/contexts/ToastContext"
import { AuthService, api } from "@/app/lib/auth"
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
  const handleAuthError = () => {
    AuthService.logout()
    toastError("Session expired. Please login again.")
    router.push("/")
  }

  // Check API response for authentication errors
  const checkAuthResponse = async (response, data) => {
    if (response.status === 401 || response.status === 403 || (response.status === 400 && data?.requiresLogin)) {
      handleAuthError()
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

      // Check if user is logged in
      if (!AuthService.isLoggedIn()) {
        handleAuthError()
        return
      }

      // Fetch total orders count
      const ordersResponse = await api.getOrdersCount()
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
      <div className="flex items-center justify-center h-[60vh] w-full">
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="mb-4 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-slate-800 mb-1 flex items-center gap-2 lg:gap-3 text-left">
            <BarChart3 className="h-6 w-6 lg:h-10 lg:w-10 text-blue-600 shrink-0" />
            <span>Dashboard Overview</span>
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 lg:p-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 lg:h-6 lg:w-6 text-red-600 mr-3 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
              <p className="text-red-700 mt-1 text-sm lg:text-base">{error}</p>
              <button
                type="button"
                onClick={fetchDashboardData}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
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
    <div className="space-y-5 lg:space-y-8">
      <div className="mb-2 lg:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-slate-800 mb-1 flex items-center gap-2 lg:gap-3 text-left">
          <BarChart3 className="h-6 w-6 lg:h-10 lg:w-10 text-blue-600 shrink-0" />
          <span>Dashboard Overview</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm lg:text-base">
          Monitor your business performance and key metrics
        </p>
      </div>

      <StatsGrid dashboardData={dashboardData} />

      <RecentActivity />
    </div>
  )
}
