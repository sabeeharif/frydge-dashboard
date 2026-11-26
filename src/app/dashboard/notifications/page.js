"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  AlertCircle,
  Loader2,
  Search,
  Plus,
  X,
  User,
  Lock,
  Shield,
  Crown,
  Check,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react"
import Loader from "@/app/components/Loader"
import { useToast } from "@/app/contexts/ToastContext"
import { AuthService, api } from "@/app/lib/auth"

const USER_DATA_KEY = 'frydge-user-data';

function UsersPageContent() {
  const [drivers, setDrivers] = useState([]);
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [pages, setPages] = useState([])   // cache pages
  const [pageIndex, setPageIndex] = useState(0)
  const [lastKeys, setLastKeys] = useState([]) // lastKey per page
  const [hasNextPage, setHasNextPage] = useState(false)
  const [viewingNotification, setViewingNotification] = useState(null);
  const [machines, setMachines] = useState()
  const [selectedMachines, setSelectedMachines] = useState([])
  const [errors, setErrors] = useState({
    machine: "",
    primePlanogram: "",
  });


  const [allNotifications, setAllNotifications] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 })
  const searchTimeoutRef = useRef(null)
  const isFetchingAllRef = useRef(false)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [creatingNotification, setCreatingNotification] = useState(false)
  const [updatingNotification, setUpdatingNotification] = useState(false)
  const [deletingNotification, setDeletingNotification] = useState(false)
  const [createError, setCreateError] = useState("")
  const [editError, setEditError] = useState("")

  // Selected notification for edit/delete
  const [selectedNotification, setSelectedNotification] = useState(null)

  // Form states
  const [formData, setFormData] = useState({
    createdForId: "",
    createdForName: "",
    notificationTitle: "",
    notificationDescription: "",
    notificationDate: "",
    createdById: "",
    createdByName: "",
    machines: []
  });

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return isNaN(date) ? "Invalid Date" : date.toLocaleString('de-DE');
  };

  // Edit form states (only editable fields)
  const [editFormData, setEditFormData] = useState({
    notificationId: "",
    notificationTitle: "",
    notificationDescription: "",
    notificationDate: "",
    createdById: "",
    createdByName: "",
    createdForId: "",
    createdForName: "",
    checked: false,
    checkedDateTime: "",
    createdAt: "",
    machines: []
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
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (notifications.length > 0 && !isFetchingAllRef.current && allNotifications.length === 0) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchAllNotificationsProgressively()
      }, 500)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [notifications.length])

  const fetchAllNotificationsProgressively = async () => {
    if (isFetchingAllRef.current) return

    isFetchingAllRef.current = true
    setSearchLoading(true)

    try {
      let allFetchedNotifications = []
      let currentLastKey = null
      let pageCount = 0
      const maxPages = 50

      setFetchProgress({ current: 0, total: maxPages })

      do {
        pageCount++
        setFetchProgress({ current: pageCount, total: maxPages })

        const response = await api.getNotifications({
          limit: 20,
          lastKey: currentLastKey
        })

        if (response.ok) {
          const data = await response.json()
          const newNotifications = data.notifications || data.results || []
          allFetchedNotifications = [...allFetchedNotifications, ...newNotifications]
          setAllNotifications([...allFetchedNotifications])
          currentLastKey = data.lastKey || null
        } else {
          break
        }

        if (pageCount < maxPages && currentLastKey) {
          await new Promise((resolve) => setTimeout(resolve, 300))
        }
      } while (currentLastKey && pageCount < maxPages)

      console.log(`Successfully fetched ${allFetchedNotifications.length} notifications for search`)
    } catch (error) {
      console.error("Error fetching all notifications:", error)
    } finally {
      setSearchLoading(false)
      isFetchingAllRef.current = false
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await api.getDrivers()
      const data = await response.json();

      // Assuming the API returns an array or an object with a drivers property
      const driversList = Array.isArray(data) ? data : (data.drivers || []);
      setDrivers(driversList);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  const fetchMachines = async (page) => {
    try {
      // setLoading(true);
      const pageSize = 100
      console.log("Fetching machines for page:", page);
      const response = await api.getMachines({});
      console.log("Client fetch response status:", response.status);
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      console.log("Client received data:", {
        count: data.count,
        resultsLength: data.results?.length,
      });
      setMachines(data.results || []);
    } catch (err) {
      console.error("Error fetching machines:", err);
      setMachines([]);
    } finally {
      // setLoading(false);
    }
  };
  useEffect(() => {
    fetchDrivers();
    fetchMachines()
  }, []);


  const filteredNotifications = (() => {
    if (!search) {
      return notifications
    }

    const searchData = allNotifications.length > 0 ? allNotifications : notifications
    const lower = search.toLowerCase()

    return searchData.filter((notification) => {
      return (
        (notification.notificationTitle?.toLowerCase() ?? "").includes(lower) ||
        (notification.notificationDescription?.toLowerCase() ?? "").includes(lower) ||
        (notification.createdByName?.toLowerCase() ?? "").includes(lower) ||
        (notification.createdForName?.toLowerCase() ?? "").includes(lower) ||
        (notification.notificationId?.toLowerCase() ?? "").includes(lower) ||
        (notification.notificationDate?.toLowerCase() ?? "").includes(lower)
      )
    })
  })()

  const resetAndFetchNotifications = async () => {
    setPages([])
    setLastKeys([])
    setPageIndex(0)
    setAllNotifications([])
    isFetchingAllRef.current = false
    await fetchNotifications(null, 0)
  }

  const openCreateModal = () => {
    setFormData({
      createdForId: "",
      createdForName: "",
      notificationTitle: "",
      notificationDescription: "",
      notificationDate: "",
      createdById: "",
      createdByName: "",
      machines: []
    })
    setCreateError("")
    setShowCreateModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setFormData({
      createdForId: "",
      createdForName: "",
      notificationTitle: "",
      notificationDescription: "",
      notificationDate: "",
      createdById: "",
      createdByName: "",
      machines: []
    })
    setCreateError("")
  }

  const openEditModal = (notification) => {
    setSelectedNotification(notification)
    setEditFormData({
      notificationId: notification.notificationId || "",
      notificationTitle: notification.notificationTitle || "",
      notificationDescription: notification.notificationDescription || "",
      notificationDate: notification.notificationDate || "",
      createdById: notification.createdById || "",
      createdByName: notification.createdByName || "",
      createdForId: notification.createdForId || "",
      createdForName: notification.createdForName || "",
      checked: notification.checked,
      checkedDateTime: notification.checkedDateTime || "",
      createdAt: notification.createdAt || "",
      machines: notification.machines
    })
    setEditError("")
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setSelectedNotification(null)
    setEditFormData({
      notificationId: "",
      notificationTitle: "",
      notificationDescription: "",
      notificationDate: "",
      createdById: "",
      createdByName: "",
      createdForId: "",
      createdForName: "",
      checked: false,
      checkedDateTime: "",
      createdAt: "",
      machines: []
    })
    setEditError("")
  }

  const openDeleteModal = (notification) => {
    setSelectedNotification(notification)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setSelectedNotification(null)
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

  useEffect(() => {
    fetchNotifications(null, 0)
  }, [])

  const fetchNotifications = async (useLastKey = null, targetIndex = 0) => {
    try {
      setLoading(true)
      setError("")

      const response = await api.getNotifications({
        limit: pageSize,
        lastKey: useLastKey,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const fetchedNotifications = data.notifications || data.results || []
      const newLastKey = data.lastKey || null

      // ✅ Cache page
      setPages((prev) => {
        const updated = [...prev]
        updated[targetIndex] = fetchedNotifications
        return updated
      })

      // ✅ Cache lastKey per page
      setLastKeys((prev) => {
        const updated = [...prev]
        updated[targetIndex] = newLastKey
        return updated
      })

      setNotifications(fetchedNotifications)
      setHasNextPage(!!newLastKey)
      setPageIndex(targetIndex)

    } catch (err) {
      setError(`Failed to load notifications: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNotification = async () => {
    setCreatingNotification(true)
    setCreateError("")

    try {

      const rawData = localStorage.getItem('frydge-user-data');
      const userData = rawData ? JSON.parse(rawData) : {};

      const finalPayload = {
        ...formData,
        createdById: userData.userId,
        createdByName: `${userData.firstName} ${userData.lastName}`,
        createdAt: new Date().toISOString() // Ensure German time logic if needed
      };

      const response = await api.createNotification(finalPayload)

      const data = await response.json()

      if (response.ok) {
        success("Notification created successfully!")
        closeCreateModal()
        // Refresh notifications list
        await resetAndFetchNotifications()
      } else {
        setCreateError(data.error || "Failed to create notification")
      }
    } catch (error) {
      console.error("Error creating notification:", error)
      setCreateError("Something went wrong while creating the notification.")
    } finally {
      setCreatingNotification(false)
    }
  }

  const handleUpdateNotification = async () => {
    if (!selectedNotification) return

    setUpdatingNotification(true)
    setEditError("")

    try {
      const updateData = {
        notificationId: selectedNotification.notificationId,
        ...editFormData,
      }

      const response = await api.updateNotification(updateData)

      const data = await response.json()

      if (response.ok) {
        success("Notification updated successfully!")
        closeEditModal()
        // Refresh notifications list
        await resetAndFetchNotifications()
      } else {
        setEditError(data.error || "Failed to update notification")
      }
    } catch (error) {
      console.error("Error updating notification:", error)
      setEditError("Something went wrong while updating the notification.")
    } finally {
      setUpdatingNotification(false)
    }
  }

  const handleDeleteNotification = async () => {
    if (!selectedNotification) return

    setDeletingNotification(true)

    try {
      const response = await api.deleteNotification({
        notificationId: selectedNotification.notificationId,
      })

      const data = await response.json()

      if (response.ok) {
        success("Notification deleted successfully!")
        closeDeleteModal()
        // Refresh notifications list
        await resetAndFetchNotifications()
      } else {
        toastError(data.error || "Failed to delete notification")
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      toastError("Something went wrong while deleting the notification.")
    } finally {
      setDeletingNotification(false)
    }
  }

  const handleNextPage = () => {
    const nextIndex = pageIndex + 1

    // ✅ Already cached → NO API
    if (pages[nextIndex]) {
      setNotifications(pages[nextIndex])
      setPageIndex(nextIndex)
      setHasNextPage(!!lastKeys[nextIndex])
      return
    }

    // ❌ Not cached → API call
    const currentLastKey = lastKeys[pageIndex]
    if (currentLastKey) {
      fetchNotifications(currentLastKey, nextIndex)
    }
  }


  const handlePrevPage = () => {
    if (pageIndex === 0) return

    const prevIndex = pageIndex - 1
    setNotifications(pages[prevIndex])
    setPageIndex(prevIndex)
    setHasNextPage(!!lastKeys[prevIndex])
  }

  const handleExcludeMachinesSelect = (e) => {
    const selectedIds = Array.from(
      e.target.selectedOptions
    ).map((option) => option.value);

    setFormData((prev) => {
      const existing = prev.machines || [];

      const newMachines = machines
        .filter((m) => selectedIds.includes(String(m.id)))
        .map((m) => ({
          machineId: m.id,
          friendlyName: m.friendlyName,
          venueName: m.venue?.name
        }));

      // merge + avoid duplicates
      const merged = [
        ...existing,
        ...newMachines,
      ].filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            (t) => t.machineId === item.machineId
          )
      );

      return {
        ...prev,
        machines: merged,
      };
    });
  };
  const handleEditMachinesSelect = (e) => {
    const selectedIds = Array.from(
      e.target.selectedOptions
    ).map((option) => option.value);

    setEditFormData((prev) => {
      const existing = prev.machines || [];

      const newMachines = machines
        .filter((m) => selectedIds.includes(String(m.id)))
        .map((m) => ({
          machineId: m.id,
          friendlyName: m.friendlyName,
          venueName: m.venue?.name
        }));

      // merge + avoid duplicates
      const merged = [
        ...existing,
        ...newMachines,
      ].filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            (t) => t.machineId === item.machineId
          )
      );

      return {
        ...prev,
        machines: merged,
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <Loader />
      </div>
    )
  }
  console.log(formData);
  if (error) {
    return (
      <div className="p-8 space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Notifications</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={() => fetchNotifications()}
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
      <div className="space-y-3 lg:space-y-0 lg:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-800 mb-1 lg:mb-2 flex items-center gap-2 lg:gap-3 text-left">
            <Bell className="h-6 w-6 lg:h-10 lg:w-10 text-blue-600 shrink-0" />
            <span className="text-gray-800">Notifications</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
            <span>
              Showing {search ? filteredNotifications.length : notifications.length} notifications
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

        <div className="flex gap-2 sm:gap-3 lg:justify-end">
          <button
            onClick={resetAndFetchNotifications}
            className="flex-1 sm:flex-none px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-none px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="sm:hidden">Create</span>
            <span className="hidden sm:inline">Create Notification</span>
          </button>
        </div>
      </div>

      <div className="relative w-full p-[2px] rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center bg-white rounded-full px-3">
          <Search className="w-5 h-5 text-gray-500 mr-2 absolute right-3" />
          <input
            type="text"
            placeholder={
              allNotifications.length > 0 ? `Search through all ${allNotifications.length} notifications...` : "Search by title, description, or name..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm lg:text-base py-2 bg-transparent outline-none text-gray-900"
          />
        </div>
      </div>

      {search && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            Found {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""} matching "{search}"
            {allNotifications.length > 0
              ? ` (searching through ${allNotifications.length} total notifications)`
              : " (searching current page only)"}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] lg:min-w-[900px]">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Notification Date</th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Title</th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Description</th>
                <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Created By</th>
                <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Notification For</th>
                <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Checked</th>
                <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Checked Date</th>
                <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Created At</th>
                <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Updated At</th>
                <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 sm:py-12 text-center text-gray-500">
                    <Bell className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                    <p className="text-sm sm:text-lg">{search ? `No notifications found matching "${search}"` : "No notifications found"}</p>
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notification, index) => (
                  <tr
                    key={notification.notificationId}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50 transition-colors duration-200`}
                  >
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-gray-900">{notification.notificationDate || "N/A"}</div>
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-gray-900">{notification.notificationTitle || "N/A"}</div>
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingNotification(notification)}
                          className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Description"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-gray-900">{notification.createdByName || "N/A"}</div>
                    </td>
                    <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-gray-900">{notification.createdForName || "N/A"}</div>
                    </td>
                    <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${notification.checked ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {notification.checked ? (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Yes
                          </>
                        ) : (
                          "No"
                        )}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-gray-900">{formatDate(notification.checkedDateTime)}</div>
                    </td>
                    <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-gray-900">{formatDate(notification.createdAt)}</div>
                    </td>
                    <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-gray-900">{formatDate(notification.updatedAt)}</div>
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => openEditModal(notification)}
                          className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Notification"
                        >
                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(notification)}
                          className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

      {/* View Description Modal */}
      {viewingNotification && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-center pt-2 pb-1 sm:hidden shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Modal Header */}
            <div className="px-3 py-3 sm:p-6 border-b border-gray-200 flex items-center justify-between gap-3 shrink-0">
              <h3 className="text-base sm:text-xl font-bold text-gray-800 truncate">
                {viewingNotification.notificationTitle || "Description"}
              </h3>
              <button
                type="button"
                onClick={() => setViewingNotification(null)}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 shrink-0"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-8">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                {viewingNotification.notificationDescription || viewingNotification.description || "No description available."}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-3 py-3 sm:p-6 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6">
              <button
                type="button"
                onClick={() => setViewingNotification(null)}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {(hasNextPage || notifications.length > 0) && !search && (
        <div className="mt-4 sm:mt-6 lg:mt-8 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 bg-white rounded-xl shadow-sm border border-slate-200/80 px-2.5 py-2.5 sm:px-5 sm:py-4 lg:px-6">
          <div className="flex items-center text-[11px] sm:text-sm text-slate-600">
            <span>
              Showing {notifications.length} notifications
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

            <button
              type="button"
              className="min-w-7 sm:min-w-8 h-7 sm:h-8 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-sm font-semibold border bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent"
            >
              {pageIndex + 1}
            </button>

            {(hasNextPage || pages[pageIndex + 1]) && (
              <button
                type="button"
                onClick={handleNextPage}
                className="min-w-7 sm:min-w-8 h-7 sm:h-8 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-sm font-semibold border bg-white text-slate-700 border-slate-200 hover:border-blue-300"
              >
                {pageIndex + 2}
              </button>
            )}

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

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-3xl max-h-[92dvh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-center pt-2 pb-1 sm:hidden shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Modal Header */}
            <div className="px-3 py-3 sm:p-6 border-b border-gray-200 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base sm:text-2xl font-bold text-gray-800">Create New Notification</h3>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable Area */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-8">
              <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">

                {/* Driver Selection */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Select Driver</label>
                  <select
                    value={formData.createdForId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedDriver = drivers.find(d => d.userId === selectedId);

                      // Update ID
                      handleInputChange("createdForId", selectedId);

                      // Update Name
                      const fullName = selectedDriver
                        ? `${selectedDriver.firstName} ${selectedDriver.lastName}`
                        : "";
                      handleInputChange("createdForName", fullName);
                    }}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select a driver...</option>
                    {drivers.map((driver) => (
                      <option key={driver.userId} value={driver.userId}>
                        {driver.firstName} {driver.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* select machines */}
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Select machines
                  </label>

                  <select
                    multiple
                    value={formData.machines.map((m) =>
                      String(m.machineId)
                    )}
                    onChange={handleExcludeMachinesSelect}
                    className="w-full min-h-[120px] sm:min-h-[160px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {machines.filter(
                      (machine) =>
                        !formData.machines.some(
                          (item) => item.machineId === machine.id
                        )
                    ).map((machine) => (
                      <option
                        key={machine.id}
                        value={machine.id}
                      >
                        {machine.friendlyName}
                      </option>
                    ))}
                  </select>

                  {/* Preview */}
                  {formData.machines.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.machines.map((machine) => (
                        <div
                          key={machine.machineId}
                          className="flex items-center gap-2 rounded-full bg-blue-100 border border-blue-300 px-2.5 sm:px-3 py-1 text-xs text-blue-700 max-w-full"
                        >
                          <span className="truncate">{machine.friendlyName}</span>

                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                machines: prev.machines.filter(
                                  (m) => m.machineId !== machine.machineId
                                ),
                              }));
                            }}
                            className="font-bold hover:text-red-600 shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date Picker Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Schedule Date</label>
                  <input
                    type="date"
                    value={formData.notificationDate}
                    onChange={(e) => handleInputChange("notificationDate", e.target.value)}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Notification Title</label>
                  <input
                    type="text"
                    value={formData.notificationTitle}
                    onChange={(e) => handleInputChange("notificationTitle", e.target.value)}
                    placeholder="e.g., Maintenance Required"
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Notification Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.notificationDescription}
                    onChange={(e) => handleInputChange("notificationDescription", e.target.value)}
                    placeholder="Provide detailed instructions here..."
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y transition-all outline-none"
                  />
                </div>

                {/* Error Message Section */}
                {createError && (
                  <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-red-800">Submission Error</h3>
                        <p className="text-red-700 text-xs sm:text-sm mt-1">{createError}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-3 py-3 sm:p-6 border-t border-gray-200 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6">
              <button
                type="button"
                onClick={closeCreateModal}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm sm:text-base bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNotification}
                disabled={creatingNotification}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {creatingNotification ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  "Send Notification"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notification Modal */}
      {showEditModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-center pt-2 pb-1 sm:hidden shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            <div className="px-3 py-3 sm:p-6 border-b border-gray-200 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base sm:text-2xl font-bold text-gray-800">Edit Notification</h3>
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
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Notification Title</label>
                <input
                  type="text"
                  value={editFormData.notificationTitle}
                  onChange={(e) => handleEditInputChange("notificationTitle", e.target.value)}
                  placeholder="Enter notification title"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Select machines
                </label>

                <select
                  multiple
                  value={editFormData?.machines?.map((m) =>
                    String(m?.machineId)
                  )}
                  onChange={handleEditMachinesSelect}
                  className="w-full min-h-[120px] sm:min-h-[160px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {machines?.filter(
                    (machine) =>
                      !editFormData?.machines?.some(
                        (item) => item?.machineId === machine?.id
                      )
                  ).map((machine) => (
                    <option
                      key={machine?.id}
                      value={machine?.id}
                    >
                      {machine?.friendlyName}
                    </option>
                  ))}
                </select>

                {/* Preview */}
                {editFormData?.machines?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {editFormData?.machines?.map((machine) => (
                      <div
                        key={machine?.machineId}
                        className="flex items-center gap-2 rounded-full bg-blue-100 border border-blue-300 px-2.5 sm:px-3 py-1 text-xs text-blue-700 max-w-full"
                      >
                        <span className="truncate">{machine?.friendlyName}</span>

                        <button
                          type="button"
                          onClick={() => {
                            setEditFormData((prev) => ({
                              ...prev,
                              machines: prev.machines.filter(
                                (m) => m.machineId !== machine.machineId
                              ),
                            }));
                          }}
                          className="font-bold hover:text-red-600 shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Notification Description
                </label>
                <textarea
                  rows={4}
                  value={editFormData.notificationDescription}
                  onChange={(e) => handleEditInputChange("notificationDescription", e.target.value)}
                  placeholder="Provide detailed instructions here..."
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Notification Date</label>
                <input
                  type="date"
                  value={editFormData.notificationDate}
                  onChange={(e) => handleEditInputChange("notificationDate", e.target.value)}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Select Driver</label>
                <select
                  value={editFormData.createdForId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedDriver = drivers.find(d => d.userId === selectedId);

                    // Update ID
                    handleEditInputChange("createdForId", selectedId);

                    // Update Name
                    const fullName = selectedDriver
                      ? `${selectedDriver.firstName} ${selectedDriver.lastName}`
                      : "";
                    handleEditInputChange("createdForName", fullName);
                  }}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select a driver...</option>
                  {drivers.map((driver) => (
                    <option key={driver.userId} value={driver.userId}>
                      {driver.firstName} {driver.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-blue-600 mr-2 shrink-0" />
                  <label htmlFor="editIsChecked" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">
                    Checked
                  </label>
                </div>
                <input
                  id="editIsChecked"
                  type="checkbox"
                  checked={editFormData.checked === true || editFormData.checked === 1}
                  onChange={(e) => handleEditInputChange("checked", e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Checked Date and Time</label>
                <input
                  type="text"
                  disabled
                  value={formatDate(editFormData.checkedDateTime)}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-100 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Created At</label>
                <input
                  type="text"
                  disabled
                  value={formatDate(editFormData.createdAt)}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-100 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
                />
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
                onClick={handleUpdateNotification}
                disabled={updatingNotification}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {updatingNotification && <Loader2 className="h-4 w-4 animate-spin" />}
                {updatingNotification ? "Updating..." : "Update Notification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden">
            <div className="flex justify-center pt-2 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>
            <div className="p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 text-center mb-2">Delete Notification</h3>
              <p className="text-gray-600 text-center mb-5 sm:mb-6 text-sm sm:text-base break-words px-1">
                Are you sure you want to delete notification &quot;{selectedNotification.notificationTitle}&quot;? This action
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
                  onClick={handleDeleteNotification}
                  disabled={deletingNotification}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {deletingNotification && <Loader2 className="h-4 w-4 animate-spin" />}
                  {deletingNotification ? "Deleting..." : "Delete"}
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
