"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, Monitor, AlertCircle, Loader2, Search } from "lucide-react"
import Loader from "@/app/components/Loader"

export default function UserTable() {
  const [users, setUsers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [userss, setFilteredUsers] = useState([])

  const [allUsers, setAllUsers] = useState([]) // Store all fetched users for search
  const [searchLoading, setSearchLoading] = useState(false)
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 })
  const searchTimeoutRef = useRef(null)
  const isFetchingAllRef = useRef(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const pageSize = 10
  const totalPages = Math.ceil(totalCount / pageSize)

  useEffect(() => {
    const pageFromUrl = Number.parseInt(searchParams.get("page")) || 1
    setCurrentPage(pageFromUrl)
    fetchUsers(pageFromUrl)
  }, [searchParams])

  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Only start fetching all users if we have a total count and haven't started fetching
    if (totalCount > 0 && !isFetchingAllRef.current && allUsers.length === 0) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchAllUsersProgressively()
      }, 500) // 500ms debounce
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [totalCount])

  const fetchAllUsersProgressively = async () => {
    if (isFetchingAllRef.current) return

    isFetchingAllRef.current = true
    setSearchLoading(true)

    try {
      const searchPageSize = 20 // Use max page size for efficiency
      const totalPagesForSearch = Math.ceil(totalCount / searchPageSize)
      let allFetchedUsers = []

      setFetchProgress({ current: 0, total: totalPagesForSearch })

      // Fetch pages with controlled delay to avoid overwhelming the API
      for (let page = 1; page <= totalPagesForSearch; page++) {
        try {
          const response = await fetch(`/api/users?page=${page}&pageSize=${searchPageSize}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const data = await response.json()
            allFetchedUsers = [...allFetchedUsers, ...(data.results || [])]
            setAllUsers([...allFetchedUsers]) // Update state progressively
            setFetchProgress({ current: page, total: totalPagesForSearch })
          }

          // Add delay between requests to avoid rate limiting (300ms debounce between pages)
          if (page < totalPagesForSearch) {
            await new Promise((resolve) => setTimeout(resolve, 300))
          }
        } catch (pageError) {
          console.warn(`Failed to fetch page ${page}:`, pageError)
          // Continue with next page even if one fails
        }
      }

      console.log(`Successfully fetched ${allFetchedUsers.length} users for search`)
    } catch (error) {
      console.error("Error fetching all users:", error)
    } finally {
      setSearchLoading(false)
      isFetchingAllRef.current = false
    }
  }

  useEffect(() => {
    if (!search) {
      setFilteredUsers(users)
    } else {
      const lower = search.toLowerCase()
      setFilteredUsers(
        users.filter(
          (u) =>
            (u.email || "").toLowerCase().includes(lower) ||
            (u.firstName || "").toLowerCase().includes(lower) ||
            (u.lastName || "").toLowerCase().includes(lower),
        ),
      )
    }
  }, [search, users])

  const fetchUsers = async (page) => {
    try {
      setLoading(true)
      setError("")
      console.log("Fetching users for page:", page)
      const response = await fetch(`/api/users?page=${page}&pageSize=${pageSize}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      console.log("Client fetch response status:", response.status)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      const data = await response.json()
      console.log("Client received data:", {
        count: data.count,
        resultsLength: data.results?.length,
      })
      setUsers(data.results || [])
      setFilteredUsers(data.results || [])
      setTotalCount(data.count || 0)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError(`Failed to load users: ${err.message}`)
      setUsers([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = (() => {
    if (!search) {
      return users // Show current page users when no search
    }

    const searchData = allUsers.length > 0 ? allUsers : users
    const lower = search.toLowerCase()

    return searchData.filter((user) => {
      const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase()
      return fullName.includes(lower) || (user.email?.toLowerCase() ?? "").includes(lower)
    })
  })()

  const updateUrlParams = (page) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
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

  const handlePageClick = (page) => {
    setCurrentPage(page)
    updateUrlParams(page)
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Users</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={() => fetchUsers(currentPage)}
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
          <Monitor className="h-10 w-10 text-blue-600" />
          <p className="text-gray-800">Users</p>
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            Showing {users.length} of {totalCount} users
          </span>
          {searchLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                Loading search data... ({fetchProgress.current}/{fetchProgress.total})
              </span>
            </div>
          )}
        
        </div>
      </div>
      <div className="mb-4 relative w-full p-[2px] rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
        {/* inner input wrapper with bg to mask the gradient */}
        <div className="flex items-center bg-white  rounded-full px-3">
          <Search className="w-5 h-5 text-gray-500 mr-2 absolute right-3" />
          <input
            type="text"
            placeholder={
              allUsers.length > 0 ? `Search through all ${allUsers.length} users...` : "Search by email or name..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 bg-transparent outline-none text-gray-900 "
          />
        </div>
      </div>

      {search && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            Found {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} matching "{search}"
            {allUsers.length > 0
              ? ` (searching through ${allUsers.length} total users)`
              : " (searching current page only)"}
          </p>
        </div>
      )}

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">First Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Last Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Account Owner</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">{search ? `No users found matching "${search}"` : "No users found"}</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition-colors duration-200 cursor-pointer`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                          {search ? index + 1 : index + 1 + (currentPage - 1) * pageSize}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.firstName || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.lastName || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.email || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.isAccountOwner === true ? "Yes" : "No"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.isOperator === true ? "Yes" : "No"}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && !search && (
        <div className="mt-8 flex items-center justify-between bg-white rounded-lg shadow-lg px-6 py-4">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of{" "}
              {totalCount} results
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
            <div className="flex space-x-1">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageClick(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
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
