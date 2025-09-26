"use client"
import { useState, useEffect } from "react"
import { Search, User, Navigation, Edit, Trash2, Save, Plus, X, RefreshCw, Eye, MapPin, Bot } from "lucide-react"
import { useToast } from "@/app/contexts/ToastContext"
import Loader from "@/app/components/Loader"

export default function RoutesPage() {
  const [machineLocations, setMachineLocations] = useState([])
  const [users, setUsers] = useState([])
  const [selectedRider, setSelectedRider] = useState(null)
  const [selectedLocations, setSelectedLocations] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [locationSearchTerm, setLocationSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [showRiderDropdown, setShowRiderDropdown] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [allMachines, setAllMachines] = useState([])
  const [displayedMachines, setDisplayedMachines] = useState([])

  // Route management states
  const [existingRoutes, setExistingRoutes] = useState([])
  const [editingRoute, setEditingRoute] = useState(null)
  const [viewingRoute, setViewingRoute] = useState(null)
  const [routeName, setRouteName] = useState("")
  const [loadingRoutes, setLoadingRoutes] = useState(false)
  const [savingRoute, setSavingRoute] = useState(false)
  const [vacantLocations, setVacantLocations] = useState([])
  const [loadingVacantLocations, setLoadingVacantLocations] = useState(false)
  const [vacantLocationSearchTerm, setVacantLocationSearchTerm] = useState("")
  const [editVacantLocationSearchTerm, setEditVacantLocationSearchTerm] = useState("")

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [routeToDelete, setRouteToDelete] = useState(null)

  const { success, error } = useToast()

  // Fetch all data on component mount
  useEffect(() => {
    fetchMachineLocations()
    fetchUsers()
    fetchExistingRoutes()
  }, [])

  // Auto-generate route name when rider is selected
  useEffect(() => {
    if (selectedRider && !editingRoute) {
      const defaultName = `frydge-route-${
        selectedRider.firstName || selectedRider.lastName || selectedRider.email
      }`.toLowerCase()
      setRouteName(defaultName)
    }
  }, [selectedRider, editingRoute])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await fetch("/api/users?pageSize=50")
      if ([400, 401, 403].includes(response.status)) {
        console.warn("Session expired or invalid. Redirecting to login...")
        error("Session expired. Please log in again.")
        window.location.href = "/" // force redirect to login
        return
      }
      const data = await response.json()
      setUsers(data.users || data.results || data || [])
    } catch (err) {
      console.error("Error fetching users:", err)
      setErrorMsg("Failed to load users")
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchMachineLocations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/routes")
      if ([400, 401, 403].includes(response.status)) {
        console.warn("Session expired or invalid. Redirecting to login...")
        error("Session expired. Please log in again.")
        window.location.href = "/" // force redirect to login
        return
      }
      if (!response.ok) throw new Error("Failed to fetch machine locations")
      const data = await response.json()
      setMachineLocations(data.results || data || [])
    } catch (err) {
      console.error("Error fetching machine locations:", err)
      setErrorMsg("Failed to load machine locations")
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingRoutes = async () => {
    try {
      setLoadingRoutes(true)
      setErrorMsg("")
      console.log("Fetching existing routes...")

      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""
      const response = await fetch(`/api/driver-routes?fetchAll=true${searchParam}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched routes data:", data)

      // Handle different response structures
      let routes = []
      if (Array.isArray(data)) {
        routes = data
      } else if (data.routes && Array.isArray(data.routes)) {
        routes = data.routes
      } else if (data.data && Array.isArray(data.data)) {
        routes = data.data
      } else {
        console.warn("Unexpected routes data structure:", data)
        routes = []
      }

      // Process each route to handle nested venues arrays
      routes = routes.map((route) => {
        if (route.venues && Array.isArray(route.venues)) {
          // If venues is an array of arrays, flatten it
          if (route.venues.length > 0 && Array.isArray(route.venues[0])) {
            console.log(`Flattening nested venues for route ${route.routeId}`)
            route.venues = route.venues.flat()
          }
        }
        return route
      })

      setExistingRoutes(routes)
    } catch (err) {
      console.error("Error fetching routes:", err)
      setErrorMsg(`Failed to load routes: ${err.message}`)
      setExistingRoutes([])
    } finally {
      setLoadingRoutes(false)
    }
  }
  // get vacant locations for route creation
  const fetchVacantRoutes = async () => {
    try {
      setLoadingVacantLocations(true)
      setErrorMsg("")
      console.log("Fetching vacant locations...")
      const response = await fetch(`/api/vacant-locations`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched vacant locations data:", data)

      let locations = []
      if (data.vacantLocations && Array.isArray(data.vacantLocations)) {
        locations = data.vacantLocations
      } else if (Array.isArray(data)) {
        locations = data
      } else if (data.locations && Array.isArray(data.locations)) {
        locations = data.locations
      } else if (data.data && Array.isArray(data.data)) {
        locations = data.data
      } else if (data.results && Array.isArray(data.results)) {
        locations = data.results
      } else {
        console.warn("Unexpected vacant locations data structure:", data)
        locations = []
      }

      setVacantLocations(locations)
    } catch (err) {
      console.error("Error fetching vacant locations:", err)
      setErrorMsg(`Failed to load vacant locations: ${err.message}`)
    } finally {
      setLoadingVacantLocations(false)
    }
  }

  // Update the fetchRouteDetails function to handle the correct response structure
  const fetchRouteDetails = async (routeId) => {
    try {
      console.log("Fetching route details for:", routeId)
      const response = await fetch(`/api/driver-routes?routeId=${routeId}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      const data = await response.json()
      console.log("Route details fetched:", data)
      console.log("Raw venues data:", data.routes?.venues)

      // Handle the nested structure - the actual route data is under 'routes'
      const routeData = data.routes || data

      // IMPORTANT: Check if venues is nested array and flatten it
      if (routeData.venues && Array.isArray(routeData.venues)) {
        // If venues is an array of arrays, flatten it
        if (routeData.venues.length > 0 && Array.isArray(routeData.venues[0])) {
          console.log("Flattening nested venues array")
          routeData.venues = routeData.venues.flat()
        }
        console.log("Final venues after processing:", routeData.venues)
      }

      return routeData
    } catch (err) {
      console.error("Error fetching route details:", err)
      error(`Failed to fetch route details: ${err.message}`)
      return null
    }
  }

  // Filter functions
  const filteredUsers = users?.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.dsbEmail?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredLocations = machineLocations.filter(
    (location) =>
      location.name?.toLowerCase().includes(locationSearchTerm.toLowerCase()) ||
      location.address?.toLowerCase().includes(locationSearchTerm.toLowerCase()),
  )

  const filteredVacantLocations = vacantLocations.filter(
    (location) =>
      location.name?.toLowerCase().includes(vacantLocationSearchTerm.toLowerCase()) ||
      location.locationName?.toLowerCase().includes(vacantLocationSearchTerm.toLowerCase()) ||
      location.address?.toLowerCase().includes(vacantLocationSearchTerm.toLowerCase()) ||
      location.machine?.name?.toLowerCase().includes(vacantLocationSearchTerm.toLowerCase()),
  )

  const handleRiderSelect = (user) => {
    setSelectedRider(user)
    setSearchTerm(`${user.firstName} ${user.lastName}`.trim())
    setShowRiderDropdown(false)
  }

  // Update the handleLocationSelect function to preserve existing data when adding new locations
  const handleLocationSelect = (location) => {
    if (!selectedLocations.find((loc) => loc.id === location.id)) {
      const newLocation = {
        // Include ALL original location data if available
        ...location,
        // Override with required structure
        id: location.id,
        priority: selectedLocations.length + 1,
        name: location.name || "Unknown Location",
        locationName: location.locationName || "Lobby",
        address: location.address || "No address provided",
        latitude: Number.parseFloat(location.latitude) || 0,
        longitude: Number.parseFloat(location.longitude) || 0,
        machine: {
          // Preserve ALL original machine data
          ...location.machine,
          id: location.machine?.id || 0,
          name: location.machine?.name || "Unknown Machine",
          freeVend: location.machine?.freeVend || false,
          isFridge: location.machine?.isFridge || false,
        },
      }
      setSelectedLocations([...selectedLocations, newLocation])
    }
    setLocationSearchTerm("")
    setShowLocationDropdown(false)
  }

  const removeLocation = (locationId) => {
    const updatedLocations = selectedLocations
      .filter((loc) => loc.id !== locationId)
      .map((loc, index) => ({ ...loc, priority: index + 1 }))
    setSelectedLocations(updatedLocations)
  }

  // Update the moveLocationUp function to preserve all data when reordering
  const moveLocationUp = (index) => {
    if (index > 0) {
      const newLocations = [...selectedLocations]
      const temp = newLocations[index]
      newLocations[index] = newLocations[index - 1]
      newLocations[index - 1] = temp
      // Update priorities while preserving all other data
      newLocations.forEach((loc, idx) => {
        loc.priority = idx + 1
      })
      setSelectedLocations(newLocations)
    }
  }

  // Update the moveLocationDown function to preserve all data when reordering
  const moveLocationDown = (index) => {
    if (index < selectedLocations.length - 1) {
      const newLocations = [...selectedLocations]
      const temp = newLocations[index]
      newLocations[index] = newLocations[index + 1]
      newLocations[index + 1] = temp
      // Update priorities while preserving all other data
      newLocations.forEach((loc, idx) => {
        loc.priority = idx + 1
      })
      setSelectedLocations(newLocations)
    }
  }

  // Get rider name by userId
  const getRiderName = (userId) => {
    const user = users.find((u) => u.id === userId)
    if (user) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.dsbEmail
    }
    return `User ${userId}`
  }

  // Modal handlers
  const openCreateModal = () => {
    clearForm()
    setVacantLocationSearchTerm("")
    fetchVacantRoutes()
    setShowCreateModal(true)
  }

  // Update the openEditModal function to properly preserve all existing data
  const openEditModal = async (route) => {
    console.log("Opening edit modal for route:", route)
    const routeDetails = await fetchRouteDetails(route.routeId)
    if (routeDetails) {
      console.log("Setting edit data:", routeDetails)
      setEditingRoute(routeDetails)
      setRouteName(routeDetails.routeName || "")

      // Find and set the user
      const user = users.find((u) => u.id === routeDetails.userId)
      if (user) {
        setSelectedRider(user)
        setSearchTerm(`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.dsbEmail)
      } else {
        console.warn("User not found for userId:", routeDetails.userId)
        setSelectedRider({
          id: routeDetails.userId,
          firstName: "Unknown",
          lastName: "User",
          email: "unknown@example.com",
        })
        setSearchTerm(`User ${routeDetails.userId}`)
      }

      // Set the venues/locations - convert coordinates properly
      const venues = routeDetails.venues || []
      const formattedVenues = venues.map((venue, index) => ({
        // Keep all original venue data
        ...venue,
        id: venue.id,
        priority: venue.priority || index + 1,
        name: venue.name || "Unknown Location",
        locationName: venue.locationName || "Lobby",
        address: venue.address || "No address",
        // Handle coordinates - ensure they're valid numbers
        latitude: venue.latitude || 0,
        longitude: venue.longitude || 0,
        machine: {
          ...venue.machine,
          id: venue.machine?.id || 0,
          name: venue.machine?.name || "Unknown Machine",
          freeVend: Boolean(venue.machine?.freeVend),
          isFridge: Boolean(venue.machine?.isFridge),
        },
      }))

      console.log("Formatted venues for editing:", formattedVenues)
      setSelectedLocations(formattedVenues)

      await fetchVacantRoutes()
      setEditVacantLocationSearchTerm("")

      setShowEditModal(true)
    } else {
      error("Failed to load route details for editing")
    }
  }

  // Update the openViewModal function to handle the correct data structure
  const openViewModal = async (route) => {
    console.log("Opening view modal for route:", route)
    const routeDetails = await fetchRouteDetails(route.routeId)
    if (routeDetails) {
      console.log("Setting view data:", routeDetails)
      setViewingRoute(routeDetails)
      setShowViewModal(true)
    } else {
      error("Failed to load route details for viewing")
    }
  }

  const openDeleteModal = (route) => {
    setRouteToDelete(route)
    setShowDeleteModal(true)
  }

  const clearForm = () => {
    setSelectedRider(null)
    setSelectedLocations([])
    setSearchTerm("")
    setRouteName("")
    setEditingRoute(null)
    setErrorMsg("")
  }

  const closeAllModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowViewModal(false)
    setShowDeleteModal(false)
    setRouteToDelete(null)
    setViewingRoute(null)
    clearForm()
  }

  // CRUD Operations
  const handleCreateRoute = async () => {
    if (!selectedRider || selectedLocations.length === 0 || !routeName.trim()) {
      setErrorMsg("Please select a rider, add locations, and provide a route name")
      return
    }

    try {
      setSavingRoute(true)
      setErrorMsg("")

      // Ensure venues have correct structure and sequential priorities
      const venues = selectedLocations.map((location, index) => ({
        id: Number.parseInt(location.id),
        priority: index + 1,
        name: location.name || "Unknown Location",
        locationName: location.locationName || "Lobby",
        address: location.address || "No address",
        latitude: Number.parseFloat(location.latitude) || 0,
        longitude: Number.parseFloat(location.longitude) || 0,
        machine: {
          id: Number.parseInt(location.machine?.id) || 0,
          name: location.machine?.name || "Unknown Machine",
          freeVend: Boolean(location.machine?.freeVend),
          isFridge: Boolean(location.machine?.isFridge),
        },
      }))

      const routeData = {
        userId: Number.parseInt(selectedRider.id),
        routeName: routeName.trim(),
        venues: venues,
      }

      console.log("Creating route with data:", routeData)

      const response = await fetch("/api/driver-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routeData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log("Route created successfully:", result)

      success("Route created successfully!")
      await fetchExistingRoutes()
      closeAllModals()
    } catch (err) {
      console.error("Error creating route:", err)
      setErrorMsg(`Failed to create route: ${err.message}`)
    } finally {
      setSavingRoute(false)
    }
  }

  // FIXED: Update the handleUpdateRoute function to work with incremental changes
  const handleUpdateRoute = async () => {
    if (!editingRoute || !selectedRider || selectedLocations.length === 0 || !routeName.trim()) {
      setErrorMsg("Please complete all required fields")
      return
    }

    try {
      setSavingRoute(true)
      setErrorMsg("")

      // Process the current selectedLocations to send to API
      // This represents the FINAL state of venues after user's changes
      const venues = selectedLocations.map((location, index) => {
        // Ensure we have valid coordinates
        let latitude = 0
        let longitude = 0

        if (location.latitude && location.latitude !== "0") {
          latitude = Number.parseFloat(location.latitude)
        }
        if (location.longitude && location.longitude !== "0") {
          longitude = Number.parseFloat(location.longitude)
        }

        return {
          id: Number.parseInt(location.id),
          priority: index + 1, // Sequential priority based on current order
          name: location.name || "Unknown Location",
          locationName: location.locationName || "Lobby",
          address: location.address || "No address",
          latitude: latitude,
          longitude: longitude,
          machine: {
            id: Number.parseInt(location.machine?.id) || 0,
            name: location.machine?.name || "Unknown Machine",
            freeVend: Boolean(location.machine?.freeVend),
            isFridge: Boolean(location.machine?.isFridge),
          },
        }
      })

      const routeData = {
        userId: Number.parseInt(selectedRider.id),
        routeId: editingRoute.routeId,
        routeName: routeName.trim(),
        venues: venues, // This is the complete updated venues array
      }

      console.log("Updating route with data:", routeData)
      console.log("Original venues count:", editingRoute.venues?.length || 0)
      console.log("Updated venues count:", venues.length)

      const response = await fetch("/api/driver-routes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routeData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log("Route updated successfully:", result)

      success("Route updated successfully!")

      // Wait a moment for the database to update
      setTimeout(async () => {
        await fetchExistingRoutes()
        closeAllModals()
      }, 500)
    } catch (err) {
      console.error("Error updating route:", err)
      setErrorMsg(`Failed to update route: ${err.message}`)
    } finally {
      setSavingRoute(false)
    }
  }

  const handleDeleteRoute = async () => {
    if (!routeToDelete) return

    try {
      console.log("Deleting route:", routeToDelete.routeId)
      const response = await fetch("/api/driver-routes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeId: routeToDelete.routeId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log("Route deleted successfully:", result)

      success("Route deleted successfully!")
      await fetchExistingRoutes()
      closeAllModals()
    } catch (err) {
      console.error("Error deleting route:", err)
      error(`Failed to delete route: ${err.message}`)
    }
  }

  const generateGoogleMapUrlNoKey = (location) => {
    const query = encodeURIComponent(location.address || `${location.latitude},${location.longitude}`)
    return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`
  }
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchExistingRoutes()
    }, 300) // Debounce search by 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm])
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <Loader />
      </div>
    )
  }
  console.log("users", users)
  return (
    <div className="p-8 space-y-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}

        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Navigation className="h-10 w-10 text-blue-600" />
          <p className="text-gray-800"> Route Management</p>
        </h1>

        <div className="mb-6">
          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={fetchExistingRoutes}
              disabled={loadingRoutes}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loadingRoutes ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600  text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Route
            </button>
          </div>
        </div>
        <div className="mb-4 relative w-full p-[2px] rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center bg-white  rounded-full px-3">
            <Search className="w-5 h-5 text-gray-500 mr-2 absolute right-3" />
            <input
              type="text"
              placeholder="Search machines by ID, name, venue, location, or device..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 bg-transparent outline-none text-gray-900 "
            />
          </div>
        </div>
        {searchTerm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-blue-800 text-sm">
              Found {displayedMachines.length} machine
              {displayedMachines.length !== 1 ? "s" : ""} matching "{searchTerm}"
              {allMachines.length > 0
                ? ` (searching through ${allMachines.length} total machines)`
                : " (searching current page only)"}
            </p>
          </div>
        )}
        {/* Routes Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Route ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Rider Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Locations</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Route Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loadingRoutes ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                        <span className="text-gray-500">Loading routes...</span>
                      </div>
                    </td>
                  </tr>
                ) : existingRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Navigation className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">No routes found</p>
                      <p className="text-sm">Create your first route to get started</p>
                    </td>
                  </tr>
                ) : (
                  existingRoutes.map((route, index) => (
                    <tr
                      key={route.routeId}
                      onClick={() => openViewModal(route)}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50 transition-colors duration-200 cursor-pointer`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{route.routeId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{getRiderName(route.userId)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <MapPin className="h-3 w-3 mr-1" />
                          {route.venues?.length || 0} locations
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{route.routeName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{route.status}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openViewModal(route)
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Route"
                          >
                            <Eye className="h-4 w-4 hover:cursor-pointer" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(route)
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Route"
                          >
                            <Edit className="h-4 w-4 hover:cursor-pointer" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openDeleteModal(route)
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Route"
                          >
                            <Trash2 className="h-4 w-4 hover:cursor-pointer" />
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

        {/* Create Route Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-gray-800">Create New Route</p>
                  <button onClick={closeAllModals} className="p-2 text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="flex h-full">
                {/* Left Side - Vacant Locations */}
                <div className="w-1/2 p-6 border-r border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Vacant Locations</h3>
                    <p className="text-sm text-gray-600">Click on a location to add it to your route</p>
                  </div>

                  <div className="mb-4 relative w-full p-[2px] rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                    <div className="flex items-center bg-white rounded-full px-3">
                      <Search className="w-5 h-5 text-gray-500 mr-2 absolute right-3" />
                      <input
                        type="text"
                        placeholder="Search machines by ID, name, venue, location, or device..."
                        value={vacantLocationSearchTerm}
                        onChange={(e) => setVacantLocationSearchTerm(e.target.value)}
                        className="w-full py-2 bg-transparent outline-none text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {loadingVacantLocations ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-gray-500">Loading vacant locations...</div>
                      </div>
                    ) : filteredVacantLocations.length > 0 ? (
                      <div className="space-y-2">
                        {filteredVacantLocations.map((location) => (
                          <div
                            key={location.id}
                            onClick={() => handleLocationSelect(location)}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 cursor-pointer transition-colors"
                          >
                            <div className="font-semibold text-gray-900 mb-1">{location.name}</div>
                            <div className="text-sm text-gray-700 mb-1">📍 {location.locationName}</div>
                            <div className="text-sm text-gray-600 mb-2">{location.address}</div>
                            {location.machine && (
                              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                🤖 {location.machine.name}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : vacantLocationSearchTerm ? (
                      <div className="text-center py-8 text-gray-500">
                        No locations found matching "{vacantLocationSearchTerm}"
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">No vacant locations available</div>
                    )}
                  </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-1/2 p-6 space-y-6">
                  {/* Route Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Route Name</label>
                    <input
                      type="text"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      placeholder="Enter route name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Rider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Rider</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Search riders..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value)
                          setShowRiderDropdown(true)
                        }}
                        onFocus={() => setShowRiderDropdown(true)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />

                      {showRiderDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {loadingUsers ? (
                            <div className="px-4 py-3 text-gray-500">Loading users...</div>
                          ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                              <div
                                key={user.id}
                                onClick={() => handleRiderSelect(user)}
                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-center gap-3">
                                  <User className="h-4 w-4 text-blue-600" />
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {`${user.firstName || ""} ${user.lastName || ""}`.trim()}
                                    </div>
                                    <div className="text-blue-600 text-sm">{user.dsbEmail}</div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-500">No users found</div>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedRider && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">
                            {`${selectedRider.firstName || ""} ${selectedRider.lastName || ""}`.trim()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {errorMsg && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error</h3>
                          <p className="text-red-700 text-sm mt-1">{errorMsg}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Locations */}
                  {selectedLocations.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Route Stops ({selectedLocations.length}) - Use arrows to set priority
                      </label>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {selectedLocations.map((location, index) => (
                          <div key={location.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {location.priority}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900">{location.name}</div>
                              <div className="text-gray-600 text-sm truncate">{location.address}</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => moveLocationUp(index)}
                                disabled={index === 0}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                                title="Move up (Higher priority)"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => moveLocationDown(index)}
                                disabled={index === selectedLocations.length - 1}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                                title="Move down (Lower priority)"
                              >
                                ↓
                              </button>
                              <button
                                onClick={() => removeLocation(location.id)}
                                className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Remove location"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={closeAllModals}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoute}
                  disabled={savingRoute || !selectedRider || selectedLocations.length === 0 || !routeName.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {savingRoute ? "Creating..." : "Create Route"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Edit Route Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-gray-800">Edit Route</p>
                  <button onClick={closeAllModals} className="p-2 text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="flex h-[calc(90vh-120px)]">
                {/* Left Panel - Vacant Locations */}
                <div className="w-1/2 border-r border-gray-200 p-6 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Vacant Locations</h3>

                  {/* Search Input for Vacant Locations */}
                  <div className="mb-4 relative w-full p-[2px] rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                    <div className="flex items-center bg-white rounded-full px-3">
                      <Search className="w-5 h-5 text-gray-500 mr-2 absolute right-3" />
                      <input
                        type="text"
                        placeholder="Search machines by ID, name, venue, location, or device..."
                        value={editVacantLocationSearchTerm}
                        onChange={(e) => setEditVacantLocationSearchTerm(e.target.value)}
                        className="w-full py-2 bg-transparent outline-none text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Vacant Locations List */}
                  <div className="space-y-3">
                    {loadingVacantLocations ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading vacant locations...</span>
                      </div>
                    ) : (
                      (() => {
                        const filteredVacantLocations = vacantLocations.filter((location) => {
                          if (!editVacantLocationSearchTerm) return true
                          const searchLower = editVacantLocationSearchTerm.toLowerCase()
                          return (
                            location.name?.toLowerCase().includes(searchLower) ||
                            location.locationName?.toLowerCase().includes(searchLower) ||
                            location.address?.toLowerCase().includes(searchLower) ||
                            location.machine?.name?.toLowerCase().includes(searchLower) ||
                            location.id?.toString().includes(searchLower) ||
                            location.machine?.id?.toString().includes(searchLower)
                          )
                        })

                        return filteredVacantLocations.length > 0 ? (
                          filteredVacantLocations.map((location) => (
                            <div
                              key={location.id}
                              onClick={() => handleLocationSelect(location)}
                              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 mb-1">{location.name}</h4>
                                  <div className="flex items-center text-sm text-gray-600 mb-1">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {location.locationName}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{location.address}</p>
                                  <div className="flex items-center">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <Bot className="w-3 h-3 mr-1" />
                                      {location.machine?.name}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : editVacantLocationSearchTerm ? (
                          <div className="text-center py-8 text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No vacant locations found matching "{editVacantLocationSearchTerm}"</p>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No vacant locations available</p>
                          </div>
                        )
                      })()
                    )}
                  </div>
                </div>

                {/* Right Panel - Route Form */}
                <div className="w-1/2 p-6 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Route ID (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Route ID (Cannot be changed)
                      </label>
                      <input
                        type="text"
                        value={editingRoute?.routeId || ""}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                      />
                    </div>

                    {/* Route Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Route Name</label>
                      <input
                        type="text"
                        value={routeName}
                        onChange={(e) => setRouteName(e.target.value)}
                        placeholder="Enter route name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Rider Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Rider</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          placeholder="Search riders..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setShowRiderDropdown(true)
                          }}
                          onFocus={() => setShowRiderDropdown(true)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />

                        {showRiderDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {loadingUsers ? (
                              <div className="px-4 py-3 text-gray-500">Loading users...</div>
                            ) : filteredUsers.length > 0 ? (
                              filteredUsers.map((user) => (
                                <div
                                  key={user.id}
                                  onClick={() => handleRiderSelect(user)}
                                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {`${user.firstName || ""} ${user.lastName || ""}`.trim()}
                                      </div>
                                      <div className="text-blue-600 text-sm">{user.dsbEmail}</div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-gray-500">No users found</div>
                            )}
                          </div>
                        )}
                      </div>

                      {selectedRider && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">
                              {`${selectedRider.firstName || ""} ${selectedRider.lastName || ""}`.trim()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Location Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Add Locations</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          placeholder="Search locations..."
                          value={locationSearchTerm}
                          onChange={(e) => {
                            setLocationSearchTerm(e.target.value)
                            setShowLocationDropdown(true)
                          }}
                          onFocus={() => setShowLocationDropdown(true)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />

                        {showLocationDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {loading ? (
                              <div className="px-4 py-3 text-gray-500">Loading...</div>
                            ) : filteredLocations.length > 0 ? (
                              filteredLocations.map((location) => (
                                <div
                                  key={location.id}
                                  onClick={() => handleLocationSelect(location)}
                                  className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">
                                    {location.name || `Location ${location.id}`}
                                  </div>
                                  <div className="text-gray-600 text-sm truncate">
                                    {location.address || "No address"}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-gray-500">No locations found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <p className="text-red-700 text-sm mt-1">{errorMsg}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Selected Locations */}
                    {selectedLocations.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Route Stops ({selectedLocations.length}) - Use arrows to set priority
                        </label>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {selectedLocations.map((location, index) => (
                            <div key={location.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {location.priority}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900">{location.name}</div>
                                <div className="text-gray-600 text-sm truncate">{location.address}</div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => moveLocationUp(index)}
                                  disabled={index === 0}
                                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                                  title="Move up (Higher priority)"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => moveLocationDown(index)}
                                  disabled={index === selectedLocations.length - 1}
                                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                                  title="Move down (Lower priority)"
                                >
                                  ↓
                                </button>
                                <button
                                  onClick={() => removeLocation(location.id)}
                                  className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Remove location"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={closeAllModals}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRoute}
                  disabled={savingRoute || !selectedRider || selectedLocations.length === 0 || !routeName.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {savingRoute ? "Updating..." : "Update Route"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Route Modal */}
        {showViewModal && viewingRoute && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-gray-800">View Route Details</p>
                  <button onClick={closeAllModals} className="p-2 text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Route Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Route Information</h3>
                    <p className="text-sm text-blue-700">
                      <strong>ID:</strong> {viewingRoute.routeId}
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Name:</strong> {viewingRoute.routeName}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Rider Information</h3>
                    <p className="text-sm text-green-700">
                      <strong>Name:</strong> {getRiderName(viewingRoute.userId)}
                    </p>
                    <p className="text-sm text-green-700">
                      <strong>User ID:</strong> {viewingRoute.userId}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">Route Statistics</h3>
                    <p className="text-sm text-purple-700">
                      <strong>Total Stops:</strong> {viewingRoute.venues?.length || 0}
                    </p>
                    <p className="text-sm text-purple-700">
                      <strong>Est. Time:</strong> {(viewingRoute.venues?.length || 0) * 30} mins
                    </p>
                  </div>
                </div>

                {/* Route Locations with Maps */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Route Locations</h3>
                  {viewingRoute.venues && viewingRoute.venues.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {viewingRoute.venues
                        .sort((a, b) => a.priority - b.priority)
                        .map((location, index) => (
                          <div key={location.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="p-4 border-b border-gray-200">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {location.priority}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 truncate">{location.name}</h4>
                                  <p className="text-gray-600 text-sm truncate">{location.address}</p>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                <p>
                                  📍 {Number.parseFloat(location.latitude || 0).toFixed(6)},{" "}
                                  {Number.parseFloat(location.longitude || 0).toFixed(6)}
                                </p>
                                <p>🏢 {location.locationName}</p>
                                {location.machine && <p>🤖 {location.machine.name}</p>}
                              </div>
                            </div>
                            <div className="h-48">
                              <iframe
                                src={generateGoogleMapUrlNoKey(location)}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title={`Map for ${location.name}`}
                              ></iframe>
                            </div>
                            <div className="p-3 bg-gray-50 border-t border-gray-200">
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Stop {location.priority}</span>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Open in Google Maps
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No locations in this route</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeAllModals}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && routeToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Route</h3>
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to delete the route "{routeToDelete.routeName}"? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeAllModals}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteRoute}
                    className=" px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
