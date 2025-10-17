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

function UsersPageContent() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [lastKey, setLastKey] = useState(null)
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
    fetchUsers()
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

        const response = await fetch(
          `/api/users?limit=20${currentLastKey ? `&lastKey=${encodeURIComponent(currentLastKey)}` : ""}`,
        )

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

  const fetchUsers = async (useLastKey = null) => {
    try {
      setLoading(true)
      setError("")
      console.log("Fetching users...")

      let apiUrl = `/api/users?limit=${pageSize}`
      if (useLastKey) {
        apiUrl += `&lastKey=${encodeURIComponent(useLastKey)}`
      }

      const response = await fetch(apiUrl)
      console.log("Client fetch response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Client received data:", data)

      // Handle different response structures
      const fetchedUsers = data.users || data.results || []
      const newLastKey = data.lastKey || null

      setUsers(fetchedUsers)
      setLastKey(newLastKey)
      setHasNextPage(!!newLastKey)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError(`Failed to load users: ${err.message}`)
      setUsers([])
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
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

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

      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

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
      const response = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.userId,
        }),
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
    if (hasNextPage && lastKey) {
      fetchUsers(lastKey)
    }
  }

  const handlePrevPage = () => {
    // For simplicity, refresh from beginning
    fetchUsers()
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
                onClick={() => fetchUsers()}
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
          <Users className="h-10 w-10 text-blue-600" />
          <span className="text-gray-800">Users</span>
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Showing {users.length} users</span>
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

      <div className="mb-6">
        <div className="flex justify-end gap-3">
          <button
            onClick={() => fetchUsers()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create User
          </button>
        </div>
      </div>

      <div className="mb-4 relative w-full p-[2px] rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center bg-white rounded-full px-3">
          <Search className="w-5 h-5 text-gray-500 mr-2 absolute right-3" />
          <input
            type="text"
            placeholder={
              allUsers.length > 0 ? `Search through all ${allUsers.length} users...` : "Search by name, email, or ID..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 bg-transparent outline-none text-gray-900"
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

      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">User ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">First Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Last Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Dashboard Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Account Owner</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Operator</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">{search ? `No users found matching "${search}"` : "No users found"}</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr
                    key={user.userId}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition-colors duration-200`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.userId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.firstName || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.lastName || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.dsbEmail || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.dsbUserRole === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.dsbUserRole || "driver"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.isAccountOwner ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
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
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.isOperator ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
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
        <div className="mt-8 flex items-center justify-between bg-white rounded-lg shadow-lg px-6 py-4">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Showing {users.length} users {hasNextPage ? "(more available)" : ""}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Refresh
            </button>
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">Create New User</h3>
                <button onClick={closeCreateModal} className="p-2 text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex h-full">
              {/* Left Side - User Roles Info */}
              <div className="w-1/2 p-6 border-r border-gray-200">
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

              {/* Right Side - Form */}
              <div className="w-1/2 p-6 space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        placeholder="Enter first name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        placeholder="Enter last name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Dashboard Credentials */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Dashboard Credentials
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard Email</label>
                    <input
                      type="email"
                      value={formData.dsbEmail}
                      onChange={(e) => handleInputChange("dsbEmail", e.target.value)}
                      placeholder="user@frydge.io"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.dsbPassword ? "text" : "password"}
                          value={formData.dsbPassword}
                          onChange={(e) => handleInputChange("dsbPassword", e.target.value)}
                          placeholder="Enter password"
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("dsbPassword")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.dsbPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.dsbConfirmPassword ? "text" : "password"}
                          value={formData.dsbConfirmPassword}
                          onChange={(e) => handleInputChange("dsbConfirmPassword", e.target.value)}
                          placeholder="Confirm password"
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("dsbConfirmPassword")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    VendLive Credentials
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">VendLive Email</label>
                    <input
                      type="email"
                      value={formData.vlEmail}
                      onChange={(e) => handleInputChange("vlEmail", e.target.value)}
                      placeholder="user@frydge.io"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">VendLive Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.vlPassword ? "text" : "password"}
                          value={formData.vlPassword}
                          onChange={(e) => handleInputChange("vlPassword", e.target.value)}
                          placeholder="Enter password"
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("vlPassword")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.vlPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.vlConfirmPassword ? "text" : "password"}
                          value={formData.vlConfirmPassword}
                          onChange={(e) => handleInputChange("vlConfirmPassword", e.target.value)}
                          placeholder="Confirm password"
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("vlConfirmPassword")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Role & Permissions
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
                    <select
                      value={formData.dsbUserRole}
                      onChange={(e) => handleInputChange("dsbUserRole", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="driver">Driver</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Crown className="h-4 w-4 text-blue-600 mr-2" />
                        <label htmlFor="isAccountOwner" className="text-sm font-medium text-gray-700 cursor-pointer">
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

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 text-green-600 mr-2" />
                        <label htmlFor="isOperator" className="text-sm font-medium text-gray-700 cursor-pointer">
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
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <p className="text-red-700 text-sm mt-1">{createError}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeCreateModal}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={creatingUser}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">Edit User</h3>
                <button onClick={closeEditModal} className="p-2 text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User ID (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User ID (Cannot be changed)</label>
                <input
                  type="text"
                  value={selectedUser.userId}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Personal Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={editFormData.firstName}
                      onChange={(e) => handleEditInputChange("firstName", e.target.value)}
                      placeholder="Enter first name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={editFormData.lastName}
                      onChange={(e) => handleEditInputChange("lastName", e.target.value)}
                      placeholder="Enter last name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dashboard Email */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Dashboard Email</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard Email</label>
                  <input
                    type="email"
                    value={editFormData.dsbEmail}
                    onChange={(e) => handleEditInputChange("dsbEmail", e.target.value)}
                    placeholder="user@frydge.io"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Role & Permissions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Role & Permissions
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
                  <select
                    value={editFormData.dsbUserRole}
                    onChange={(e) => handleEditInputChange("dsbUserRole", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="driver">Driver</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Crown className="h-4 w-4 text-blue-600 mr-2" />
                      <label htmlFor="editIsAccountOwner" className="text-sm font-medium text-gray-700 cursor-pointer">
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

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-green-600 mr-2" />
                      <label htmlFor="editIsOperator" className="text-sm font-medium text-gray-700 cursor-pointer">
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
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="text-red-700 text-sm mt-1">{editError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={updatingUser}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete User</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete user "{selectedUser.firstName} {selectedUser.lastName}"? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={deletingUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
