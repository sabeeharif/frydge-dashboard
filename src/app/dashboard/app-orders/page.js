"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  AlertCircle,
  Loader2,
  Search,
  Package,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  CloudCog,
} from "lucide-react"
import Loader from "@/app/components/Loader"
import { useToast } from "@/app/contexts/ToastContext"

export default function AppOrders() {
  const [orders, setOrders] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [lastKey, setLastKey] = useState(null)
  const [hasNextPage, setHasNextPage] = useState(false)

  // Search and caching states
  const [allOrders, setAllOrders] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 })
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchCache, setSearchCache] = useState(new Map())

  // Pagination state management
  const [pageData, setPageData] = useState(new Map()) // Store data for each page
  const [pageKeys, setPageKeys] = useState(new Map()) // Store lastKey for each page
  const [hasInitialLoad, setHasInitialLoad] = useState(false)

  const searchTimeoutRef = useRef(null)
  const isFetchingAllRef = useRef(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { error: toastError } = useToast()
  const pageSize = 10

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

  // Extract customer email from remoteOrderObject
  const getCustomerEmail = (order) => {
  try {
    let remoteOrderStr = order.order?.remoteOrderObject;
    if (!remoteOrderStr) return "N/A";

    // Fix common Python-to-JSON differences
    remoteOrderStr = remoteOrderStr
      .replace(/'/g, '"')               // single → double quotes
      .replace(/\bFalse\b/g, "false")   // Python False → JSON false
      .replace(/\bTrue\b/g, "true")     // Python True → JSON true
      .replace(/\bNone\b/g, "null");    // Python None → JSON null

    const remoteOrder = JSON.parse(remoteOrderStr);
    return remoteOrder.email || "N/A";
  } catch (e) {
    console.error("Error parsing remoteOrderObject:", e);
    return "N/A";
  }
};

  // Extract order items from remoteOrderObject
  const getOrderItems = (order) => {
    try {
      if (order.order?.remoteOrderObject) {
        const remoteOrder = JSON.parse(order.order.remoteOrderObject.replace(/'/g, '"'))
        return remoteOrder.orderItems || []
      }
    } catch (e) {
      console.error("Error parsing remoteOrderObject:", e)
    }
    return []
  }

  useEffect(() => {
    const pageFromUrl = Number.parseInt(searchParams.get("page")) || 1
    setCurrentPage(pageFromUrl)

    // Only fetch if we haven't loaded this page before or it's the first load
    if (!hasInitialLoad || !pageData.has(pageFromUrl)) {
      fetchOrders(pageFromUrl)
    } else {
      // Use cached data
      const cachedData = pageData.get(pageFromUrl)
      const cachedKey = pageKeys.get(pageFromUrl)
      setOrders(cachedData || [])
      setLastKey(cachedKey || null)
      setHasNextPage(!!cachedKey)
    }
  }, [searchParams, hasInitialLoad, pageData, pageKeys])

  // Progressive search functionality
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (search.trim()) {
      setIsSearchMode(true)
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(search.trim())
      }, 500) // 500ms debounce
    } else {
      setIsSearchMode(false)
      setAllOrders([])
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [search])

  const handleSearch = async (searchTerm) => {
    // Check cache first
    if (searchCache.has(searchTerm)) {
      setAllOrders(searchCache.get(searchTerm) || [])
      return
    }

    if (isFetchingAllRef.current) return

    isFetchingAllRef.current = true
    setSearchLoading(true)
    setFetchProgress({ current: 0, total: 1 })

    try {
      let allSearchResults = []
      let currentLastKey = null
      let pageCount = 0
      const maxPages = 50 // Prevent infinite loops

      do {
        pageCount++
        setFetchProgress({ current: pageCount, total: maxPages })

        const response = await fetch(
          `/api/orders?limit=20&search=${encodeURIComponent(searchTerm)}${currentLastKey ? `&lastKey=${encodeURIComponent(currentLastKey)}` : ""}`,
        )

        const data = await response.json()

        if (await checkAuthResponse(response, data)) return

        if (response.ok && data.orders) {
          allSearchResults = [...allSearchResults, ...data.orders]
          currentLastKey = data.lastKey || null

          // Update state progressively
          setAllOrders([...allSearchResults])
        } else {
          console.error("Search API error:", data)
          break
        }

        // Add delay to prevent overwhelming the API
        if (currentLastKey && pageCount < maxPages) {
          await new Promise((resolve) => setTimeout(resolve, 300))
        }
      } while (currentLastKey && pageCount < maxPages)

      // Cache the results
      setSearchCache((prev) => new Map(prev.set(searchTerm, allSearchResults)))

      console.log(`Search completed: Found ${allSearchResults.length} orders for "${searchTerm}"`)
    } catch (error) {
      console.error("Error during search:", error)
      toastError("Search failed. Please try again.")
    } finally {
      setSearchLoading(false)
      isFetchingAllRef.current = false
    }
  }

  const fetchOrders = async (page) => {
    try {
      setLoading(true)
      setError("")

      console.log("Fetching orders for page:", page)

      // Determine the lastKey to use
      let useLastKey = null
      if (page > 1) {
        // For pages after the first, use the lastKey from the previous page
        useLastKey = pageKeys.get(page - 1)
        console.log("Using lastKey for page", page, ":", useLastKey)
      }

      let apiUrl = `/api/orders?limit=${pageSize}`

      if (useLastKey) {
        apiUrl += `&lastKey=${encodeURIComponent(useLastKey)}`
      }

      console.log("API URL:", apiUrl)

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (await checkAuthResponse(response, data)) return

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      console.log("Orders API response:", data)
      console.log("Received orders count:", data.orders?.length)
      console.log("LastKey in response:", data.lastKey)

      const receivedOrders = data.orders || []
      const receivedLastKey = data.lastKey || null

      // Update state
      setOrders(receivedOrders)
      setLastKey(receivedLastKey)
      setHasNextPage(!!receivedLastKey)

      // Cache the data and lastKey for this page
      setPageData((prev) => new Map(prev.set(page, receivedOrders)))
      if (receivedLastKey) {
        setPageKeys((prev) => new Map(prev.set(page, receivedLastKey)))
      }

      setHasInitialLoad(true)

      console.log("Page", page, "loaded with", receivedOrders.length, "orders")
      console.log("Has next page:", !!receivedLastKey)
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError(`Failed to load orders: ${err.message}`)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getDisplayedOrders = () => {
    if (isSearchMode && search.trim()) {
      const searchTerm = search.toLowerCase()
      return allOrders.filter(
        (order) =>
          order.id?.toString().toLowerCase().includes(searchTerm) ||
          order.order_id?.toString().toLowerCase().includes(searchTerm) ||
          order.payment_method_type?.toLowerCase().includes(searchTerm) ||
          order.payment_intent_id?.toLowerCase().includes(searchTerm) ||
          getCustomerEmail(order).toLowerCase().includes(searchTerm) ||
          order.order?.machine?.friendlyName?.toLowerCase().includes(searchTerm) ||
          (order.order_processed ? "processed" : "pending").includes(searchTerm),
      )
    }
    return orders
  }

  const displayedOrders = getDisplayedOrders()

  const updateUrlParams = (page) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleNextPage = () => {
    if (hasNextPage) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      updateUrlParams(newPage)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      updateUrlParams(newPage)
    }
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  const formatAmount = (order) => {
    // Get amount from order.total
    const amount = Number.parseFloat(order.order?.total || 0)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR", // Changed to EUR based on the data
    }).format(amount)
  }

  const getStatusColor = (order) => {
    const isProcessed = order.order_processed
    if (isProcessed) {
      return "bg-green-100 text-green-800"
    } else {
      return "bg-yellow-100 text-yellow-800"
    }
  }

  const getPaymentMethodIcon = (paymentType) => {
    switch (paymentType) {
      case "card":
        return <CreditCard className="h-3 w-3" />
      case "sepa_debit":
        return <Package className="h-3 w-3" />
      default:
        return <DollarSign className="h-3 w-3" />
    }
  }

  if (loading && !hasInitialLoad) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Orders</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={() => fetchOrders(currentPage)}
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
          {/* <ShoppingCart className="h-10 w-10 text-blue-600" /> */}
          <span className="text-gray-800">App Orders</span>
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            Showing {displayedOrders.length} orders on page {currentPage}
            {isSearchMode && allOrders.length > 0 && ` of ${allOrders.length} total`}
          </span>
          {searchLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                Searching... ({fetchProgress.current}/{fetchProgress.total})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4 relative w-full p-[2px] rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center bg-white rounded-full px-3">
          <Search className="w-5 h-5 text-gray-500 mr-2 absolute right-3" />
          <input
            type="text"
            placeholder={
              allOrders.length > 0
                ? `Search through ${allOrders.length} orders...`
                : "Search by order ID, email, machine name, or status..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 bg-transparent outline-none text-gray-900"
          />
        </div>
      </div>

      {/* Search Results Info */}
      {search && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            Found {displayedOrders.length} order{displayedOrders.length !== 1 ? "s" : ""} matching "{search}"
            {allOrders.length > 0
              ? ` (searching through ${allOrders.length} total orders)`
              : " (searching current results)"}
          </p>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Status
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Amount
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Machine</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">{search ? `No orders found matching "${search}"` : "No orders found"}</p>
                  </td>
                </tr>
              ) : (
                displayedOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition-colors duration-200 cursor-pointer`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                          {(currentPage - 1) * pageSize + index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{order.order_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{getCustomerEmail(order)}</div>
                          <div className="text-xs text-gray-500">ID: {order.order?.customerId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order)}`}
                      >
                        {order.order_processed ? "Processed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatAmount(order)}</div>
                      <div className="text-xs text-gray-500">{order.order?.paymentStatusDisplay}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order?.machine?.friendlyName || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">ID: {order.order?.machine?.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getPaymentMethodIcon(order.payment_method_type)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">{order.payment_method_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getOrderItems(order).length} item{getOrderItems(order).length !== 1 ? "s" : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                      {order.order?.paidAt && (
                        <div className="text-xs text-gray-500">Paid: {formatDate(order.order.paidAt)}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls - Only show when not in search mode AND there's pagination needed */}
      {!isSearchMode && (hasNextPage || currentPage > 1) && (
        <div className="mt-8 flex items-center justify-between bg-white rounded-lg shadow-lg px-6 py-4">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Page {currentPage}
              {hasNextPage ? " (more available)" : " (last page)"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            <span className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">{currentPage}</span>
            <button
              onClick={handleNextPage}
              disabled={!hasNextPage}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !hasNextPage ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
