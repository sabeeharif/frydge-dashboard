"use client"

import { useState, useEffect, useRef, Suspense } from "react"
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
import { AuthService, api } from "@/app/lib/auth"

function AppOrdersContent() {
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
  const handleAuthError = () => {
    AuthService.logout()
    toastError("Session expired. Please login again.")
    router.push("/")
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

        const response = await api.getOrders({
          limit: 20,
          search: searchTerm,
          lastKey: currentLastKey
        })

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

      const params = {
        limit: pageSize
      }

      if (useLastKey) {
        params.lastKey = useLastKey
      }

      console.log("API params:", params)

      const response = await api.getOrders(params)

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
    <div className="space-y-4 lg:space-y-8">
      <div className="mb-2 lg:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-800 mb-1 lg:mb-2 flex items-center gap-2 lg:gap-3 text-left">
          <ShoppingCart className="h-6 w-6 lg:h-10 lg:w-10 text-blue-600 shrink-0" />
          <span className="text-gray-800">App Orders</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
          <span>
            Showing {displayedOrders.length} orders on page {currentPage}
            {isSearchMode && allOrders.length > 0 && ` of ${allOrders.length} total`}
          </span>
          {searchLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>
                Searching... ({fetchProgress.current}/{fetchProgress.total})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full p-[2px] rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
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
            className="w-full text-sm lg:text-base py-2 bg-transparent outline-none text-gray-900"
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
          <table className="w-full min-w-[520px] lg:min-w-[900px]">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Order ID</th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Customer</th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Status
                  </div>
                </th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Amount
                  </div>
                </th>
                <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Machine</th>
                <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Payment</th>
                <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Items</th>
                <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Date
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 sm:py-12 text-center text-gray-500">
                    <ShoppingCart className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                    <p className="text-sm sm:text-lg">{search ? `No orders found matching "${search}"` : "No orders found"}</p>
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
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="h-6 w-6 sm:h-8 sm:w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-[10px] sm:text-sm shrink-0">
                          {(currentPage - 1) * pageSize + index + 1}
                        </div>
                        <span className="text-[11px] sm:text-xs lg:text-sm font-medium text-gray-900 truncate max-w-[8rem] sm:max-w-none">{order.order_id}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="flex items-center min-w-0">
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mr-1.5 sm:mr-2 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-gray-900 truncate">{getCustomerEmail(order)}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500 truncate">ID: {order.order?.customerId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(order)}`}
                      >
                        {order.order_processed ? "Processed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                      <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-gray-900">{formatAmount(order)}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">{order.order?.paymentStatusDisplay}</div>
                    </td>
                    <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-gray-900">
                        {order.order?.machine?.friendlyName || "N/A"}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500">ID: {order.order?.machine?.id}</div>
                    </td>
                    <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="flex items-center">
                        {getPaymentMethodIcon(order.payment_method_type)}
                        <span className="ml-2 text-[11px] sm:text-xs lg:text-sm text-gray-900 capitalize">{order.payment_method_type}</span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                      <div className="text-[11px] sm:text-xs lg:text-sm text-gray-900">
                        {getOrderItems(order).length} item{getOrderItems(order).length !== 1 ? "s" : ""}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                      <div className="text-[11px] sm:text-xs lg:text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                      {order.order?.paidAt && (
                        <div className="text-[10px] sm:text-xs text-gray-500">Paid: {formatDate(order.order.paidAt)}</div>
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
        <div className="mt-4 sm:mt-6 lg:mt-8 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 bg-white rounded-xl shadow-sm border border-slate-200/80 px-2.5 py-2.5 sm:px-5 sm:py-4 lg:px-6">
          <div className="flex items-center text-[11px] sm:text-sm text-slate-600">
            <span>
              Showing {displayedOrders.length} orders
              {hasNextPage ? " (more available)" : ""}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`flex items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium border transition-colors ${
                currentPage === 1
                  ? "text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50"
                  : "text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600 bg-white"
              }`}
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-0.5" />
              Prev
            </button>
            <button
              type="button"
              className="min-w-7 sm:min-w-8 h-7 sm:h-8 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-sm font-semibold border bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent"
            >
              {currentPage}
            </button>
            {hasNextPage && (
              <button
                type="button"
                onClick={handleNextPage}
                className="min-w-7 sm:min-w-8 h-7 sm:h-8 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-sm font-semibold border bg-white text-slate-700 border-slate-200 hover:border-blue-300"
              >
                {currentPage + 1}
              </button>
            )}
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!hasNextPage}
              className={`flex items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium border transition-colors ${
                !hasNextPage
                  ? "text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50"
                  : "text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600 bg-white"
              }`}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppOrders() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <Loader />
      </div>
    }>
      <AppOrdersContent />
    </Suspense>
  )
}
