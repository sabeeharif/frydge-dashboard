"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Users,
  AlertCircle,
  Loader2,
  Search,
  Plus,
  X,
  User,
  Lock,
  Shield,
  Crown,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react"
import Loader from "@/app/components/Loader"
import { useToast } from "@/app/contexts/ToastContext"
import { AuthService, api } from "@/app/lib/auth"

function UsersPageContent() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [pages, setPages] = useState([])   // cache pages
  const [pageIndex, setPageIndex] = useState(0)
  const [lastKeys, setLastKeys] = useState([]) // lastKey per page
  const [hasNextPage, setHasNextPage] = useState(false)

  const [allUsers, setAllUsers] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 })
  const searchTimeoutRef = useRef(null)
  const isFetchingAllRef = useRef(false)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [updatingUser, setUpdatingUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState(false)
  const [createError, setCreateError] = useState("")
  const [editError, setEditError] = useState("")

  // Selected user for edit/delete
  const [selectedUser, setSelectedUser] = useState(null)

  // Form states
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dsbEmail: "",
    dsbPassword: "",
    dsbConfirmPassword: "",
    vlEmail: "",
    vlPassword: "",
    vlConfirmPassword: "",
    dsbUserRole: "driver",
    isOperator: false,
    isAccountOwner: false,
  })

  // Edit form states (only editable fields)
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    dsbEmail: "",
    dsbUserRole: "driver",
    isOperator: false,
    isAccountOwner: false,
  })

  // Password visibility states
  const [showPasswords, setShowPasswords] = useState({
    dsbPassword: false,
    dsbConfirmPassword: false,
    vlPassword: false,
    vlConfirmPassword: false,
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const { success, error: toastError } = useToast()
  const pageSize = 10

  useEffect(() => {
    fetchUsers(null, 0)
  }, [])


  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (users.length > 0 && !isFetchingAllRef.current && allUsers.length === 0) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchAllUsersProgressively()
      }, 500)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [users.length])

  const fetchAllUsersProgressively = async () => {
    if (isFetchingAllRef.current) return

    isFetchingAllRef.current = true
    setSearchLoading(true)

    try {
      let allFetchedUsers = []
      let currentLastKey = null
      let pageCount = 0
      const maxPages = 50

      setFetchProgress({ current: 0, total: maxPages })

      do {
        pageCount++
        setFetchProgress({ current: pageCount, total: maxPages })

        const response = await api.getUsers({
          limit: 20,
          lastKey: currentLastKey
        })

        if (response.ok) {
          const data = await response.json()
          const newUsers = data.users || data.results || []
          allFetchedUsers = [...allFetchedUsers, ...newUsers]
          setAllUsers([...allFetchedUsers])
          currentLastKey = data.lastKey || null
        } else {
          break
        }

        if (pageCount < maxPages && currentLastKey) {
          await new Promise((resolve) => setTimeout(resolve, 300))
        }
      } while (currentLastKey && pageCount < maxPages)

      console.log(`Successfully fetched ${allFetchedUsers.length} users for search`)
    } catch (error) {
      console.error("Error fetching all users:", error)
    } finally {
      setSearchLoading(false)
      isFetchingAllRef.current = false
    }
  }

  const fetchUsers = async (useLastKey = null, targetIndex = 0) => {
    try {
      setLoading(true)
      setError("")

      const response = await api.getUsers({
        limit: pageSize,
        lastKey: useLastKey,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const fetchedUsers = data.users || data.results || []
      const newLastKey = data.lastKey || null

      // ✅ Cache page
      setPages((prev) => {
        const updated = [...prev]
        updated[targetIndex] = fetchedUsers
        return updated
      })

      // ✅ Cache lastKey per page
      setLastKeys((prev) => {
        const updated = [...prev]
        updated[targetIndex] = newLastKey
        return updated
      })

      setUsers(fetchedUsers)
      setHasNextPage(!!newLastKey)
      setPageIndex(targetIndex)

    } catch (err) {
      setError(`Failed to load users: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }


  const filteredUsers = (() => {
    if (!search) {
      return users
    }

    const searchData = allUsers.length > 0 ? allUsers : users
    const lower = search.toLowerCase()

    return searchData.filter((user) => {
      const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase()
      return (
        fullName.includes(lower) ||
        (user.dsbEmail?.toLowerCase() ?? "").includes(lower) ||
        (user.vlEmail?.toLowerCase() ?? "").includes(lower) ||
        (user.userId?.toLowerCase() ?? "").includes(lower)
      )
    })
  })()

  const openCreateModal = () => {
    setFormData({
      firstName: "",
      lastName: "",
      dsbEmail: "",
      dsbPassword: "",
      dsbConfirmPassword: "",
      vlEmail: "",
      vlPassword: "",
      vlConfirmPassword: "",
      dsbUserRole: "driver",
      isOperator: false,
      isAccountOwner: false,
    })
    setCreateError("")
    setShowCreateModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setFormData({
      firstName: "",
      lastName: "",
      dsbEmail: "",
      dsbPassword: "",
      dsbConfirmPassword: "",
      vlEmail: "",
      vlPassword: "",
      vlConfirmPassword: "",
      dsbUserRole: "driver",
      isOperator: false,
      isAccountOwner: false,
    })
    setCreateError("")
  }

  const openEditModal = (user) => {
    setSelectedUser(user)
    setEditFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      dsbEmail: user.dsbEmail || "",
      dsbUserRole: user.dsbUserRole || "driver",
      isOperator: Boolean(user.isOperator),
      isAccountOwner: Boolean(user.isAccountOwner),
    })
    setEditError("")
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setSelectedUser(null)
    setEditFormData({
      firstName: "",
      lastName: "",
      dsbEmail: "",
      dsbUserRole: "driver",
      isOperator: false,
      isAccountOwner: false,
    })
    setEditError("")
  }

  const openDeleteModal = (user) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setSelectedUser(null)
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleEditInputChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleCreateUser = async () => {
    setCreatingUser(true)
    setCreateError("")

    try {
      const response = await api.createUser(formData)

      const data = await response.json()

      if (response.ok) {
        success("User created successfully!")
        closeCreateModal()
        // Refresh users list
        fetchUsers()
        // Reset all users cache to refetch
        setAllUsers([])
        isFetchingAllRef.current = false
      } else {
        setCreateError(data.error || "Failed to create user")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      setCreateError("Something went wrong while creating the user.")
    } finally {
      setCreatingUser(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setUpdatingUser(true)
    setEditError("")

    try {
      const updateData = {
        userId: selectedUser.userId,
        ...editFormData,
      }

      const response = await api.updateUser(updateData)

      const data = await response.json()

      if (response.ok) {
        success("User updated successfully!")
        closeEditModal()
        // Refresh users list
        fetchUsers()
        // Reset all users cache to refetch
        setAllUsers([])
        isFetchingAllRef.current = false
      } else {
        setEditError(data.error || "Failed to update user")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      setEditError("Something went wrong while updating the user.")
    } finally {
      setUpdatingUser(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setDeletingUser(true)

    try {
      const response = await api.deleteUser({
        userId: selectedUser.userId,
      })

      const data = await response.json()

      if (response.ok) {
        success("User deleted successfully!")
        closeDeleteModal()
        // Refresh users list
        fetchUsers()
        // Reset all users cache to refetch
        setAllUsers([])
        isFetchingAllRef.current = false
      } else {
        toastError(data.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toastError("Something went wrong while deleting the user.")
    } finally {
      setDeletingUser(false)
    }
  }

  const handleNextPage = () => {
    const nextIndex = pageIndex + 1

    // ✅ Already cached → NO API
    if (pages[nextIndex]) {
      setUsers(pages[nextIndex])
      setPageIndex(nextIndex)
      setHasNextPage(!!lastKeys[nextIndex])
      return
    }

    // ❌ Not cached → API call
    const currentLastKey = lastKeys[pageIndex]
    if (currentLastKey) {
      fetchUsers(currentLastKey, nextIndex)
    }
  }


  const handlePrevPage = () => {
    if (pageIndex === 0) return

    const prevIndex = pageIndex - 1
    setUsers(pages[prevIndex])
    setPageIndex(prevIndex)
    setHasNextPage(!!lastKeys[prevIndex])
  }



  const rangeStart = users.length === 0 ? 0 : pageIndex * pageSize + 1
  const rangeEnd = pageIndex * pageSize + users.length
  const knownPageCount = Math.max(pages.filter(Boolean).length, pageIndex + 1)
  const pageButtons = Array.from(
    { length: knownPageCount + (hasNextPage || pages[pageIndex + 1] ? 1 : 0) },
    (_, i) => i
  )

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
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 lg:p-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 lg:h-6 lg:w-6 text-red-600 mr-3 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-red-800">Error Loading Users</h3>
              <p className="text-red-700 mt-1 text-sm lg:text-base">{error}</p>
              <button
                type="button"
                onClick={() => fetchUsers()}
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
    <div className="space-y-4 lg:space-y-8">
      {/* Header + actions */}
      <div className="space-y-3 lg:space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-slate-800 mb-1 flex items-center gap-2 lg:gap-3 text-left">
            <Users className="h-6 w-6 lg:h-10 lg:w-10 text-blue-600 shrink-0" />
            <span>Users</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500">
            <span>
              Showing {rangeStart}-{rangeEnd} users
              {hasNextPage ? " (more available)" : ""}
            </span>
            {searchLoading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>
                  Loading search data... ({fetchProgress.current}/{fetchProgress.total})
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => fetchUsers()}
            className="flex-1 sm:flex-none px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="flex-1 sm:flex-none px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="sm:hidden">Create</span>
            <span className="hidden sm:inline">Create User</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <input
          type="text"
          placeholder={
            allUsers.length > 0
              ? `Search through all ${allUsers.length} users...`
              : "Search by name, email, or ID..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm sm:text-base py-2.5 pl-4 pr-11 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
        <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {search && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-blue-800 text-sm">
            Found {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} matching &quot;{search}&quot;
            {allUsers.length > 0
              ? ` (searching through ${allUsers.length} total users)`
              : " (searching current page only)"}
          </p>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] lg:min-w-[900px]">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">User ID</th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">First Name</th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Last Name</th>
                <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Dashboard Email</th>
                <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Role</th>
                <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Account Owner</th>
                <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Operator</th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 sm:py-12 text-center text-slate-500">
                    <Users className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-slate-300" />
                    <p className="text-sm sm:text-lg">
                      {search
                        ? `No users found matching "${search}"`
                        : "No users found"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr
                    key={user.userId}
                    className="bg-white hover:bg-blue-50/60 transition-colors duration-200"
                  >
                    {/* User ID */}
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-[10px] sm:text-xs lg:text-sm shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-[11px] sm:text-xs lg:text-sm font-medium text-slate-800 truncate max-w-[9rem] sm:max-w-none">
                          {user.userId}
                        </span>
                      </div>
                    </td>

                    {/* First Name */}
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-slate-800">
                        {user.firstName || "N/A"}
                      </div>
                    </td>

                    {/* Last Name */}
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-slate-800">
                        {user.lastName || "N/A"}
                      </div>
                    </td>

                    {/* Dashboard Email */}
                    <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-slate-800 whitespace-nowrap">
                        {user.dsbEmail || "N/A"}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 lg:px-3 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${user.dsbUserRole === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                          }`}
                      >
                        {user.dsbUserRole || "driver"}
                      </span>
                    </td>

                    {/* Account Owner */}
                    <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 lg:px-3 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${user.isAccountOwner
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {user.isAccountOwner ? (
                          <>
                            <Crown className="h-3 w-3 mr-1" />
                            Yes
                          </>
                        ) : (
                          "No"
                        )}
                      </span>
                    </td>

                    {/* Operator */}
                    <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 lg:px-3 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${user.isOperator
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {user.isOperator ? (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Yes
                          </>
                        ) : (
                          "No"
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="p-1 sm:p-1.5 lg:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(user)}
                          className="p-1 sm:p-1.5 lg:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {(hasNextPage || users.length > 0) && !search && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 bg-white rounded-xl shadow-sm border border-slate-200/80 px-2.5 py-2.5 sm:px-5 sm:py-4 lg:px-6">
          <div className="flex items-center text-[11px] sm:text-sm text-slate-600">
            <span>
              Showing {rangeStart}-{rangeEnd} users
              {hasNextPage ? " (more available)" : ""}
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={pageIndex === 0}
              className={`flex items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium border transition-colors ${pageIndex === 0
                ? "text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50"
                : "text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600 bg-white"
                }`}
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-0.5" />
              Prev
            </button>

            {pageButtons.map((page) => {
              const isActive = page === pageIndex
              const canJump =
                page === pageIndex ||
                !!pages[page] ||
                (page === pageIndex + 1 && (hasNextPage || !!pages[pageIndex + 1]))

              return (
                <button
                  key={page}
                  type="button"
                  disabled={!canJump}
                  onClick={() => {
                    if (page === pageIndex) return
                    if (pages[page]) {
                      setUsers(pages[page])
                      setPageIndex(page)
                      setHasNextPage(!!lastKeys[page])
                      return
                    }
                    if (page === pageIndex + 1) {
                      handleNextPage()
                    }
                  }}
                  className={`min-w-7 sm:min-w-8 h-7 sm:h-8 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-sm font-semibold border transition-colors ${isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent"
                    : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                    } ${!canJump ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {page + 1}
                </button>
              )
            })}

            <button
              type="button"
              onClick={handleNextPage}
              disabled={!hasNextPage && !pages[pageIndex + 1]}
              className={`flex items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium border transition-colors ${!hasNextPage && !pages[pageIndex + 1]
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


      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-6xl max-h-[92dvh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-center pt-2 pb-1 sm:hidden shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            <div className="px-3 py-3 sm:p-6 border-b border-gray-200 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base sm:text-2xl font-bold text-gray-800">Create New User</h3>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="flex flex-col lg:flex-row">
                {/* Left Side - User Roles Info (desktop / tablet) */}
                <div className="hidden lg:block lg:w-1/2 p-6 lg:border-r border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">User Roles & Permissions</h3>
                    <p className="text-sm text-gray-600">Understanding different user types and their access levels</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Admin</h4>
                      </div>
                      <p className="text-sm text-blue-700">
                        Has full administrative access to the account. Can manage all users, settings, and billing.
                      </p>
                    </div>

                    <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold text-purple-900">Driver</h4>
                      </div>
                      <p className="text-sm text-purple-700">
                        Responsible for delivery routes and machine restocking. Limited access to operational features.
                      </p>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="h-5 w-5 text-gray-600" />
                        <h4 className="font-semibold text-gray-900">Security Note</h4>
                      </div>
                      <p className="text-sm text-gray-700">
                        Each user needs both Dashboard and VendLive credentials for full system access.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compact roles note on mobile */}
                <div className="lg:hidden mx-3 mt-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Each user needs Dashboard and VendLive credentials. Admins have full access; Drivers have operational access.
                    </p>
                  </div>
                </div>

                {/* Right Side - Form */}
                <div className="lg:w-1/2 p-3 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Personal Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">First Name</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          placeholder="Enter first name"
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Last Name</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          placeholder="Enter last name"
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Credentials */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Dashboard Credentials
                    </h3>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Dashboard Email</label>
                      <input
                        type="email"
                        value={formData.dsbEmail}
                        onChange={(e) => handleInputChange("dsbEmail", e.target.value)}
                        placeholder="user@frydge.io"
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Dashboard Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.dsbPassword ? "text" : "password"}
                            value={formData.dsbPassword}
                            onChange={(e) => handleInputChange("dsbPassword", e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("dsbPassword")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.dsbPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Confirm Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.dsbConfirmPassword ? "text" : "password"}
                            value={formData.dsbConfirmPassword}
                            onChange={(e) => handleInputChange("dsbConfirmPassword", e.target.value)}
                            placeholder="Confirm password"
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("dsbConfirmPassword")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.dsbConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VendLive Credentials */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      VendLive Credentials
                    </h3>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">VendLive Email</label>
                      <input
                        type="email"
                        value={formData.vlEmail}
                        onChange={(e) => handleInputChange("vlEmail", e.target.value)}
                        placeholder="user@frydge.io"
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">VendLive Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.vlPassword ? "text" : "password"}
                            value={formData.vlPassword}
                            onChange={(e) => handleInputChange("vlPassword", e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("vlPassword")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.vlPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Confirm Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.vlConfirmPassword ? "text" : "password"}
                            value={formData.vlConfirmPassword}
                            onChange={(e) => handleInputChange("vlConfirmPassword", e.target.value)}
                            placeholder="Confirm password"
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("vlConfirmPassword")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.vlConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Role & Permissions */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Role & Permissions
                    </h3>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">User Role</label>
                      <select
                        value={formData.dsbUserRole}
                        onChange={(e) => handleInputChange("dsbUserRole", e.target.value)}
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="driver">Driver</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Crown className="h-4 w-4 text-blue-600 mr-2 shrink-0" />
                          <label htmlFor="isAccountOwner" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">
                            Account Owner
                          </label>
                        </div>
                        <input
                          id="isAccountOwner"
                          type="checkbox"
                          checked={formData.isAccountOwner}
                          onChange={(e) => handleInputChange("isAccountOwner", e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-green-600 mr-2 shrink-0" />
                          <label htmlFor="isOperator" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">
                            Operator
                          </label>
                        </div>
                        <input
                          id="isOperator"
                          type="checkbox"
                          checked={formData.isOperator}
                          onChange={(e) => handleInputChange("isOperator", e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {createError && (
                    <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start sm:items-center">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mr-2 shrink-0 mt-0.5 sm:mt-0" />
                        <div>
                          <h3 className="text-xs sm:text-sm font-medium text-red-800">Error</h3>
                          <p className="text-red-700 text-xs sm:text-sm mt-1">{createError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-3 py-3 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 shrink-0 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6">
              <button
                type="button"
                onClick={closeCreateModal}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateUser}
                disabled={creatingUser}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {creatingUser && <Loader2 className="h-4 w-4 animate-spin" />}
                {creatingUser ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-center pt-2 pb-1 sm:hidden shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            <div className="px-3 py-3 sm:p-6 border-b border-gray-200 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base sm:text-2xl font-bold text-gray-800">Edit User</h3>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 space-y-4 sm:space-y-6">
              {/* User ID (Read-only) */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">User ID (Cannot be changed)</label>
                <input
                  type="text"
                  value={selectedUser.userId}
                  disabled
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>

              {/* Personal Information */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">First Name</label>
                    <input
                      type="text"
                      value={editFormData.firstName}
                      onChange={(e) => handleEditInputChange("firstName", e.target.value)}
                      placeholder="Enter first name"
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Last Name</label>
                    <input
                      type="text"
                      value={editFormData.lastName}
                      onChange={(e) => handleEditInputChange("lastName", e.target.value)}
                      placeholder="Enter last name"
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dashboard Email */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Dashboard Email</h3>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Dashboard Email</label>
                  <input
                    type="email"
                    value={editFormData.dsbEmail}
                    onChange={(e) => handleEditInputChange("dsbEmail", e.target.value)}
                    placeholder="user@frydge.io"
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Role & Permissions */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Role & Permissions
                </h3>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">User Role</label>
                  <select
                    value={editFormData.dsbUserRole}
                    onChange={(e) => handleEditInputChange("dsbUserRole", e.target.value)}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="driver">Driver</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Crown className="h-4 w-4 text-blue-600 mr-2 shrink-0" />
                      <label htmlFor="editIsAccountOwner" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">
                        Account Owner
                      </label>
                    </div>
                    <input
                      id="editIsAccountOwner"
                      type="checkbox"
                      checked={editFormData.isAccountOwner}
                      onChange={(e) => handleEditInputChange("isAccountOwner", e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-green-600 mr-2 shrink-0" />
                      <label htmlFor="editIsOperator" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">
                        Operator
                      </label>
                    </div>
                    <input
                      id="editIsOperator"
                      type="checkbox"
                      checked={editFormData.isOperator}
                      onChange={(e) => handleEditInputChange("isOperator", e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {editError && (
                <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start sm:items-center">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mr-2 shrink-0 mt-0.5 sm:mt-0" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-red-800">Error</h3>
                      <p className="text-red-700 text-xs sm:text-sm mt-1">{editError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-3 py-3 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 shrink-0 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6">
              <button
                type="button"
                onClick={closeEditModal}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateUser}
                disabled={updatingUser}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {updatingUser && <Loader2 className="h-4 w-4 animate-spin" />}
                {updatingUser ? "Updating..." : "Update User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden">
            <div className="flex justify-center pt-2 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>
            <div className="p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 text-center mb-2">Delete User</h3>
              <p className="text-gray-600 text-center mb-5 sm:mb-6 text-sm sm:text-base break-words px-1">
                Are you sure you want to delete user &quot;{selectedUser.firstName} {selectedUser.lastName}&quot;? This action
                cannot be undone.
              </p>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={deletingUser}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {deletingUser && <Loader2 className="h-4 w-4 animate-spin" />}
                  {deletingUser ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <Loader />
      </div>
    }>
      <UsersPageContent />
    </Suspense>
  )
}
