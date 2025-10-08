"use client"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronRight, Users, MapPin, Truck, Navigation, MapPinCheckIcon, X, Plus } from "lucide-react"
import { useToast } from "@/app/contexts/ToastContext"

export default function RoutesNewPage() {
    // State for API data
    const [allVenues, setAllVenues] = useState([])
    const [allVenueGroups, setAllVenueGroups] = useState([])
    const [drivers, setDrivers] = useState([])
    const [venueGroups, setVenueGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorState, setErrorState] = useState(null)

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedVenues, setSelectedVenues] = useState([])
    const [groupName, setGroupName] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    // Route creation state
    const [creatingRouteForDriver, setCreatingRouteForDriver] = useState(null)
    const [routeCreationQueue, setRouteCreationQueue] = useState([])
    const [isLoadingRoutes, setIsLoadingRoutes] = useState(false)

    // Ref to track if routes have been loaded to prevent infinite loops
    const routesLoadedRef = useRef(false)

    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState(null)
    const [draggedFromDriver, setDraggedFromDriver] = useState(null)
    const dragCounter = useRef(0)

    // Scroll state and refs
    const driversScrollRef = useRef(null)
    const autoScrollInterval = useRef(null)

    // Toast context
    const { success, error } = useToast()

    // Fetch all data on component mount
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true)
                setErrorState(null)

                // Fetch all data in parallel
                const [venuesResponse, venueGroupsResponse, driversResponse] = await Promise.all([
                    fetch('/api/vacant-locations'),
                    fetch('/api/venue-group?limit=10'), // Fetch all venue groups
                    fetch('/api/drivers')
                ])

                // Check if all requests were successful
                if (!venuesResponse.ok || !venueGroupsResponse.ok || !driversResponse.ok) {
                    throw new Error('Failed to fetch data from one or more APIs')
                }

                // Parse responses
                const venuesData = await venuesResponse.json()
                const venueGroupsData = await venueGroupsResponse.json()
                const driversData = await driversResponse.json()

                console.log('Fetched data:', { venuesData, venueGroupsData, driversData })

                // Transform and set venues data
                const transformedVenues = venuesData.vacantLocations || venuesData.data || []
                setAllVenues(transformedVenues.map((venue, index) => ({
                    id: venue.id || venue.venueId || index + 1,
                    name: venue.name || venue.venueName || venue.locationName || `Venue ${index + 1}`,
                    ...venue
                })))

                // Transform and set venue groups data
                const transformedVenueGroups = venueGroupsData.venueGroups || venueGroupsData.data || []
                const groupsWithExpansion = transformedVenueGroups.map((group, index) => ({
                    id: group.id || group.groupId || index + 1,
                    name: group.name || group.groupName || `Group ${index + 1}`,
                    isExpanded: false,
                    venues: group.venues || group.venueList || [],
                    ...group
                }))

                setAllVenueGroups(groupsWithExpansion)
                setVenueGroups(groupsWithExpansion)

                // Transform and set drivers data
                const transformedDrivers = driversData.drivers || driversData.data || []
                console.log('Transformed drivers:', transformedDrivers)
                setDrivers(transformedDrivers.map((driver, index) => ({
                    id: driver.userId || driver.id || driver.driverId || index + 1, // Use userId as the primary id
                    userId: driver.userId, // Keep the original userId field
                    name: `${driver.firstName || driver.first_name || 'Driver'} ${driver.lastName || driver.last_name || (index + 1)}`,
                    firstName: driver.firstName || driver.first_name || 'Driver',
                    lastName: driver.lastName || driver.last_name || (index + 1),
                    assignedVenues: [],
                    ...driver
                })))
                console.log('Drivers state set with:', transformedDrivers.length, 'drivers')

                // Reset the routes loaded ref when new drivers are loaded
                routesLoadedRef.current = false

                // Routes will be loaded automatically by useEffect when drivers are set

            } catch (err) {
                console.error('Error fetching data:', err)
                setErrorState(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchAllData()
    }, [])

    // Refresh routes when page becomes visible (handles navigation back)
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (!document.hidden && drivers?.length > 0 && !isLoadingRoutes) {
                console.log('Page became visible, refreshing routes...')
                const updatedDriversWithRoutes = await loadExistingRoutesForDrivers(drivers)
                setDrivers(updatedDriversWithRoutes)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [drivers?.length])

    // Load existing routes when drivers data is available
    useEffect(() => {
        const fetchAndSetRoutes = async () => {
            console.log('useEffect triggered:', { driversLength: drivers?.length, isLoadingRoutes, routesLoaded: routesLoadedRef.current })
            if (drivers?.length > 0 && !isLoadingRoutes && !routesLoadedRef.current) {
                console.log('Drivers loaded, fetching existing routes...')
                routesLoadedRef.current = true // Mark as loaded to prevent infinite loops
                const updatedDriversWithRoutes = await loadExistingRoutesForDrivers(drivers)
                console.log('Updated drivers with routes:', updatedDriversWithRoutes)
                setDrivers(updatedDriversWithRoutes)
            }
        }
        fetchAndSetRoutes()
    }, [drivers?.length]) // Only depend on drivers.length to trigger when drivers are initially loaded

    // Load existing routes for drivers
    const loadExistingRoutesForDrivers = async (driversList) => {
        try {
            console.log('loadExistingRoutesForDrivers called with:', driversList.length, 'drivers')
            setIsLoadingRoutes(true)
            const routesPromises = driversList.map(async (driver) => {
                try {
                    // Use the actual userId from the driver data
                    const userId = driver.userId || driver.id
                    console.log(`Loading routes for driver: ${driver.name}, userId: ${userId}`)

                    const response = await fetch(`/api/driver-routes?userId=${userId}&fetchAll=true`)
                    if (response.ok) {
                        const data = await response.json()
                        console.log(`Routes data for driver ${driver.name}:`, data)

                        // Handle the correct response structure: { routes: [...], totalCount: ... }
                        let routes = []
                        if (data.routes && Array.isArray(data.routes)) {
                            routes = data.routes
                        } else if (Array.isArray(data)) {
                            routes = data
                        } else if (data.data && Array.isArray(data.data)) {
                            routes = data.data
                        }

                        console.log(`Processed routes for driver ${driver.name}:`, routes)

                        // Extract venues from routes and add to driver's assigned venues
                        const assignedVenues = []
                        routes.forEach(route => {
                            if (route.venues && Array.isArray(route.venues)) {
                                route.venues.forEach(venue => {
                                    // Check if venue already exists in assignedVenues
                                    const exists = assignedVenues.find(v => v.id === venue.id)
                                    if (!exists) {
                                        assignedVenues.push({
                                            id: venue.id,
                                            name: venue.name || venue.locationName || `Venue ${venue.id}`,
                                            locationName: venue.locationName,
                                            address: venue.address,
                                            latitude: venue.latitude,
                                            longitude: venue.longitude,
                                            machine: venue.machine,
                                            priority: venue.priority,
                                            type: 'venue',
                                            routeId: route.routeId,
                                            routeName: route.routeName,
                                            ...venue
                                        })
                                    }
                                })
                            }
                        })

                        console.log(`Assigned venues for driver ${driver.name}:`, assignedVenues)
                        return { driverId: driver.id, assignedVenues }
                    }
                } catch (err) {
                    console.error(`Error loading routes for driver ${driver.name} (${driver.userId}):`, err)
                }
                return { driverId: driver.id, assignedVenues: [] }
            })

            const results = await Promise.all(routesPromises)

            // Return updated drivers with their assigned venues
            const updatedDrivers = driversList.map(driver => {
                const result = results.find(r => r.driverId === driver.id)
                return result ? { ...driver, assignedVenues: result.assignedVenues } : driver
            })

            console.log('loadExistingRoutesForDrivers returning:', updatedDrivers.length, 'drivers with routes')
            return updatedDrivers

        } catch (err) {
            console.error('Error loading existing routes:', err)
            return driversList // Return original drivers list if there's an error
        } finally {
            setIsLoadingRoutes(false)
        }
    }

    // Get available venues (not assigned to any driver)
    const getAvailableVenues = () => {
        if (!drivers || drivers.length === 0) return allVenues

        const assignedVenueIds = drivers.flatMap(driver =>
            driver.assignedVenues
                .filter(item => item.type === 'venue')
                .map(item => item.id)
        )
        return allVenues.filter(venue => !assignedVenueIds.includes(venue.id))
    }

    // Get available groups (not assigned to any driver)
    const getAvailableGroups = () => {
        if (!drivers || drivers.length === 0) return allVenueGroups

        const assignedGroupIds = drivers.flatMap(driver =>
            driver.assignedVenues
                .filter(item => item.type === 'group')
                .map(item => item.id)
        )
        return allVenueGroups.filter(group => !assignedGroupIds.includes(group.id))
    }

    // Toggle group expansion
    const toggleGroup = (groupId) => {
        setVenueGroups(prev =>
            prev.map(group =>
                group.id === groupId
                    ? { ...group, isExpanded: !group.isExpanded }
                    : group
            )
        )
    }

    // Auto-scroll functionality
    const startAutoScroll = (direction) => {
        if (autoScrollInterval.current) return

        autoScrollInterval.current = setInterval(() => {
            if (driversScrollRef.current) {
                const scrollAmount = direction === 'left' ? -10 : 10
                driversScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
            }
        }, 50)
    }

    const stopAutoScroll = () => {
        if (autoScrollInterval.current) {
            clearInterval(autoScrollInterval.current)
            autoScrollInterval.current = null
        }
    }

    const handleMouseMove = (e) => {
        if (!draggedItem) return

        const driversContainer = driversScrollRef.current
        if (!driversContainer) return

        const rect = driversContainer.getBoundingClientRect()
        const mouseX = e.clientX
        const scrollThreshold = 100 // pixels from edge to trigger scroll

        // Check if mouse is near left edge
        if (mouseX < rect.left + scrollThreshold) {
            startAutoScroll('left')
        }
        // Check if mouse is near right edge
        else if (mouseX > rect.right - scrollThreshold) {
            startAutoScroll('right')
        }
        // Stop scrolling if mouse is in the middle
        else {
            stopAutoScroll()
        }
    }

    // Drag handlers
    const handleDragStart = (e, item, sourceType, driverId = null) => {
        setDraggedItem({ ...item, sourceType })
        setDraggedFromDriver(driverId)
        e.dataTransfer.effectAllowed = "move"
        dragCounter.current = 0

        // Add mouse move listener for auto-scroll
        document.addEventListener('mousemove', handleMouseMove)
    }

    const handleDragEnd = () => {
        setDraggedItem(null)
        setDraggedFromDriver(null)
        dragCounter.current = 0

        // Remove mouse move listener and stop auto-scroll
        document.removeEventListener('mousemove', handleMouseMove)
        stopAutoScroll()
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
    }

    const handleDragEnter = (e) => {
        e.preventDefault()
        dragCounter.current++
    }

    const handleDragLeave = (e) => {
        dragCounter.current--
    }


    const getVenueTypeColor = () => {
        return "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:border-slate-400"
    }

    // Modal drag and drop handlers
    const handleModalDragStart = (e, venue) => {
        setDraggedItem(venue)
        e.dataTransfer.effectAllowed = "move"
    }

    const handleModalDragEnd = () => {
        setDraggedItem(null)
    }

    const handleModalDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
    }

    const handleModalDrop = (e) => {
        e.preventDefault()
        if (!draggedItem) return

        // Add venue to selected venues if not already selected
        setSelectedVenues(prev => {
            const exists = prev.find(v => v.id === draggedItem.id)
            if (exists) return prev
            return [...prev, draggedItem]
        })
        setDraggedItem(null)
    }

    const removeVenueFromGroup = (venueId) => {
        setSelectedVenues(prev => prev.filter(v => v.id !== venueId))
    }

    const clearSelectedVenues = () => {
        setSelectedVenues([])
    }

    // Create venue group
    const handleCreateVenueGroup = async () => {
        if (selectedVenues.length === 0) {
            alert("Please select at least one venue")
            return
        }

        try {
            setIsCreating(true)

            // Transform venues to match API format
            const venuesData = selectedVenues.map(venue => ({
                id: venue.id,
                priority: 1,
                name: venue.name,
                locationName: venue.locationName || venue.name,
                address: venue.address || "N/A",
                latitude: venue.latitude || 0,
                longitude: venue.longitude || 0,
                machine: venue.machine || {
                    id: 0,
                    name: "N/A",
                    freeVend: false,
                    isFridge: false
                }
            }))

            const response = await fetch('/api/venue-group', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    venues: venuesData
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to create venue group')
            }

            const result = await response.json()
            console.log('Venue group created:', result)

            // Close modal and reset state
            setShowCreateModal(false)
            setGroupName("")
            setSelectedVenues([])

            // Refresh venue groups data
            const venueGroupsResponse = await fetch('/api/venue-group?limit=10')
            if (venueGroupsResponse.ok) {
                const venueGroupsData = await venueGroupsResponse.json()
                const transformedVenueGroups = venueGroupsData.venueGroups || venueGroupsData.data || []
                const groupsWithExpansion = transformedVenueGroups.map((group, index) => ({
                    id: group.id || group.groupId || index + 1,
                    name: group.name || group.groupName || `Group ${index + 1}`,
                    isExpanded: false,
                    venues: group.venues || group.venueList || [],
                    ...group
                }))
                setAllVenueGroups(groupsWithExpansion)
                setVenueGroups(groupsWithExpansion)
            }

            alert("Venue group created successfully!")

        } catch (error) {
            console.error('Error creating venue group:', error)
            alert(`Error creating venue group: ${error.message}`)
        } finally {
            setIsCreating(false)
        }
    }

    // Route creation functionality
    const createRouteForDriver = async (driver, venues) => {
        if (!driver || venues.length === 0) {
            error("Driver and venues are required to create a route")
            return false
        }

        try {
            setCreatingRouteForDriver(driver.id)

            // Generate route name automatically
            const routeName = `frydge-route-${driver.firstName || driver.lastName || driver.id}`.toLowerCase()

            // Transform venues to match API format
            const venuesData = venues.map((venue, index) => ({
                id: parseInt(venue.id),
                priority: index + 1,
                name: venue.name || "Unknown Location",
                locationName: venue.locationName || venue.name || "Lobby",
                address: venue.address || "No address provided",
                latitude: parseFloat(venue.latitude) || 0,
                longitude: parseFloat(venue.longitude) || 0,
                machine: {
                    id: parseInt(venue.machine?.id) || 0,
                    name: venue.machine?.name || "Unknown Machine",
                    freeVend: Boolean(venue.machine?.freeVend),
                    isFridge: Boolean(venue.machine?.isFridge),
                },
            }))

            const routeData = {
                userId: driver.userId || driver.id, // Use the actual userId from driver data
                routeName: routeName,
                venues: venuesData,
            }

            console.log("Creating route for driver:", driver.name, "userId:", driver.userId, "with data:", routeData)

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

            success(`Route created successfully for ${driver.name}!`)

            // Refresh routes after creation
            const updatedDriversWithRoutes = await loadExistingRoutesForDrivers(drivers)
            setDrivers(updatedDriversWithRoutes)

            return true

        } catch (err) {
            console.error("Error creating route:", err)
            error(`Failed to create route for ${driver.name}: ${err.message}`)
            return false
        } finally {
            setCreatingRouteForDriver(null)
        }
    }

    // Enhanced drag and drop handlers for route creation
    const handleDropOnDriver = async (e, driverId) => {
        e.preventDefault()
        if (!draggedItem) return

        const driver = drivers?.find(d => d.id === driverId)
        if (!driver) {
            error("Driver not found")
            return
        }

        // Remove from previous driver if dragged from another driver
        if (draggedFromDriver && draggedFromDriver !== driverId) {
            // First, remove from local state
            setDrivers(prev =>
                prev.map(d =>
                    d.id === draggedFromDriver
                        ? {
                            ...d,
                            assignedVenues: d.assignedVenues.filter(v => v.id !== draggedItem.id)
                        }
                        : d
                )
            )

            // Then, delete the route from the database for the previous driver
            try {
                const previousDriver = drivers?.find(d => d.id === draggedFromDriver)
                if (previousDriver) {
                    const userId = previousDriver.userId || previousDriver.id
                    const response = await fetch(`/api/driver-routes?userId=${userId}&fetchAll=true`)
                    if (response.ok) {
                        const data = await response.json()
                        const routes = data.routes || data.data || []

                        // Delete routes that contain this venue
                        for (const route of routes) {
                            if (route.venues && route.venues.some(v => v.id === draggedItem.id)) {
                                await fetch("/api/driver-routes", {
                                    method: "DELETE",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ routeId: route.routeId }),
                                })
                                console.log(`Deleted route ${route.routeId} from driver ${previousDriver.name}`)
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error deleting route from previous driver:", err)
                error(`Failed to remove route from previous driver: ${err.message}`)
            }
        }

        // Add to new driver (avoid duplicates)
        setDrivers(prev =>
            prev.map(d =>
                d.id === driverId
                    ? {
                        ...d,
                        assignedVenues: [
                            ...d.assignedVenues.filter(v => v.id !== draggedItem.id),
                            {
                                id: draggedItem.id,
                                name: draggedItem.name,
                                type: draggedItem.sourceType === 'group' ? 'group' : 'venue',
                                ...draggedItem // Include all original data
                            }
                        ]
                    }
                    : d
            )
        )

        // Create route if this is a venue (not a group)
        if (draggedItem.sourceType === 'venue') {
            const venueData = {
                id: draggedItem.id,
                name: draggedItem.name,
                locationName: draggedItem.locationName || draggedItem.name,
                address: draggedItem.address || "N/A",
                latitude: draggedItem.latitude || 0,
                longitude: draggedItem.longitude || 0,
                machine: draggedItem.machine || {
                    id: 0,
                    name: "N/A",
                    freeVend: false,
                    isFridge: false
                }
            }

            await createRouteForDriver(driver, [venueData])
        } else if (draggedItem.sourceType === 'group') {
            // For groups, create route with all venues in the group
            const groupVenues = draggedItem.venues || []
            if (groupVenues.length > 0) {
                await createRouteForDriver(driver, groupVenues)
            }
        }

        // Show success message
        if (draggedFromDriver && draggedFromDriver !== driverId) {
            const previousDriver = drivers?.find(d => d.id === draggedFromDriver)
            success(`Venue '${draggedItem.name}' reassigned from ${previousDriver?.name} to ${driver.name}`)
        } else {
            success(`Venue '${draggedItem.name}' assigned to ${driver.name}`)
        }

        setDraggedItem(null)
        setDraggedFromDriver(null)
    }

    const handleDropOnVenueList = async (e) => {
        e.preventDefault()
        if (!draggedItem || draggedItem.sourceType !== 'venue') return

        // Remove from driver if dragged from driver
        if (draggedFromDriver) {
            const driver = drivers?.find(d => d.id === draggedFromDriver)
            if (driver) {
                // Delete the route for this driver if it exists
                try {
                    // Find existing routes for this driver using the correct userId
                    const userId = driver.userId || driver.id
                    const response = await fetch(`/api/driver-routes?userId=${userId}&fetchAll=true`)
                    if (response.ok) {
                        const data = await response.json()
                        const routes = data.routes || data.data || []

                        // Delete routes that contain this venue
                        for (const route of routes) {
                            if (route.venues && route.venues.some(v => v.id === draggedItem.id)) {
                                await fetch("/api/driver-routes", {
                                    method: "DELETE",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ routeId: route.routeId }),
                                })
                                success(`Venue '${draggedItem.name}' unassigned from ${driver.name}`)
                            }
                        }

                        // Refresh routes after deletion
                        const updatedDriversWithRoutes = await loadExistingRoutesForDrivers(drivers)
                        setDrivers(updatedDriversWithRoutes)
                    }
                } catch (err) {
                    console.error("Error deleting route:", err)
                    error(`Failed to delete route: ${err.message}`)
                }
            }

            setDrivers(prev =>
                prev.map(d =>
                    d.id === draggedFromDriver
                        ? {
                            ...d,
                            assignedVenues: d.assignedVenues.filter(v => v.id !== draggedItem.id)
                        }
                        : d
                )
            )
        }

        setDraggedItem(null)
        setDraggedFromDriver(null)
    }

    const handleDropOnGroupList = async (e) => {
        e.preventDefault()
        if (!draggedItem || draggedItem.sourceType !== 'group') return

        // Remove from driver if dragged from driver
        if (draggedFromDriver) {
            const driver = drivers?.find(d => d.id === draggedFromDriver)
            if (driver) {
                // Delete the route for this driver if it exists
                try {
                    // Find existing routes for this driver using the correct userId
                    const userId = driver.userId || driver.id
                    const response = await fetch(`/api/driver-routes?userId=${userId}&fetchAll=true`)
                    if (response.ok) {
                        const data = await response.json()
                        const routes = data.routes || data.data || []

                        // Delete routes that contain venues from this group
                        const groupVenueIds = (draggedItem.venues || []).map(v => v.id)
                        for (const route of routes) {
                            if (route.venues && route.venues.some(v => groupVenueIds.includes(v.id))) {
                                await fetch("/api/driver-routes", {
                                    method: "DELETE",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ routeId: route.routeId }),
                                })
                                success(`Venue group '${draggedItem.name}' unassigned from ${driver.name}`)
                            }
                        }

                        // Refresh routes after deletion
                        const updatedDriversWithRoutes = await loadExistingRoutesForDrivers(drivers)
                        setDrivers(updatedDriversWithRoutes)
                    }
                } catch (err) {
                    console.error("Error deleting route:", err)
                    error(`Failed to delete route: ${err.message}`)
                }
            }

            setDrivers(prev =>
                prev.map(d =>
                    d.id === draggedFromDriver
                        ? {
                            ...d,
                            assignedVenues: d.assignedVenues.filter(v => v.id !== draggedItem.id)
                        }
                        : d
                )
            )
        }

        setDraggedItem(null)
        setDraggedFromDriver(null)
    }

    // Handle body scroll when modal is open
    useEffect(() => {
        if (showCreateModal) {
            // Disable body scroll when modal is open
            document.body.style.overflow = 'hidden'
        } else {
            // Re-enable body scroll when modal is closed
            document.body.style.overflow = 'unset'
        }

        // Cleanup function to ensure scroll is re-enabled
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [showCreateModal])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAutoScroll()
            document.removeEventListener('mousemove', handleMouseMove)
        }
    }, [])

    const availableVenues = getAvailableVenues()
    const availableGroups = getAvailableGroups()

    // Loading state
    if (loading) {
        return (
            <div className="p-8 space-y-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                        <Navigation className="h-10 w-10 text-blue-600" />
                        <span className="text-gray-800">Route Assignment Manager</span>
                    </h1>
                    <p className="text-gray-600">Loading data...</p>
                </div>
                <div className="flex items-center justify-center min-h-[600px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Fetching venues, groups, and drivers...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Error state
    if (errorState) {
        return (
            <div className="p-8 space-y-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                        <Navigation className="h-10 w-10 text-blue-600" />
                        <span className="text-gray-800">Route Assignment Manager</span>
                    </h1>
                </div>
                <div className="flex items-center justify-center min-h-[600px]">
                    <div className="text-center">
                        <div className="text-red-600 mb-4">
                            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <p className="text-red-600 font-semibold">Error loading data</p>
                        <p className="text-gray-600 mt-2">{errorState}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <><div className="p-8 space-y-8">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                            <Navigation className="h-10 w-10 text-blue-600" />
                            <span className="text-gray-800">Route Assignment Manager</span>
                        </h1>
                        <p className="text-gray-600">Assign venues and groups to drivers using drag and drop</p>
                    </div>
                    <div className="">
                        {/* <button
                        onClick={async () => {
                            console.log('Manual refresh triggered')
                            if (drivers?.length > 0 && !isLoadingRoutes) {
                                routesLoadedRef.current = false // Reset ref to allow refresh
                                const updatedDriversWithRoutes = await loadExistingRoutesForDrivers(drivers)
                                setDrivers(updatedDriversWithRoutes)
                            }
                        } }
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="font-semibold">Refresh Routes</span>
                    </button> */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                             className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600  text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            <span className="font-semibold">Manage Venue Group</span>
                        </button>
                    </div>
                </div>

            </div>
        </div><div className="grid grid-cols-1 xl:grid-cols-4 gap-6 min-h-[600px]">
                {/* Left Section - Venue Lists */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Venue List */}
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-6">
                        <div className="flex items-center gap-2 py-4">
                            <div><MapPin className="h-8 w-8 text-blue-600" /></div>
                            <div><h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                VENUES LIST
                            </h3></div>
                        </div>
                        <div
                            className="space-y-3 max-h-80 overflow-y-auto"
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDropOnVenueList}
                        >
                            {availableVenues.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <MapPin className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm">All venues assigned</p>
                                </div>
                            ) : (
                                availableVenues.map((venue) => (
                                    <div
                                        key={venue.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, venue, 'venue')}
                                        onDragEnd={handleDragEnd}
                                        className={`p-3 rounded-lg border-2 cursor-move hover:shadow-md transition-all duration-200 ${getVenueTypeColor()}`}
                                    >
                                        <div className="text-sm font-medium">
                                            {venue.name}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Venue Group List */}
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-6">
                        <div className="flex items-center gap-2 py-4">
                            <div><MapPinCheckIcon className="h-8 w-8 text-blue-600" /></div>
                            <div><h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                VENUES GROUP
                            </h3></div>
                        </div>
                        <div
                            className="space-y-3 max-h-80 overflow-y-auto"
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDropOnGroupList}
                        >
                            {availableGroups.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm">All groups assigned</p>
                                </div>
                            ) : (
                                availableGroups.map((group) => {
                                    // Find the corresponding group in venueGroups state to get the isExpanded value
                                    const groupState = venueGroups.find(g => g.id === group.id)
                                    const isExpanded = groupState ? groupState.isExpanded : false

                                    return (
                                        <div key={group.id} className="border-2 border-slate-200 rounded-lg overflow-hidden">
                                            <div
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, group, 'group')}
                                                onDragEnd={handleDragEnd}
                                                className="p-3 bg-purple-50 cursor-move hover:bg-purple-100 transition-colors flex items-center justify-between"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleGroup(group.id)
                                                }}
                                            >
                                                <span className="text-sm font-medium text-slate-800">
                                                    {group.name}
                                                </span>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-slate-600" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-slate-600" />
                                                )}
                                            </div>

                                            {isExpanded && (
                                                <div className="p-3 space-y-2 bg-white border-t border-slate-200">
                                                    {group.venues && group.venues.map((venue) => (
                                                        <div
                                                            key={venue.id || venue.venueId}
                                                            className="p-2 text-sm text-slate-600 bg-slate-50 rounded border border-slate-200"
                                                        >
                                                            {venue.name || venue.venueName}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Section - Drivers */}
                <div className="xl:col-span-3">
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-6">
                        <div className="flex items-center gap-2 py-4">
                            <div><Truck className="h-8 w-8 text-blue-600" /></div>
                            <div><h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                DRIVERS ASSIGNMENT
                            </h3></div>
                        </div>

                        <div
                            ref={driversScrollRef}
                            className="flex gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 min-h-[750px]"
                        >
                            {console.log('Rendering drivers section:', { drivers, driversLength: drivers?.length, driversType: typeof drivers })}
                            {!drivers || drivers.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center py-12">
                                        <Truck className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                        <p className="text-slate-500 text-lg font-medium">No drivers available</p>
                                        <p className="text-slate-400 text-sm mt-2">Drivers will appear here once loaded</p>
                                    </div>
                                </div>
                            ) : (
                                drivers?.map((driver) => (
                                    <div
                                        key={driver.id}
                                        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-purple-200 p-4 max-h-[710px] flex flex-col flex-shrink-0 w-80"
                                        onDragOver={handleDragOver}
                                        onDragEnter={handleDragEnter}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDropOnDriver(e, driver.id)}
                                    >
                                        {/* Driver Header */}
                                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg mb-4 text-center font-semibold shadow-md">
                                            {driver.name}
                                            {creatingRouteForDriver === driver.id && (
                                                <div className="mt-2 text-xs opacity-75">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                                                    Creating route...
                                                </div>
                                            )}
                                            {isLoadingRoutes && (
                                                <div className="mt-2 text-xs opacity-75">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                                                    Loading routes...
                                                </div>
                                            )}
                                        </div>

                                        {/* Assigned Items */}
                                        <div className="flex-1 space-y-3 overflow-y-auto">
                                            {driver.assignedVenues.length === 0 ? (
                                                <div className="text-center text-slate-500 py-12 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/50">
                                                    <Truck className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                                                    <p className="text-sm">Drop venues or groups here</p>
                                                </div>
                                            ) : (
                                                driver.assignedVenues.map((item) => (
                                                    <div
                                                        key={`${item.type}-${item.id}`}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, item, item.type, driver.id)}
                                                        onDragEnd={handleDragEnd}
                                                        className={`p-3 rounded-lg border-2 cursor-move transition-all duration-200 shadow-sm hover:shadow-md ${item.type === 'group'
                                                            ? 'bg-purple-50 border-purple-200 hover:border-purple-300'
                                                            : 'bg-blue-50 border-blue-200 hover:border-blue-300'}`}
                                                    >
                                                        <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                                            {item.type === 'group' ? (
                                                                <Users className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                                            ) : (
                                                                <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                                            )}
                                                            <span className="truncate">{item.name}</span>
                                                        </div>
                                                        {item.type === 'group' && (
                                                            <div className="text-xs text-purple-600 mt-1 ml-6">
                                                                Group Assignment
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )))}



                        </div>
                        {/* Scroll Indicator */}
                        <div className="text-center text-sm text-slate-500 mt-2">
                            <span>← Scroll horizontally to see all drivers →</span>
                        </div>
                    </div>
                </div>

                {/* Manage Venue Group Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                        <div className="bg-white rounded-xl shadow-2xl w-[95vw] h-[95vh] overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-gray-800">Manage Venue Group</h3>
                                    <button
                                        onClick={() => {
                                            setShowCreateModal(false)
                                            setGroupName("")
                                            setSelectedVenues([])
                                        }}
                                        className="p-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col flex-1 overflow-hidden">
                                {/* Top Section - Create New Group */}
                                <div className="flex border-b border-gray-200" style={{height: '40%'}}>
                                    {/* Left Side - Available Venues */}
                                    <div className="w-1/2 p-4 border-r border-gray-200 overflow-y-auto"
                                        onDragOver={handleModalDragOver}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            if (!draggedItem) return
                                            // Remove from selected venues when dragged back to available list
                                            setSelectedVenues(prev => prev.filter(v => v.id !== draggedItem.id))
                                            setDraggedItem(null)
                                        }}
                                    >
                                        <div className="mb-3">
                                            <h3 className="text-base font-semibold text-gray-800 mb-1">Available Venues</h3>
                                            <p className="text-xs text-gray-600">Drag venues to the right to create your group</p>
                                        </div>

                                        <div className="space-y-2">
                                            {allVenues.filter(venue => !selectedVenues.find(sv => sv.id === venue.id)).map((venue) => (
                                                <div
                                                    key={venue.id}
                                                    draggable
                                                    onDragStart={(e) => handleModalDragStart(e, venue)}
                                                    onDragEnd={handleModalDragEnd}
                                                    className="p-2 rounded-lg border-2 border-slate-200 cursor-move hover:border-slate-400 hover:shadow-md transition-all duration-200 bg-slate-50"
                                                >
                                                    <div className="text-sm font-medium text-slate-800">
                                                        {venue.name}
                                                    </div>
                                                    {venue.locationName && venue.locationName !== venue.name && (
                                                        <div className="text-xs text-slate-600 mt-1">
                                                            {venue.locationName}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Side - Group Creation */}
                                    <div className="w-1/2 p-4 overflow-y-auto">
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-base font-semibold text-gray-800">Selected Venues ({selectedVenues.length})</h3>
                                                {selectedVenues.length > 0 && (
                                                    <button
                                                        onClick={clearSelectedVenues}
                                                        className="text-xs text-red-600 hover:text-red-800"
                                                    >
                                                        Clear All
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 mb-2">Drop venues here or drag them back to remove</p>
                                        </div>

                                        <div
                                            className="min-h-[150px] border-2 border-dashed border-gray-300 rounded-lg p-3 space-y-2"
                                            onDragOver={handleModalDragOver}
                                            onDrop={handleModalDrop}
                                        >
                                            {selectedVenues.length === 0 ? (
                                                <div className="text-center text-gray-500 py-8">
                                                    <MapPin className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                                                    <p className="text-xs">Drop venues here to add them to the group</p>
                                                </div>
                                            ) : (
                                                selectedVenues.map((venue) => (
                                                    <div
                                                        key={venue.id}
                                                        draggable
                                                        onDragStart={(e) => handleModalDragStart(e, venue)}
                                                        onDragEnd={handleModalDragEnd}
                                                        className="p-2 rounded-lg border-2 border-blue-200 bg-blue-50 cursor-move hover:border-blue-400 transition-all duration-200 flex items-center justify-between"
                                                    >
                                                        <div>
                                                            <div className="text-sm font-medium text-blue-800">
                                                                {venue.name}
                                                            </div>
                                                            {venue.locationName && venue.locationName !== venue.name && (
                                                                <div className="text-xs text-blue-600 mt-1">
                                                                    {venue.locationName}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => removeVenueFromGroup(venue.id)}
                                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="mt-4 flex gap-3">
                                            <button
                                                onClick={handleCreateVenueGroup}
                                                disabled={selectedVenues.length === 0 || isCreating}
                                                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${selectedVenues.length === 0 || isCreating
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'}`}
                                            >
                                                {isCreating ? 'Creating...' : 'Create Group'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowCreateModal(false)
                                                    setGroupName("")
                                                    setSelectedVenues([])
                                                }}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Section - Existing Groups Table */}
                                <div className="flex-1 p-6 overflow-y-auto">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Existing Venue Groups</h3>
                                    <div className="space-y-4">
                                        {allVenueGroups.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">
                                                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                <p className="text-sm">No venue groups created yet</p>
                                            </div>
                                        ) : (
                                            allVenueGroups.map((group) => (
                                                <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <Users className="h-5 w-5 text-blue-600" />
                                                                <h4 className="text-base font-semibold text-gray-800">{group.name}</h4>
                                                                <span className="text-xs text-gray-600">({group.venues?.length || 0} venues)</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        // Edit functionality - will be implemented later with API
                                                                        console.log('Edit group:', group.id)
                                                                    }}
                                                                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        // Delete functionality - will be implemented later with API
                                                                        console.log('Delete group:', group.id)
                                                                    }}
                                                                    className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-white">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                            {group.venues && group.venues.length > 0 ? (
                                                                group.venues.map((venue, idx) => (
                                                                    <div
                                                                        key={venue.id || idx}
                                                                        className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg"
                                                                    >
                                                                        <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                                        <span className="text-sm text-gray-700 truncate">{venue.name || venue.locationName}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="col-span-full text-center py-2 text-gray-500 text-sm">
                                                                    No venues in this group
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div></>
    )
}
