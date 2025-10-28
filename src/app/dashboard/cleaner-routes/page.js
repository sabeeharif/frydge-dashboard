"use client"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronRight, Users, MapPin, Truck, Navigation, MapPinCheckIcon, X, Plus } from "lucide-react"
import { useToast } from "@/app/contexts/ToastContext"
import { AuthService, api } from "@/app/lib/auth"
import Loader from "@/app/components/Loader"

// Priority Management Utility Functions
const calculateItemPriority = (venues, venueGroupsInfo, dropIndex, itemType) => {
    // Create a combined array to determine the correct priority
    const allItems = []
    
    // Add venues with their current priorities
    if (venues && venues.length > 0) {
        venues.forEach(venue => {
            allItems.push({
                type: 'venue',
                id: venue.id,
                priority: venue.priority || 0,
                data: venue
            })
        })
    }
    
    // Add groups with their current priorities
    if (venueGroupsInfo && venueGroupsInfo.length > 0) {
        venueGroupsInfo.forEach(group => {
            allItems.push({
                type: 'group',
                id: group.groupId,
                priority: group.priority || 0,
                data: group
            })
        })
    }
    
    // Sort by current priority to maintain order
    allItems.sort((a, b) => a.priority - b.priority)
    
    // Calculate new priority based on drop position
    let newPriority = 1
    if (dropIndex >= 0 && dropIndex < allItems.length) {
        newPriority = dropIndex + 1
    } else if (dropIndex >= allItems.length) {
        newPriority = allItems.length + 1
    }
    
    return newPriority
}

const recalculateAllPriorities = (venues, venueGroupsInfo) => {
    // Create combined array and sort by current priority
    const allItems = []
    
    if (venues && venues.length > 0) {
        venues.forEach(venue => {
            allItems.push({
                type: 'venue',
                id: venue.id,
                priority: venue.priority || 0,
                data: venue
            })
        })
    }
    
    if (venueGroupsInfo && venueGroupsInfo.length > 0) {
        venueGroupsInfo.forEach(group => {
            allItems.push({
                type: 'group',
                id: group.groupId,
                priority: group.priority || 0,
                data: group
            })
        })
    }
    
    // Sort by current priority
    allItems.sort((a, b) => a.priority - b.priority)
    
    // Reassign sequential priorities
    allItems.forEach((item, index) => {
        item.data.priority = index + 1
    })
    
    // Separate back into venues and groups
    const updatedVenues = allItems.filter(item => item.type === 'venue').map(item => item.data)
    const updatedGroups = allItems.filter(item => item.type === 'group').map(item => item.data)
    
    return { updatedVenues, updatedGroups }
}

const insertItemAtPriority = (venues, venueGroupsInfo, newItem, targetPriority) => {
    // Create combined array
    const allItems = []
    
    if (venues && venues.length > 0) {
        venues.forEach(venue => {
            allItems.push({
                type: 'venue',
                id: venue.id,
                priority: venue.priority || 0,
                data: venue
            })
        })
    }
    
    if (venueGroupsInfo && venueGroupsInfo.length > 0) {
        venueGroupsInfo.forEach(group => {
            allItems.push({
                type: 'group',
                id: group.groupId,
                priority: group.priority || 0,
                data: group
            })
        })
    }
    
    // Sort by current priority
    allItems.sort((a, b) => a.priority - b.priority)
    
    // Insert new item at target priority position
    const insertIndex = Math.max(0, Math.min(targetPriority - 1, allItems.length))
    allItems.splice(insertIndex, 0, newItem)
    
    // Recalculate all priorities
    allItems.forEach((item, index) => {
        item.data.priority = index + 1
    })
    
    // Separate back into venues and groups
    const updatedVenues = allItems.filter(item => item.type === 'venue').map(item => item.data)
    const updatedGroups = allItems.filter(item => item.type === 'group').map(item => item.data)
    
    return { updatedVenues, updatedGroups }
}

const handleDropWithPriority = (venues, venueGroupsInfo, droppedItem, dropIndex) => {
    // Create combined array of all items
    const allItems = []
    
    if (venues && venues.length > 0) {
        venues.forEach(venue => {
            allItems.push({
                type: 'venue',
                id: venue.id,
                priority: venue.priority || 0,
                data: venue
            })
        })
    }
    
    if (venueGroupsInfo && venueGroupsInfo.length > 0) {
        venueGroupsInfo.forEach(group => {
            allItems.push({
                type: 'group',
                id: group.groupId,
                priority: group.priority || 0,
                data: group
            })
        })
    }
    
    // Sort by current priority
    allItems.sort((a, b) => a.priority - b.priority)
    
    // Remove the dropped item if it already exists
    const filteredItems = allItems.filter(item => 
        !(item.type === droppedItem.type && item.id === droppedItem.id)
    )
    
    // Insert the dropped item at the specified index
    const insertIndex = Math.max(0, Math.min(dropIndex, filteredItems.length))
    filteredItems.splice(insertIndex, 0, droppedItem)
    
    // Recalculate all priorities
    filteredItems.forEach((item, index) => {
        item.data.priority = index + 1
    })
    
    // Separate back into venues and groups
    const updatedVenues = filteredItems.filter(item => item.type === 'venue').map(item => item.data)
    const updatedGroups = filteredItems.filter(item => item.type === 'group').map(item => item.data)
    
    return { updatedVenues, updatedGroups }
}

const reorderItemsWithUnifiedPriority = (venues, venueGroupsInfo, fromIndex, toIndex) => {
    // Create combined array of all items
    const allItems = []
    
    if (venues && venues.length > 0) {
        venues.forEach(venue => {
            allItems.push({
                type: 'venue',
                id: venue.id,
                priority: venue.priority || 0,
                data: venue
            })
        })
    }
    
    if (venueGroupsInfo && venueGroupsInfo.length > 0) {
        venueGroupsInfo.forEach(group => {
            allItems.push({
                type: 'group',
                id: group.groupId,
                priority: group.priority || 0,
                data: group
            })
        })
    }
    
    // Sort by current priority to get the correct order
    allItems.sort((a, b) => a.priority - b.priority)
    
    // Move item from fromIndex to toIndex
    if (fromIndex >= 0 && fromIndex < allItems.length && toIndex >= 0 && toIndex < allItems.length) {
        const [movedItem] = allItems.splice(fromIndex, 1)
        allItems.splice(toIndex, 0, movedItem)
        
        // Recalculate all priorities based on new order
        allItems.forEach((item, index) => {
            item.data.priority = index + 1
        })
    }
    
    // Separate back into venues and groups
    const updatedVenues = allItems.filter(item => item.type === 'venue').map(item => item.data)
    const updatedGroups = allItems.filter(item => item.type === 'group').map(item => item.data)
    
    return { updatedVenues, updatedGroups }
}

export default function CleanerRoutesPage() {
    // State for API data
    const [allVenues, setAllVenues] = useState([])
    const [allVenueGroups, setAllVenueGroups] = useState([])
    const [drivers, setDrivers] = useState([])
    const [venueGroups, setVenueGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorState, setErrorState] = useState(null)
    const [expandedGroups, setExpandedGroups] = useState({}) // Track expanded groups in cleaner routes

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedVenues, setSelectedVenues] = useState([])
    const [groupName, setGroupName] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [editingGroup, setEditingGroup] = useState(null) // Track which group is being edited
    const [isDeleting, setIsDeleting] = useState(null) // Track which group is being deleted

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
    const [dragOverIndex, setDragOverIndex] = useState(null) // Track which position we're hovering over for reordering
    const [modalDragOverIndex, setModalDragOverIndex] = useState(null) // Track drag over position in modal selected venues

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
                    api.getCleanerVacantLocations(), // Using cleaner-specific vacant locations
                    api.getVenueGroups({ limit: 10 }), // Fetch all venue groups
                    api.getDrivers() // Using drivers API - they're cleaners in this context
                ])

                // Check if all requests were successful
                if (!venuesResponse.ok || !venueGroupsResponse.ok || !driversResponse.ok) {
                    throw new Error('Failed to fetch data from one or more APIs')
                }

                // Parse responses
                const venuesData = await venuesResponse.json()
                const venueGroupsData = await venueGroupsResponse.json()
                const driversData = await driversResponse.json() // Drivers are used as cleaners

                console.log('Fetched data (drivers as cleaners):', { venuesData, venueGroupsData, driversData })

                // Transform and set venues data
                const transformedVenues = venuesData.locations || venuesData.vacantLocations || venuesData.data || []
                setAllVenues(transformedVenues.map((venue, index) => ({
                    id: venue.id || venue.venueId || index + 1,
                    name: venue.name || venue.venueName || venue.locationName || `Venue ${index + 1}`,
                    locationName: venue.locationName,
                    address: venue.address,
                    latitude: venue.latitude,
                    longitude: venue.longitude,
                    photo: venue.photo,
                    machine: venue.machine,
                    account: venue.account,
                    venue: venue.venue,
                    userId: venue.userId,
                    ...venue
                })))

                // Transform and set venue groups data
                const transformedVenueGroups = venueGroupsData.groups || venueGroupsData.venueGroups || venueGroupsData.data || []
                const groupsWithExpansion = transformedVenueGroups.map((group, index) => ({
                    id: group.id || group.groupId || index + 1,
                    name: group.name || group.groupName || `Group ${index + 1}`,
                    isExpanded: false,
                    venues: group.venues || group.venueList || [],
                    ...group
                }))

                setAllVenueGroups(groupsWithExpansion)
                setVenueGroups(groupsWithExpansion)

                // Transform and set drivers data (used as cleaners in this context)
                const transformedDrivers = driversData.drivers || driversData.data || []
                console.log('Transformed drivers (as cleaners):', transformedDrivers)
                setDrivers(transformedDrivers.map((driver, index) => ({
                    id: driver.userId || driver.id || driver.driverId || index + 1, // Use userId as the primary id
                    userId: driver.userId, // Keep the original userId field
                    name: `${driver.firstName || driver.first_name || 'Driver'} ${driver.lastName || driver.last_name || (index + 1)}`,
                    firstName: driver.firstName || driver.first_name || 'Driver',
                    lastName: driver.lastName || driver.last_name || (index + 1),
                    assignedVenues: [],
                    ...driver
                })))
                console.log('Drivers (as cleaners) state set with:', transformedDrivers.length, 'items')

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

                    const response = await api.getCleanerRoutes({ userId, fetchAll: true })
                    if (response.ok) {
                        const data = await response.json()
                        console.log(`Cleaner routes data for ${driver.name}:`, data)

                        // Handle the cleaner routes response structure: { cleanerRoutes: [...], lastKey: ... }
                        let routes = []
                        if (data.cleanerRoutes && Array.isArray(data.cleanerRoutes)) {
                            routes = data.cleanerRoutes
                        } else if (data.routes && Array.isArray(data.routes)) {
                            routes = data.routes
                        } else if (Array.isArray(data)) {
                            routes = data
                        } else if (data.data && Array.isArray(data.data)) {
                            routes = data.data
                        }

                        console.log(`Processed cleaner routes for ${driver.name}:`, routes)

                        // Process routes to fetch group details if needed
                        const processedRoutes = await Promise.all(
                            routes.map(async (route) => {
                                if (route.venueGroupsInfo && route.venueGroupsInfo.length > 0) {
                                    // Fetch group details for each group
                                    const groupDetails = await Promise.all(
                                        route.venueGroupsInfo.map(async (groupInfo) => {
                                            const groupData = await fetchVenueGroupById(groupInfo.groupId)
                                            return {
                                                ...groupInfo,
                                                groupDetails: groupData
                                            }
                                        })
                                    )
                                    return {
                                        ...route,
                                        venueGroupsInfo: groupDetails
                                    }
                                }
                                return route
                            })
                        )

                        // Extract venues and groups from routes and add to driver's assigned venues
                        const assignedVenues = []
                        processedRoutes.forEach(route => {
                            // Handle individual venues
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
                                            latitude: parseFloat(venue.latitude) || 0,
                                            longitude: parseFloat(venue.longitude) || 0,
                                            machine: venue.machine,
                                            priority: venue.priority || 1,
                                            type: 'venue',
                                            routeId: route.cleanerRouteId || route.routeId, // Use cleanerRouteId
                                            routeName: route.routeName,
                                            ...venue
                                        })
                                    }
                                })
                            }
                            
                            // Handle venue groups
                            if (route.venueGroupsInfo && Array.isArray(route.venueGroupsInfo)) {
                                route.venueGroupsInfo.forEach(groupInfo => {
                                    // Check if group already exists in assignedVenues
                                    const exists = assignedVenues.find(v => v.id === groupInfo.groupId)
                                    if (!exists) {
                                        assignedVenues.push({
                                            id: groupInfo.groupId,
                                            name: groupInfo.groupDetails?.name || groupInfo.groupDetails?.groupName || `Group ${groupInfo.groupId}`,
                                            type: 'group',
                                            priority: groupInfo.priority || 1,
                                            routeId: route.cleanerRouteId || route.routeId,
                                            routeName: route.routeName,
                                            venues: groupInfo.groupDetails?.venues || groupInfo.groupDetails?.venueList || [],
                                            groupDetails: groupInfo.groupDetails,
                                            ...groupInfo
                                        })
                                    }
                                })
                            }
                        })

                        // Sort venues by priority (ascending: 1, 2, 3, 4...)
                        assignedVenues.sort((a, b) => (a.priority || 0) - (b.priority || 0))

                        console.log(`Assigned venues for driver ${driver.name} (sorted by priority):`, assignedVenues)
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

    // Refetch vacant locations to update userId arrays after route changes
    const refetchVacantLocations = async () => {
        try {
            const venuesResponse = await api.getCleanerVacantLocations()
            if (venuesResponse.ok) {
                const venuesData = await venuesResponse.json()
                const transformedVenues = venuesData.locations || venuesData.vacantLocations || venuesData.data || []
                setAllVenues(transformedVenues.map((venue, index) => ({
                    id: venue.id || venue.venueId || index + 1,
                    name: venue.name || venue.venueName || venue.locationName || `Venue ${index + 1}`,
                    locationName: venue.locationName,
                    address: venue.address,
                    latitude: venue.latitude,
                    longitude: venue.longitude,
                    photo: venue.photo,
                    machine: venue.machine,
                    account: venue.account,
                    venue: venue.venue,
                    userId: venue.userId,
                    ...venue
                })))
                console.log('Vacant locations refetched successfully')
            }
        } catch (err) {
            console.error('Error refetching vacant locations:', err)
        }
    }

    // Refresh venue groups to update userId arrays after route changes
    const refetchVenueGroups = async () => {
        try {
            console.log('Refetching venue groups...')
            const response = await api.getVenueGroups({ limit: 100 })
            console.log('Venue groups refetch response:', response)
            
            if (response.ok) {
                const data = await response.json()
                console.log('Venue groups data:', data)
                
                // Apply the same transformation as in initial load
                const transformedVenueGroups = data.groups || data.data || []
                const groupsWithExpansion = transformedVenueGroups.map((group, index) => ({
                    id: group.id || group.groupId || index + 1,
                    name: group.name || group.groupName || `Group ${index + 1}`,
                    isExpanded: false,
                    venues: group.venues || group.venueList || [],
                    ...group
                }))
                
                setAllVenueGroups(groupsWithExpansion)
                setVenueGroups(groupsWithExpansion)
                console.log('Venue groups refetched successfully')
            } else {
                console.error('Failed to refetch venue groups:', response)
                const errorData = await response.json().catch(() => ({}))
                console.error('Venue groups refetch error details:', errorData)
            }
        } catch (err) {
            console.error('Error refetching venue groups:', err)
        }
    }

    // Get all venues - DO NOT filter assigned venues, show ALL
    const getAvailableVenues = () => {
        return allVenues
    }

    // Get available groups (not assigned to any driver)
    const getAvailableGroups = () => {
        // Always return all groups - don't filter out assigned ones
        return allVenueGroups
    }

    // Toggle group expansion
    const toggleGroup = async (groupId) => {
        const group = venueGroups.find(g => g.id === groupId)
        const isCurrentlyExpanded = group?.isExpanded || false
        
        // If expanding and we don't have detailed venue data, fetch it
        if (!isCurrentlyExpanded && (!group?.venues || group.venues.length === 0)) {
            try {
                const detailedGroup = await fetchVenueGroupById(groupId)
                if (detailedGroup) {
                    setVenueGroups(prev =>
                        prev.map(g =>
                            g.id === groupId
                                ? { 
                                    ...g, 
                                    isExpanded: true,
                                    venues: detailedGroup.venues || detailedGroup.venueList || [],
                                    ...detailedGroup
                                }
                                : g
                        )
                    )
                    return
                }
            } catch (error) {
                console.error('Error fetching group details:', error)
            }
        }
        
        // Toggle expansion state
        setVenueGroups(prev =>
            prev.map(g =>
                g.id === groupId
                    ? { ...g, isExpanded: !g.isExpanded }
                    : g
            )
        )
    }

    // Toggle group expansion in cleaner routes
    const toggleCleanerGroup = async (groupId, driverId) => {
        const groupKey = `${driverId}-${groupId}`
        const isCurrentlyExpanded = expandedGroups[groupKey] || false
        
        if (!isCurrentlyExpanded) {
            // Fetch group details if not already fetched
            try {
                const detailedGroup = await fetchVenueGroupById(groupId)
                if (detailedGroup) {
                    // Update the driver's assigned venues with the detailed group info
                    setDrivers(prev =>
                        prev.map(driver =>
                            driver.id === driverId
                                ? {
                                    ...driver,
                                    assignedVenues: driver.assignedVenues.map(item =>
                                        item.id === groupId && item.type === 'group'
                                            ? {
                                                ...item,
                                                groupDetails: detailedGroup,
                                                venues: detailedGroup.venues || detailedGroup.venueList || []
                                            }
                                            : item
                                    )
                                }
                                : driver
                        )
                    )
                }
            } catch (error) {
                console.error('Error fetching group details for cleaner:', error)
            }
        }
        
        // Toggle expansion state
        setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: !isCurrentlyExpanded
        }))
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
        setDragOverIndex(null)
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


    const getVenueTypeColor = (venue) => {
        // Color coding based on UNIQUE userId count (not array length)
        // Get unique user IDs from the array
        const uniqueUserIds = [...new Set(venue?.userId || [])]
        const uniqueCount = uniqueUserIds.length
        
        if (uniqueCount === 0) {
            // Not assigned to any cleaner - default white/slate
            return "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:border-slate-400"
        } else if (uniqueCount === 1) {
            // Assigned to exactly 1 unique cleaner (green even if userId appears multiple times) - green
            return "bg-green-100 border-green-400 text-green-800 hover:bg-green-200 hover:border-green-500"
        } else {
            // Assigned to 2 or more different cleaners - red (conflict)
            return "bg-red-100 border-red-400 text-red-800 hover:bg-red-200 hover:border-red-500"
        }
    }

    const getGroupTypeColor = (group) => {
        // Color coding based on UNIQUE userId count for groups
        // Get unique user IDs from the array
        const uniqueUserIds = [...new Set(group?.userId || [])]
        const uniqueCount = uniqueUserIds.length
        
        if (uniqueCount === 0) {
            // Not assigned to any cleaner - white
            return "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
        } else if (uniqueCount === 1) {
            // Assigned to exactly 1 unique cleaner - green
            return "bg-green-100 border-green-400 text-green-800 hover:bg-green-200 hover:border-green-500"
        } else {
            // Assigned to 2 or more different cleaners - red (conflict)
            return "bg-red-100 border-red-400 text-red-800 hover:bg-red-200 hover:border-red-500"
        }
    }

    // Modal drag and drop handlers
    const handleModalDragStart = (e, venue) => {
        setDraggedItem(venue)
        e.dataTransfer.effectAllowed = "move"
    }

    const handleModalDragEnd = () => {
        setDraggedItem(null)
        setModalDragOverIndex(null)
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

    // Handle reordering venues within selected venues
    const handleModalVenueReorder = (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return

        setSelectedVenues(prev => {
            const reorderedVenues = [...prev]
            const [movedItem] = reorderedVenues.splice(fromIndex, 1)
            reorderedVenues.splice(toIndex, 0, movedItem)
            
            // Update priorities based on new order
            return reorderedVenues.map((venue, index) => ({
                ...venue,
                priority: index + 1
            }))
        })
    }

    // Handle drag over specific venue in modal for reordering
    const handleModalVenueDragOver = (e, index) => {
        e.preventDefault()
        e.stopPropagation()
        setModalDragOverIndex(index)
    }

    // Handle drop on specific venue in modal for reordering
    const handleModalVenueDrop = (e, targetIndex) => {
        e.preventDefault()
        e.stopPropagation()

        if (draggedItem) {
            const fromIndex = selectedVenues.findIndex(v => v.id === draggedItem.id)
            if (fromIndex !== -1) {
                handleModalVenueReorder(fromIndex, targetIndex)
            }
        }
        setModalDragOverIndex(null)
    }

    const clearSelectedVenues = () => {
        setSelectedVenues([])
    }

    // Refresh venue groups data
    const refreshVenueGroups = async () => {
        const venueGroupsResponse = await api.getVenueGroups({ limit: 10 })
        if (venueGroupsResponse.ok) {
            const venueGroupsData = await venueGroupsResponse.json()
            const transformedVenueGroups = venueGroupsData.groups || venueGroupsData.venueGroups || venueGroupsData.data || []
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
    }

    // Fetch venue group details by ID
    const fetchVenueGroupById = async (groupId) => {
        try {
            const response = await api.getVenueGroupById(groupId)
            if (response.ok) {
                const data = await response.json()
                // Handle the API response format: { message: "...", groups: { groupName: "...", venues: [...] } }
                if (data.groups) {
                    return {
                        id: data.groups.groupId,
                        groupId: data.groups.groupId,
                        name: data.groups.groupName,
                        groupName: data.groups.groupName,
                        venues: data.groups.venues || [],
                        venueList: data.groups.venues || [],
                        createdAt: data.groups.createdAt,
                        updatedAt: data.groups.updatedAt,
                        used: data.groups.used,
                        ...data.groups
                    }
                }
                return data
            } else {
                console.error('Failed to fetch venue group details:', response.status)
                return null
            }
        } catch (error) {
            console.error('Error fetching venue group details:', error)
            return null
        }
    }

    // Create or Update venue group
    const handleCreateVenueGroup = async () => {
        if (selectedVenues.length === 0) {
            alert("Please select at least one venue")
            return
        }

        if (!groupName.trim()) {
            alert("Please enter a group name")
            return
        }

        try {
            setIsCreating(true)

            // Transform venues to match API format
            const venuesData = selectedVenues.map((venue, index) => ({
                id: venue.id,
                priority: venue.priority || index + 1,
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

            let response
            if (editingGroup) {
                // Update existing group
                response = await api.updateVenueGroup({
                    groupId: editingGroup.id,
                    groupName: groupName.trim(),
                    venues: venuesData
                })
            } else {
                // Create new group
                response = await api.createVenueGroup({
                    groupName: groupName.trim(),
                    venues: venuesData
                })
            }

            if (!response.ok) {
                let errorData
                try {
                    errorData = await response.json()
                } catch (e) {
                    throw new Error(`Failed to ${editingGroup ? 'update' : 'create'} venue group: ${response.status} ${response.statusText}`)
                }
                throw new Error(errorData.error || `Failed to ${editingGroup ? 'update' : 'create'} venue group`)
            }

            const result = await response.json()
            console.log(`Venue group ${editingGroup ? 'updated' : 'created'}:`, result)

            // Close modal and reset state
            setShowCreateModal(false)
            setGroupName("")
            setSelectedVenues([])
            setEditingGroup(null)

            // Refresh venue groups data
            await refreshVenueGroups()

            success(`Venue group ${editingGroup ? 'updated' : 'created'} successfully!`)

        } catch (err) {
            console.error(`Error ${editingGroup ? 'updating' : 'creating'} venue group:`, err)
            error(`Error ${editingGroup ? 'updating' : 'creating'} venue group: ${err.message}`)
        } finally {
            setIsCreating(false)
        }
    }

    // Delete venue group
    const handleDeleteVenueGroup = async (group) => {
        if (!confirm(`Are you sure you want to delete the venue group "${group.name}"?`)) {
            return
        }

        try {
            setIsDeleting(group.id)

            const response = await api.deleteVenueGroup({
                groupId: group.id
            })

            if (!response.ok) {
                let errorData
                try {
                    errorData = await response.json()
                } catch (e) {
                    throw new Error(`Failed to delete venue group: ${response.status} ${response.statusText}`)
                }

                // Provide more helpful error messages
                let errorMessage = errorData.error || 'Failed to delete venue group'
                if (response.status === 500 || response.status === 502) {
                    errorMessage += '. The group might be in use or assigned to a cleaner. Please unassign it first.'
                }
                throw new Error(errorMessage)
            }

            const result = await response.json()
            console.log('Venue group deleted:', result)

            // Refresh venue groups data
            await refreshVenueGroups()

            success(`Venue group "${group.name}" deleted successfully!`)

        } catch (err) {
            console.error('Error deleting venue group:', err)
            error(`Error deleting venue group: ${err.message}`)
        } finally {
            setIsDeleting(null)
        }
    }

    // Handle edit button click
    const handleEditVenueGroup = (group) => {
        setEditingGroup(group)
        setGroupName(group.name || group.groupName || "")
        setSelectedVenues(group.venues || [])
        // Modal should already be open, if not open it
        if (!showCreateModal) {
            setShowCreateModal(true)
        }
    }

    // Route creation functionality
    const createRouteForDriver = async (driver, venues, groupInfo = null) => {
        console.log('createRouteForDriver called with:', { driver: driver?.name, venuesCount: venues?.length, groupInfo: groupInfo?.name || groupInfo?.groupId })
        
        if (!driver || (venues.length === 0 && !groupInfo)) {
            error("Cleaner and venues (or group) are required to create a route")
            return false
        }

        try {
            setCreatingRouteForDriver(driver.id)

            // Generate route name automatically
            const routeName = `frydge-route-${driver.firstName || driver.lastName || driver.id}`.toLowerCase()

            const routeData = {
                userId: driver.userId || driver.id, // Top-level userId as string (using userId value)
                vlUserId: driver.vlUserId || driver.userId || driver.id, // Top-level vlUserId as string (using vlUserId value)
                routeName: routeName,
                venues: [],
            }

            // Handle group assignment
            if (groupInfo) {
                console.log('Creating route with group info:', groupInfo)
                // For groups, calculate priority based on existing route items
                const existingVenues = []
                const existingGroups = []
                
                // Get existing route data if any
                try {
                    const existingResponse = await api.getCleanerRoutes({ userId: driver.userId || driver.id, fetchAll: true })
                    if (existingResponse.ok) {
                        const existingData = await existingResponse.json()
                        const existingRoutes = existingData.routes || existingData.data || []
                        if (existingRoutes.length > 0) {
                            existingVenues.push(...(existingRoutes[0].venues || []))
                            existingGroups.push(...(existingRoutes[0].venueGroupsInfo || []))
                        }
                    }
                } catch (err) {
                    console.log('No existing route found, creating new one')
                }
                
                // Calculate correct priority for the new group
                const { updatedGroups } = insertItemAtPriority(
                    existingVenues,
                    existingGroups,
                    {
                        type: 'group',
                        id: groupInfo.id || groupInfo.groupId,
                        priority: 0, // Will be recalculated
                        data: {
                            groupId: groupInfo.id || groupInfo.groupId,
                            priority: 1, // Will be recalculated
                            userId: [driver.userId || driver.id]
                        }
                    },
                    1 // Insert at position 1 if no existing items
                )
                
                // Ensure all groups have proper userId arrays
                const finalGroups = updatedGroups.map(group => ({
                    ...group,
                    userId: Array.isArray(group.userId) ? group.userId : [driver.userId || driver.id]
                }))
                
                routeData.venueGroupsInfo = finalGroups
            } else {
                // For individual venues, transform venues to match API format
                const venuesData = venues.map((venue, index) => ({
                    userId: [driver.userId || driver.id], // Each venue needs userId as array (using userId value)
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
                routeData.venues = venuesData
            }

            console.log("Creating route for driver:", driver.name, "userId:", driver.userId, "vlUserId:", driver.vlUserId, "with data:", routeData)

            const response = await api.createCleanerRoute(routeData)

            console.log("POST response status:", response.status, "ok:", response.ok)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                console.error("POST error:", errorData)
                throw new Error(errorData.error || `HTTP ${response.status}`)
            }

            const result = await response.json()
            console.log("Route created successfully:", result)

            // Update the venue group with the new userId if it's a group
            if (groupInfo) {
                try {
                    // Get existing userIds from the group and add the new one
                    const existingUserIds = groupInfo.userId || []
                    const newUserId = driver.userId || driver.id
                    const updatedUserIds = existingUserIds.includes(newUserId) 
                        ? existingUserIds 
                        : [...existingUserIds, newUserId]
                    
                    const groupUpdateData = {
                        userId: updatedUserIds,
                        groupId: groupInfo.id || groupInfo.groupId,
                        groupName: groupInfo.name || groupInfo.groupName || `Group ${groupInfo.id}`,
                        venues: groupInfo.venues || []
                    }
                    
                    const groupUpdateResponse = await api.updateVenueGroup(groupUpdateData)
                    if (!groupUpdateResponse.ok) {
                        console.error('Failed to update venue group:', groupUpdateResponse)
                    }
                } catch (groupError) {
                    console.error('Error updating venue group:', groupError)
                }
            }

            // Show appropriate success message based on whether it's a group or venue
            if (groupInfo) {
                success(`Group '${groupInfo.name || groupInfo.groupName || 'Group'}' assigned to ${driver.name} (Cleaner)!`)
            } else {
                success(`Route created successfully for ${driver.name} (Cleaner)!`)
            }

            // Refresh vacant locations to update userId arrays
            await refetchVacantLocations()
            
            // Refresh venue groups to update userId arrays
            await refetchVenueGroups()
            
            // Refresh routes after creation
            const updatedDriversWithRoutes = await loadExistingRoutesForDrivers(drivers)
            setDrivers(updatedDriversWithRoutes)

            return true

        } catch (err) {
            console.error("Error creating route:", err)
            error(`Failed to create route for ${driver.name} (Cleaner): ${err.message}`)
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
            error("Cleaner not found")
            return
        }

        // Remove from previous driver if dragged from another driver
        if (draggedFromDriver && draggedFromDriver !== driverId) {
            const previousDriver = drivers?.find(d => d.id === draggedFromDriver)

            if (previousDriver) {
                // Calculate remaining venues after removing the dragged one
                const remainingVenues = previousDriver.assignedVenues
                    .filter(v => v.id !== draggedItem.id && v.type === 'venue')
                    .map((v, index) => ({ ...v, priority: index + 1 })) // Reindex priorities
                    .sort((a, b) => (a.priority || 0) - (b.priority || 0))

                // Update local state
                setDrivers(prev =>
                    prev.map(d =>
                        d.id === draggedFromDriver
                            ? {
                                ...d,
                                assignedVenues: previousDriver.assignedVenues
                                    .filter(v => v.id !== draggedItem.id)
                                    .map((v, index) => ({ ...v, priority: v.type === 'venue' ? index + 1 : v.priority }))
                                    .sort((a, b) => (a.priority || 0) - (b.priority || 0))
                            }
                            : d
                    )
                )

                // Update or delete the route in the backend
                try {
                    const userId = previousDriver.userId || previousDriver.id
                    const response = await api.getCleanerRoutes({ userId, fetchAll: true })
                    if (response.ok) {
                        const data = await response.json()
                        const routes = data.cleanerRoutes || data.routes || data.data || []

                        if (routes.length > 0) {
                            const route = routes[0] // Get the main route
                            const routeId = route.cleanerRouteId || route.routeId

                            // If there are remaining venues, update the route
                            if (remainingVenues.length > 0) {
                                const venuesData = remainingVenues.map((venue, index) => ({
                                    vlUserId: [previousDriver.vlUserId || previousDriver.userId || previousDriver.id], // Each venue needs vlUserId as array
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

                                const updateResponse = await api.updateCleanerRoute({
                                    vlUserId: previousDriver.vlUserId || previousDriver.userId || previousDriver.id, // Top-level vlUserId as string
                                    cleanerRouteId: routeId,
                                    routeName: route.routeName || `Route-${previousDriver.firstName || previousDriver.name}`,
                                    venues: venuesData
                                })

                                if (!updateResponse.ok) {
                                    throw new Error('Failed to update route for previous driver')
                                }
                                console.log(`Updated route ${routeId} for driver ${previousDriver.name}`)
                                
                                // Update venue group if it's a group being moved
                                if (draggedItem.sourceType === 'group') {
                                    try {
                                        const currentGroup = allVenueGroups.find(g => g.id === draggedItem.id || g.groupId === draggedItem.id)
                                        const existingUserIds = currentGroup?.userId || draggedItem.userId || []
                                        const previousUserId = previousDriver.userId || previousDriver.id
                                        const updatedUserIds = existingUserIds.filter(id => id !== previousUserId)
                                        
                                        console.log('Updating venue group for previous cleaner:', {
                                            groupId: draggedItem.id,
                                            existingUserIds,
                                            previousUserId,
                                            updatedUserIds
                                        })
                                        
                                        const groupUpdateData = {
                                            userId: updatedUserIds,
                                            groupId: draggedItem.id || draggedItem.groupId,
                                            groupName: draggedItem.name || draggedItem.groupName || `Group ${draggedItem.id}`,
                                            venues: draggedItem.venues || []
                                        }
                                        
                                        const groupUpdateResponse = await api.updateVenueGroup(groupUpdateData)
                                        if (groupUpdateResponse.ok) {
                                            console.log('Venue group updated successfully for previous cleaner:', groupUpdateData)
                                        } else {
                                            console.error('Failed to update venue group for previous cleaner:', groupUpdateResponse)
                                        }
                                    } catch (groupError) {
                                        console.error('Error updating venue group for previous cleaner:', groupError)
                                    }
                                }
                                
                                // Refresh vacant locations to update userId arrays
                                await refetchVacantLocations()
                                
                                // Refresh venue groups to update userId arrays
                                await refetchVenueGroups()
                            } else {
                                // No venues left, delete the entire route
                                const deleteResponse = await api.deleteCleanerRoute({ cleanerRouteId: routeId })
                                if (deleteResponse.ok) {
                                    console.log(`Deleted route ${routeId} from driver ${previousDriver.name} (no venues left)`)
                                    
                                    // Update venue group if it's a group being moved
                                    if (draggedItem.sourceType === 'group') {
                                        try {
                                            const currentGroup = allVenueGroups.find(g => g.id === draggedItem.id || g.groupId === draggedItem.id)
                                            const existingUserIds = currentGroup?.userId || draggedItem.userId || []
                                            const previousUserId = previousDriver.userId || previousDriver.id
                                            const updatedUserIds = existingUserIds.filter(id => id !== previousUserId)
                                            
                                            console.log('Updating venue group for deleted cleaner route:', {
                                                groupId: draggedItem.id,
                                                existingUserIds,
                                                previousUserId,
                                                updatedUserIds
                                            })
                                            
                                            const groupUpdateData = {
                                                userId: updatedUserIds,
                                                groupId: draggedItem.id || draggedItem.groupId,
                                                groupName: draggedItem.name || draggedItem.groupName || `Group ${draggedItem.id}`,
                                                venues: draggedItem.venues || []
                                            }
                                            
                                            const groupUpdateResponse = await api.updateVenueGroup(groupUpdateData)
                                            if (groupUpdateResponse.ok) {
                                                console.log('Venue group updated successfully for deleted cleaner route:', groupUpdateData)
                                            } else {
                                                console.error('Failed to update venue group for deleted cleaner route:', groupUpdateResponse)
                                            }
                                        } catch (groupError) {
                                            console.error('Error updating venue group for deleted cleaner route:', groupError)
                                        }
                                    }
                                    
                                    // Refresh vacant locations to update userId arrays
                                    await refetchVacantLocations()
                                    
                                    // Refresh venue groups to update userId arrays
                                    await refetchVenueGroups()
                                }
                            }

                            // Refresh routes for previous driver after update/deletion
                            const updatedDriversWithRoutes = await loadExistingRoutesForDrivers(drivers)
                            setDrivers(updatedDriversWithRoutes)
                        }
                    }
                } catch (err) {
                    console.error("Error updating route from previous driver:", err)
                    error(`Failed to remove venue from previous cleaner: ${err.message}`)
                }
            }
        }

        // Calculate the next priority based on existing venues
        const nextPriority = driver.assignedVenues.length + 1

        // Add to new driver (avoid duplicates)
        const newVenue = {
            id: draggedItem.id,
            name: draggedItem.name,
            type: draggedItem.sourceType === 'group' ? 'group' : 'venue',
            priority: nextPriority,
            ...draggedItem // Include all original data
        }

        setDrivers(prev =>
            prev.map(d =>
                d.id === driverId
                    ? {
                        ...d,
                        assignedVenues: [
                            ...d.assignedVenues.filter(v => v.id !== draggedItem.id),
                            newVenue
                        ].sort((a, b) => (a.priority || 0) - (b.priority || 0)) // Sort by priority
                    }
                    : d
            )
        )

        // Combine all venues (existing + new) for route creation/update
        const existingVenues = driver.assignedVenues.filter(v => v.type === 'venue' && v.id !== draggedItem.id)

        // Create route with all venues if this is a venue (not a group)
        if (draggedItem.sourceType === 'venue') {
            const newVenueData = {
                id: draggedItem.id,
                name: draggedItem.name,
                locationName: draggedItem.locationName || draggedItem.name,
                address: draggedItem.address || "N/A",
                latitude: draggedItem.latitude || 0,
                longitude: draggedItem.longitude || 0,
                priority: nextPriority,
                machine: draggedItem.machine || {
                    id: 0,
                    name: "N/A",
                    freeVend: false,
                    isFridge: false
                }
            }

            // Combine existing venues with new one
            const allVenues = [...existingVenues, newVenueData]

            // Check if driver already has routes
            try {
                const userId = driver.userId || driver.id
                const response = await api.getCleanerRoutes({ userId, fetchAll: true })

                if (response.ok) {
                    const data = await response.json()
                    const routes = data.cleanerRoutes || data.routes || data.data || []

                    if (routes.length > 0) {
                        // Update existing route with all venues (existing + new)
                        const routeId = routes[0].cleanerRouteId || routes[0].routeId

                        const venuesData = allVenues.map((venue, index) => ({
                            userId: [driver.userId || driver.id], // Each venue needs userId as array (using userId value)
                            id: parseInt(venue.id),
                            priority: index + 1, // Stack priority: 1, 2, 3, 4...
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

                        const updateResponse = await api.updateCleanerRoute({
                            userId: driver.userId || driver.id, // Top-level userId as string (using userId value)
                            vlUserId: driver.vlUserId || driver.userId || driver.id, // Top-level vlUserId as string (using vlUserId value)
                            cleanerRouteId: routeId,
                                routeName: routes[0].routeName || `Route-${driver.firstName || driver.name}`,
                            venues: venuesData
                        })

                        if (updateResponse.ok) {
                            success(`Venue added to ${driver.name}'s (Cleaner) route!`)
                            // Refresh vacant locations to update userId arrays
                            await refetchVacantLocations()
                            // Refresh routes
                            const updatedDriversWithRoutes = await loadExistingRoutesForDrivers(drivers)
                            setDrivers(updatedDriversWithRoutes)
                        } else {
                            throw new Error('Failed to update route')
                        }
                    } else {
                        // No existing route, create new one
                        await createRouteForDriver(driver, allVenues)
                    }
                } else {
                    // No existing routes, create new one
                    await createRouteForDriver(driver, allVenues)
                }
            } catch (err) {
                console.error('Error managing route:', err)
                // Fallback: create new route
                await createRouteForDriver(driver, allVenues)
            }
        } else if (draggedItem.sourceType === 'group') {
            console.log('Group assignment detected:', draggedItem.name, 'to driver:', driver.name)
            // Handle group assignment - check if dragged from another driver
            if (draggedFromDriver && draggedFromDriver !== driverId) {
                // Remove group from previous driver first
                const previousDriver = drivers?.find(d => d.id === draggedFromDriver)
                if (previousDriver) {
                    try {
                        const prevUserId = previousDriver.userId || previousDriver.id
                        const prevResponse = await api.getCleanerRoutes({ userId: prevUserId, fetchAll: true })
                        
                        if (prevResponse.ok) {
                            const prevData = await prevResponse.json()
                            const prevRoutes = prevData.routes || prevData.cleanerRoutes || []
                            
                            if (prevRoutes.length > 0) {
                                const prevRouteId = prevRoutes[0].cleanerRouteId || prevRoutes[0].routeId
                                // Remove the group and recalculate priorities for remaining items
                                const remainingGroups = (prevRoutes[0].venueGroupsInfo || [])
                                    .filter(g => g.groupId !== draggedItem.id)
                                
                                const remainingVenues = prevRoutes[0].venues || []
                                
                                // Recalculate priorities for all remaining items
                                const { updatedVenues, updatedGroups } = recalculateAllPriorities(
                                    remainingVenues,
                                    remainingGroups
                                )
                                
                                // Preserve userId for groups
                                const finalGroups = updatedGroups.map(g => ({
                                    ...g,
                                    userId: Array.isArray(g.userId) ? g.userId : [previousDriver.userId || previousDriver.id]
                                }))
                                
                                // Update previous driver's route
                                const prevUpdateResponse = await api.updateCleanerRoute({
                                    userId: previousDriver.userId || previousDriver.id,
                                    vlUserId: previousDriver.vlUserId || previousDriver.userId || previousDriver.id,
                                    cleanerRouteId: prevRouteId,
                                    routeName: prevRoutes[0].routeName || `Route-${previousDriver.firstName || previousDriver.name}`,
                                    venueGroupsInfo: finalGroups,
                                    venues: updatedVenues
                                })
                                
                                if (!prevUpdateResponse.ok) {
                                    console.error('Failed to remove group from previous driver')
                                }
                            }
                        }
                    } catch (err) {
                        console.error('Error removing group from previous driver:', err)
                    }
                }
            }
            
            // Now add group to new driver
            try {
                const userId = driver.userId || driver.id
                const response = await api.getCleanerRoutes({ userId, fetchAll: true })
                
                if (response.ok) {
                    const data = await response.json()
                    const routes = data.routes || data.cleanerRoutes || []
                    
                    if (routes.length > 0) {
                        // Update existing route with group info
                        const routeId = routes[0].cleanerRouteId || routes[0].routeId
                        const existingGroups = routes[0].venueGroupsInfo || []
                        
                        // Calculate correct priority for the new group based on drop position
                        const { updatedVenues, updatedGroups } = insertItemAtPriority(
                            routes[0].venues || [],
                            existingGroups,
                            {
                                type: 'group',
                                id: draggedItem.id || draggedItem.groupId,
                                priority: 0, // Will be recalculated
                                data: {
                                    groupId: draggedItem.id || draggedItem.groupId,
                                    priority: 1, // Will be recalculated
                                    userId: [driver.userId || driver.id]
                                }
                            },
                            (routes[0].venues?.length || 0) + (existingGroups.length || 0) + 1 // Insert at end
                        )
                        
                        // Ensure all groups have proper userId arrays
                        const finalGroups = updatedGroups.map(group => ({
                            ...group,
                            userId: Array.isArray(group.userId) ? group.userId : [driver.userId || driver.id]
                        }))
                        
                        const updateResponse = await api.updateCleanerRoute({
                                userId: driver.userId || driver.id,
                                vlUserId: driver.vlUserId || driver.userId || driver.id,
                                cleanerRouteId: routeId,
                                routeName: routes[0].routeName || `Route-${driver.firstName || driver.name}`,
                                venueGroupsInfo: finalGroups,
                                venues: updatedVenues
                            })
                        
                        if (updateResponse.ok) {
                            // Update the venue group with the new userId
                            try {
                                // Get existing userIds from the group and add the new one
                                const existingUserIds = draggedItem.userId || []
                                const newUserId = driver.userId || driver.id
                                const updatedUserIds = existingUserIds.includes(newUserId) 
                                    ? existingUserIds 
                                    : [...existingUserIds, newUserId]
                                
                                const groupUpdateData = {
                                    userId: updatedUserIds,
                                    groupId: draggedItem.id || draggedItem.groupId,
                                    groupName: draggedItem.name || draggedItem.groupName || `Group ${draggedItem.id}`,
                                    venues: draggedItem.venues || []
                                }
                                
                                const groupUpdateResponse = await api.updateVenueGroup(groupUpdateData)
                                if (!groupUpdateResponse.ok) {
                                    console.error('Failed to update venue group:', groupUpdateResponse)
                                }
                            } catch (groupError) {
                                console.error('Error updating venue group:', groupError)
                            }
                            
                            success(`Group '${draggedItem.name}' added to ${driver.name}'s (Cleaner) route!`)
                            
                            // Refresh venue groups to update userId arrays
                            await refetchVenueGroups()
                            
                            // Refresh routes for both drivers
                            const updatedDriversWithRoutes = await loadExistingRoutesForDrivers(drivers)
                            setDrivers(updatedDriversWithRoutes)
                        } else {
                            throw new Error('Failed to update route with group')
                        }
                    } else {
                        // No existing routes, create new one with group
                        console.log('No existing routes found, creating new route with group')
                        await createRouteForDriver(driver, [], draggedItem)
                    }
                } else {
                    // Fallback: create new route with group
                    console.log('API response not ok, fallback: creating new route with group')
                    await createRouteForDriver(driver, [], draggedItem)
                }
            } catch (err) {
                console.error('Error managing group route:', err)
                // Fallback: create new route with group
                console.log('Error occurred, fallback: creating new route with group')
                await createRouteForDriver(driver, [], draggedItem)
            }
        }

        // Show success message (only if not already shown by route update)
        if (draggedItem.sourceType !== 'venue') {
            if (draggedFromDriver && draggedFromDriver !== driverId) {
                const previousDriver = drivers?.find(d => d.id === draggedFromDriver)
                success(`'${draggedItem.name}' reassigned from ${previousDriver?.name} (Cleaner) to ${driver.name} (Cleaner)`)
            } else if (draggedItem.sourceType === 'group') {
                // Success message for group assignment is handled in the group logic above
                console.log('Group assignment completed, success message should have been shown')
            } else {
                success(`'${draggedItem.name}' assigned to ${driver.name} (Cleaner)`)
            }
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
                // Remove venue from local state first
                const remainingVenues = driver.assignedVenues
                    .filter(v => v.id !== draggedItem.id && v.type === 'venue')
                    .map((v, index) => ({ ...v, priority: index + 1 })) // Reindex priorities
                    .sort((a, b) => (a.priority || 0) - (b.priority || 0))

                setDrivers(prev =>
                    prev.map(d =>
                        d.id === draggedFromDriver
                            ? {
                                ...d,
                                assignedVenues: remainingVenues
                            }
                            : d
                    )
                )

                // Update or delete the route in the backend
                try {
                    const userId = driver.userId || driver.id
                    const response = await api.getCleanerRoutes({ userId, fetchAll: true })
                    if (response.ok) {
                        const data = await response.json()
                        const routes = data.cleanerRoutes || data.routes || data.data || []

                        if (routes.length > 0) {
                            const route = routes[0] // Get the main route
                            const routeId = route.cleanerRouteId || route.routeId

                            // Always UPDATE, never DELETE - this avoids edge cases
                            const venuesData = remainingVenues.length > 0 
                                ? remainingVenues.map((venue, index) => ({
                                    userId: [driver.userId || driver.id], // Each venue needs userId as array (using userId value)
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
                                : [] // Send empty array if no venues left

                            const updateResponse = await api.updateCleanerRoute({
                                    userId: driver.userId || driver.id, // Top-level userId as string (using userId value)
                            vlUserId: driver.vlUserId || driver.userId || driver.id, // Top-level vlUserId as string (using vlUserId value)
                                    cleanerRouteId: routeId,
                                    routeName: route.routeName || `Route-${driver.firstName || driver.name}`,
                                    venueGroupsInfo: (route.venueGroupsInfo || [])
                                        .filter(g => g.groupId !== draggedItem.id)
                                        .map((g, index) => ({ 
                                            ...g, 
                                            priority: index + 1,
                                            userId: g.userId || [driver.userId || driver.id]
                                        })),
                                    venues: venuesData
                                })

                            if (updateResponse.ok) {
                                // Always update venue groups to remove userId, even if route is now empty
                                if (remainingVenues.length === 0 && route.venueGroupsInfo && route.venueGroupsInfo.length > 0) {
                                    try {
                                        const currentUserId = driver.userId || driver.id || driver.vlUserId
                                        const groupsToUpdate = route.venueGroupsInfo || []
                                        
                                        console.log('=== CLEANER VENUE REMOVAL - UPDATING VENUE GROUPS (EMPTY ROUTE) ===')
                                        console.log('Cleaner being removed:', driver.name, 'userId:', currentUserId)
                                        console.log('Groups in route:', groupsToUpdate)
                                        
                                        // Update each group to remove this cleaner's userId
                                        for (const groupInfo of groupsToUpdate) {
                                            try {
                                                // Find the current group data
                                                const currentGroup = allVenueGroups.find(g => 
                                                    g.id === groupInfo.groupId || 
                                                    g.groupId === groupInfo.groupId
                                                )
                                                
                                                let existingUserIds = []
                                                if (currentGroup) {
                                                    existingUserIds = currentGroup.userId || []
                                                } else {
                                                    // Fallback: try to fetch the group
                                                    console.log('Group not found in allVenueGroups, fetching group:', groupInfo.groupId)
                                                    const groupResponse = await api.getVenueGroupById(groupInfo.groupId)
                                                    if (groupResponse.ok) {
                                                        const groupData = await groupResponse.json()
                                                        existingUserIds = groupData.groups?.userId || []
                                                    }
                                                }
                                                
                                                const updatedUserIds = existingUserIds.filter(id => {
                                                    // Convert both to strings for comparison to handle type mismatches
                                                    const idStr = String(id).trim()
                                                    const currentUserIdStr = String(currentUserId).trim()
                                                    const shouldRemove = idStr === currentUserIdStr
                                                    
                                                    console.log(`  Comparing: "${idStr}" === "${currentUserIdStr}" ? ${shouldRemove}`)
                                                    return !shouldRemove
                                                })
                                                
                                                console.log(`Updating group ${groupInfo.groupId}:`)
                                                console.log('  existingUserIds:', existingUserIds)
                                                console.log('  userId to remove:', currentUserId)
                                                console.log('  updatedUserIds:', updatedUserIds)
                                                
                                                // Only update if there are changes
                                                if (existingUserIds.length !== updatedUserIds.length) {
                                                    const groupUpdateData = {
                                                        userId: updatedUserIds,
                                                        groupId: groupInfo.groupId,
                                                        groupName: currentGroup?.name || currentGroup?.groupName || `Group ${groupInfo.groupId}`,
                                                        venues: currentGroup?.venues || []
                                                    }
                                                    
                                                    const groupUpdateResponse = await api.updateVenueGroup(groupUpdateData)
                                                    console.log('Group update API response:', groupUpdateResponse.status, groupUpdateResponse.ok)
                                                    if (groupUpdateResponse.ok) {
                                                        const responseData = await groupUpdateResponse.json().catch(() => ({}))
                                                        console.log(`Successfully updated group ${groupInfo.groupId}:`, responseData)
                                                    } else {
                                                        const errorData = await groupUpdateResponse.json().catch(() => ({}))
                                                        console.error(`Failed to update group ${groupInfo.groupId}:`, errorData)
                                                    }
                                                }
                                            } catch (groupError) {
                                                console.error(`Error updating group ${groupInfo.groupId}:`, groupError)
                                            }
                                        }
                                        console.log('=== END CLEANER VENUE REMOVAL - VENUE GROUPS UPDATE ===')
                                    } catch (error) {
                                        console.error('Error updating venue groups:', error)
                                    }
                                }
                                
                                if (remainingVenues.length > 0) {
                                    success(`Venue '${draggedItem.name}' removed from ${driver.name}'s (Cleaner) route`)
                                } else {
                                    success(`Last venue removed. Route now empty for ${driver.name} (Cleaner)`)
                                }
                                // Refresh vacant locations to update userId arrays
                                await refetchVacantLocations()
                                // Refresh venue groups to update userId arrays
                                await refetchVenueGroups()
                            } else {
                                throw new Error('Failed to update route')
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error updating route:", err)
                    error(`Failed to remove venue: ${err.message}`)
                }
            }
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
                console.log('🔵 ========== GROUP DRAG REMOVAL START ==========')
                console.log('🔵 Driver:', { name: driver.name, id: driver.id, userId: driver.userId, vlUserId: driver.vlUserId })
                console.log('🔵 Dragged Group:', { id: draggedItem.id, groupId: draggedItem.groupId, name: draggedItem.name })
                console.log('🔵 Current assignedVenues:', driver.assignedVenues)
                
                // Get venue IDs from the group
                const groupVenueIds = (draggedItem.venues || []).map(v => v.id)
                console.log('🔵 Venue IDs in dragged group:', groupVenueIds)

                // Remove the group and its venues from local state
                const remainingVenues = driver.assignedVenues
                    .filter(v => {
                        // Remove the group itself
                        if (v.id === draggedItem.id && v.type === 'group') {
                            console.log('🔵 Filtering out group:', v.name)
                            return false
                        }
                        // Remove individual venues that are part of this group
                        if (v.type === 'venue' && groupVenueIds.includes(v.id)) {
                            console.log('🔵 Filtering out venue from group:', v.name)
                            return false
                        }
                        return true
                    })
                    .filter(v => v.type === 'venue') // Keep only venues for route update
                    .map((v, index) => ({ ...v, priority: index + 1 })) // Reindex priorities
                    .sort((a, b) => (a.priority || 0) - (b.priority || 0))
                
                console.log('🔵 Remaining venues after filtering:', remainingVenues)
                console.log('🔵 Total items remaining:', remainingVenues.length)

                console.log('🔵 Updating local state - removing group and venues')
                setDrivers(prev =>
                    prev.map(d =>
                        d.id === draggedFromDriver
                            ? {
                                ...d,
                                assignedVenues: driver.assignedVenues.filter(v => {
                                    if (v.id === draggedItem.id && v.type === 'group') return false
                                    if (v.type === 'venue' && groupVenueIds.includes(v.id)) return false
                                    return true
                                }).map((v, index) => ({ ...v, priority: v.type === 'venue' ? index + 1 : v.priority }))
                            }
                            : d
                    )
                )

                // Update or delete the route in the backend
                try {
                    const userId = driver.userId || driver.id
                    console.log('🔵 Fetching current route for userId:', userId)
                    const response = await api.getCleanerRoutes({ userId, fetchAll: true })
                    if (response.ok) {
                        const data = await response.json()
                        const routes = data.cleanerRoutes || data.routes || data.data || []

                        if (routes.length > 0) {
                            const route = routes[0] // Get the main route
                            const routeId = route.cleanerRouteId || route.routeId
                            
                            console.log('🔵 Current route from API:', { 
                                routeId, 
                                routeName: route.routeName,
                                currentVenueGroupsInfo: route.venueGroupsInfo,
                                currentVenuesCount: route.venues?.length || 0
                            })

                            // Always UPDATE, never DELETE - this avoids edge cases
                            const venuesData = remainingVenues.length > 0 
                                ? remainingVenues.map((venue, index) => ({
                                    userId: [driver.userId || driver.id], // Each venue needs userId as array (using userId value)
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
                                : [] // Send empty array if no venues left

                            const filteredGroups = (route.venueGroupsInfo || [])
                                .filter(g => g.groupId !== draggedItem.id)
                                .map((g, index) => ({ 
                                    ...g, 
                                    priority: index + 1,
                                    userId: g.userId || [driver.userId || driver.id]
                                }))

                            console.log('🔵 Preparing route update:', {
                                venueGroupsBefore: (route.venueGroupsInfo || []).length,
                                venueGroupsAfter: filteredGroups.length,
                                venuesDataLength: venuesData.length,
                                draggedGroupId: draggedItem.id
                            })

                            const updatePayload = {
                                userId: driver.userId || driver.id,
                                vlUserId: driver.vlUserId || driver.userId || driver.id,
                                cleanerRouteId: routeId,
                                routeName: route.routeName || `Route-${driver.firstName || driver.name}`,
                                venueGroupsInfo: filteredGroups,
                                venues: venuesData
                            }
                            
                            console.log('🔵 Sending route UPDATE payload:', JSON.stringify(updatePayload, null, 2))
                            
                            const updateResponse = await api.updateCleanerRoute(updatePayload)
                            
                            console.log('🔵 Route update response:', {
                                ok: updateResponse.ok,
                                status: updateResponse.status,
                                statusText: updateResponse.statusText
                            })

                            if (updateResponse.ok) {
                                // Always update the venue group to remove the userId
                                try {
                                    console.log('🔵 Route update successful, now updating venue group')
                                    // Get the current group data to ensure we have the latest userId array
                                    console.log('Searching for group with draggedItem.id:', draggedItem.id)
                                    console.log('Searching for group with draggedItem.groupId:', draggedItem.groupId)
                                    console.log('Available groups:', allVenueGroups.map(g => ({ id: g.id, groupId: g.groupId, name: g.name })))
                                    
                                    const currentGroup = allVenueGroups.find(g => 
                                        g.id === draggedItem.id || 
                                        g.groupId === draggedItem.id ||
                                        g.id === draggedItem.groupId ||
                                        g.groupId === draggedItem.groupId
                                    )
                                    
                                    console.log('Found currentGroup:', currentGroup)
                                    
                                    // If group not found in allVenueGroups, try to get it from the draggedItem or fetch it
                                    let existingUserIds = []
                                    if (currentGroup) {
                                        existingUserIds = currentGroup.userId || []
                                    } else {
                                        // Fallback: use draggedItem data or try to fetch the group
                                        existingUserIds = draggedItem.userId || []
                                        console.log('Group not found in allVenueGroups, using draggedItem data:', existingUserIds)
                                    }
                                    
                                    const currentUserId = driver.userId || driver.id || driver.vlUserId
                                    const updatedUserIds = existingUserIds.filter(id => id !== currentUserId)
                                    
                                    console.log('=== VENUE GROUP UNASSIGN DEBUG (CLEANER) ===')
                                    console.log('draggedItem:', draggedItem)
                                    console.log('currentGroup found:', currentGroup)
                                    console.log('allVenueGroups:', allVenueGroups)
                                    console.log('existingUserIds:', existingUserIds)
                                    console.log('currentUserId to remove:', currentUserId)
                                    console.log('updatedUserIds after removal:', updatedUserIds)
                                    console.log('=== END DEBUG ===')
                                    
                                    // Only update if there are changes to make
                                    if (existingUserIds.length !== updatedUserIds.length) {
                                        const groupUpdateData = {
                                            userId: updatedUserIds,
                                            groupId: draggedItem.id || draggedItem.groupId,
                                            groupName: draggedItem.name || draggedItem.groupName || `Group ${draggedItem.id}`,
                                            venues: draggedItem.venues || []
                                        }
                                        
                                        console.log('Sending venue group update with data:', groupUpdateData)
                                        const groupUpdateResponse = await api.updateVenueGroup(groupUpdateData)
                                        console.log('Venue group update response:', groupUpdateResponse)
                                        
                                        if (groupUpdateResponse.ok) {
                                            const responseData = await groupUpdateResponse.json().catch(() => ({}))
                                            console.log('Venue group updated successfully:', responseData)
                                        } else {
                                            console.error('Failed to update venue group:', groupUpdateResponse)
                                            const errorData = await groupUpdateResponse.json().catch(() => ({}))
                                            console.error('Venue group update error details:', errorData)
                                        }
                                    } else {
                                        console.log('No changes needed - userId array is already correct')
                                    }
                                } catch (groupError) {
                                    console.error('Error updating venue group:', groupError)
                                }
                                
                                // Refresh venue groups to update userId arrays AFTER venue group update
                                console.log('Refetching venue groups after unassign...')
                                await refetchVenueGroups()
                                
                                if (remainingVenues.length > 0) {
                                    success(`Group '${draggedItem.name}' removed from ${driver.name}'s (Cleaner) route`)
                                } else {
                                    success(`Last group removed. Route now empty for ${driver.name} (Cleaner)`)
                                }
                                // Refresh vacant locations to update userId arrays
                                console.log('🔵 Refreshing vacant locations and venue groups...')
                                await refetchVacantLocations()
                                await refetchVenueGroups()
                                
                                console.log('🔵 ========== GROUP DRAG REMOVAL COMPLETE ==========')
                            } else {
                                console.error('🔴 Route update FAILED')
                                throw new Error('Failed to update route')
                            }
                        } else {
                            console.warn('🔴 No routes found for driver')
                        }
                    } else {
                        console.error('🔴 Failed to fetch routes')
                    }
                } catch (err) {
                    console.error("🔴 ========== GROUP DRAG REMOVAL ERROR ==========")
                    console.error("Error updating route:", err)
                    error(`Failed to remove group: ${err.message}`)
                }
            }
        }

        setDraggedItem(null)
        setDraggedFromDriver(null)
    }

    // Handle reordering venues within the same driver
    const handleReorderVenues = async (driverId, fromIndex, toIndex) => {
        if (fromIndex === toIndex) return

        const driver = drivers.find(d => d.id === driverId)
        if (!driver) return

        // Separate venues and groups from assignedVenues for unified priority handling
        const venues = driver.assignedVenues.filter(item => item.type === 'venue')
        const groups = driver.assignedVenues.filter(item => item.type === 'group').map(g => ({
            groupId: g.id,
            priority: g.priority,
            userId: Array.isArray(g.userId) ? g.userId : [driver.userId || driver.id] // Ensure userId is always an array
        }))

        // Use unified priority reordering
        const { updatedVenues, updatedGroups } = reorderItemsWithUnifiedPriority(venues, groups, fromIndex, toIndex)

        // Combine back into assignedVenues format for local state
        const allItems = [
            ...updatedVenues.map(v => ({ ...v, type: 'venue' })),
            ...updatedGroups.map(g => ({ ...g, type: 'group', id: g.groupId }))
        ].sort((a, b) => (a.priority || 0) - (b.priority || 0))

        // Update local state immediately for better UX
        setDrivers(prev =>
            prev.map(d =>
                d.id === driverId
                    ? { ...d, assignedVenues: allItems }
                    : d
            )
        )

        // Update the route via API
        try {
            const userId = driver.userId || driver.id

            // Transform venues to API format
            const venuesData = updatedVenues.map((venue) => ({
                    userId: [userId], // Each venue needs userId as array
                    id: parseInt(venue.id),
                    priority: venue.priority,
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

            // Get the first route ID (we'll update the main route)
            const response = await api.getCleanerRoutes({ userId, fetchAll: true })
            if (response.ok) {
                const data = await response.json()
                const routes = data.cleanerRoutes || data.routes || data.data || []

                if (routes.length > 0) {
                    // Update the first route with new priorities
                    const cleanerRouteId = routes[0].cleanerRouteId || routes[0].routeId
                    const routeName = routes[0].routeName || `Route-${driver.firstName || driver.name}`

                    const updateResponse = await api.updateCleanerRoute({
                            vlUserId: userId, // Top-level vlUserId as string
                            cleanerRouteId: cleanerRouteId,
                            routeName: routeName,
                            venues: venuesData,
                            venueGroupsInfo: updatedGroups // Use updated groups with correct priorities
                        })

                    if (updateResponse.ok) {
                        success(`Item priorities updated for ${driver.name} (Cleaner)!`)
                        // Refetch routes to ensure UI is in sync with backend
                        const updatedDriversWithRoutes = await loadExistingRoutesForDrivers(drivers)
                        setDrivers(updatedDriversWithRoutes)
                    } else {
                        throw new Error('Failed to update route priorities')
                    }
                }
            }
        } catch (err) {
            console.error('Error updating item priorities:', err)
            error(`Failed to update priorities: ${err.message}`)

            // Revert the local state on error
            await loadExistingRoutesForDrivers(drivers)
        }
    }

    // Handle drag over specific venue for reordering
    const handleVenueDragOver = (e, index, driverId) => {
        e.preventDefault()
        e.stopPropagation()

        // Only show reorder indicator if dragging within the same driver
        if (draggedFromDriver === driverId && draggedItem) {
            setDragOverIndex({ driverId, index })
        }
    }

    // Handle drop on specific venue for reordering
    const handleVenueDrop = async (e, targetIndex, driverId) => {
        e.preventDefault()
        e.stopPropagation()

        // If dragging from the same driver (reordering)
        if (draggedItem && draggedFromDriver === driverId) {
            const driver = drivers.find(d => d.id === driverId)
            if (!driver) return

            const fromIndex = driver.assignedVenues.findIndex(v => v.id === draggedItem.id)
            if (fromIndex === -1) return

            await handleReorderVenues(driverId, fromIndex, targetIndex)

            setDraggedItem(null)
            setDraggedFromDriver(null)
            setDragOverIndex(null)
        }
        // If dragging from outside (new venue or from another driver)
        else if (draggedItem && !draggedFromDriver) {
            // This will be handled by handleDropOnDriver with position awareness
            await handleDropOnDriver(e, driverId, targetIndex)
        }
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
            <div className="flex items-center justify-center h-screen w-full bg-gray-100">
                <Loader />
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
                                    <p className="text-sm">No venues available</p>
                                </div>
                            ) : (
                                availableVenues.map((venue) => (
                                    <div
                                        key={venue.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, venue, 'venue')}
                                        onDragEnd={handleDragEnd}
                                        className={`p-3 rounded-lg border-2 cursor-move hover:shadow-md transition-all duration-200 ${getVenueTypeColor(venue)}`}
                                    >
                                        <div className="text-sm font-medium">
                                        {`${venue?.name ?? ''} - (${venue?.machine?.name?.split('-').pop() ?? ''})`}

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
                                    <p className="text-sm">No groups available</p>
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
                                                className={`p-3 cursor-move transition-colors flex items-center justify-between ${getGroupTypeColor(group)}`}
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
                                                            {`${venue?.name ?? ''} - (${venue?.machine?.name?.split('-').pop() ?? ''})` || venue.venueName}

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

                {/* Right Section - Cleaners */}
                <div className="xl:col-span-3">
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-6">
                        <div className="flex items-center gap-2 py-4">
                            <div><Truck className="h-8 w-8 text-blue-600" /></div>
                            <div><h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                CLEANERS ASSIGNMENT
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
                                        <p className="text-slate-500 text-lg font-medium">No cleaners available</p>
                                        <p className="text-slate-400 text-sm mt-2">Cleaners will appear here once loaded</p>
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
                                        {/* Cleaner Header */}
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
                                                driver.assignedVenues
                                                    .slice() // Create a copy to avoid mutating state
                                                    .sort((a, b) => (a.priority || 0) - (b.priority || 0)) // Sort by priority
                                                    .map((item, index) => (
                                                        <div key={`${item.type}-${item.id}`}>
                                                            {/* Drop indicator above */}
                                                            {dragOverIndex?.driverId === driver.id && dragOverIndex?.index === index && (
                                                                <div className="h-1 bg-blue-500 rounded-full mb-2 animate-pulse"></div>
                                                            )}

                                                            {item.type === 'group' ? (
                                                                // Group display with chevron
                                                                <div className="border-2 border-purple-200 rounded-lg overflow-hidden">
                                                                    <div
                                                                        draggable
                                                                        onDragStart={(e) => handleDragStart(e, item, item.type, driver.id)}
                                                                        onDragEnd={handleDragEnd}
                                                                        onDragOver={(e) => handleVenueDragOver(e, index, driver.id)}
                                                                        onDrop={(e) => handleVenueDrop(e, index, driver.id)}
                                                                        className="p-3 bg-purple-50 cursor-move hover:bg-purple-100 transition-colors"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            toggleCleanerGroup(item.id, driver.id)
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            {/* Priority Number */}
                                                                            <div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-purple-600 border border-purple-300">
                                                                                {index + 1}
                                                                            </div>

                                                                            <div className="text-sm font-medium text-slate-800 flex items-center gap-2 flex-1">
                                                                                <Users className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                                                                <span className="truncate">{item?.name || item?.groupName || `Group ${item.id}`}</span>
                                                                            </div>

                                                                            {/* Chevron */}
                                                                            {expandedGroups[`${driver.id}-${item.id}`] ? (
                                                                                <ChevronDown className="h-4 w-4 text-purple-600" />
                                                                            ) : (
                                                                                <ChevronRight className="h-4 w-4 text-purple-600" />
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Expanded group venues */}
                                                                    {expandedGroups[`${driver.id}-${item.id}`] && (
                                                                        <div className="p-3 space-y-2 bg-white border-t border-purple-200">
                                                                            {item.venues && item.venues.length > 0 ? (
                                                                                item.venues
                                                                                    .slice()
                                                                                    .sort((a, b) => (a.priority || 0) - (b.priority || 0))
                                                                                    .map((venue, venueIndex) => (
                                                                                        <div
                                                                                            key={venue.id || venueIndex}
                                                                                            className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg"
                                                                                        >
                                                                                            {/* Venue Priority Number */}
                                                                                            <div className="flex-shrink-0 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-300">
                                                                                                {venue.priority || venueIndex + 1}
                                                                                            </div>
                                                                                            <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                                                            <span className="text-sm text-gray-700 truncate">{venue.name || venue.locationName}</span>
                                                                                        </div>
                                                                                    ))
                                                                            ) : (
                                                                                <div className="text-center py-2 text-gray-500 text-sm">
                                                                                    No venues in this group
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                // Individual venue display
                                                                <div
                                                                    draggable
                                                                    onDragStart={(e) => handleDragStart(e, item, item.type, driver.id)}
                                                                    onDragEnd={handleDragEnd}
                                                                    onDragOver={(e) => handleVenueDragOver(e, index, driver.id)}
                                                                    onDrop={(e) => handleVenueDrop(e, index, driver.id)}
                                                                    className="p-3 rounded-lg border-2 cursor-move transition-all duration-200 shadow-sm hover:shadow-md bg-blue-50 border-blue-200 hover:border-blue-300"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        {/* Priority Number */}
                                                                        <div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-300">
                                                                            {index + 1}
                                                                        </div>

                                                                        <div className="text-sm font-medium text-slate-800 flex items-center gap-2 flex-1">
                                                                            <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                                                            <span className="truncate">{`${item?.name ?? ''} - (${item?.machine?.name?.split('-').pop() ?? ''})`}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Drop indicator below (for last item) */}
                                                            {dragOverIndex?.driverId === driver.id && dragOverIndex?.index === index + 1 && index === driver.assignedVenues.length - 1 && (
                                                                <div className="h-1 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
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
                            <div className="p-6 border-b ">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        {editingGroup ? `Edit Venue Group: ${editingGroup.name}` : 'Manage Venue Group'}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowCreateModal(false)
                                            setGroupName("")
                                            setSelectedVenues([])
                                            setEditingGroup(null)
                                        }}
                                        className="p-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col flex-1 overflow-hidden">
                                {/* Editing Mode Banner */}
                                {editingGroup && (
                                    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm">
                                                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                <span className="text-blue-800 font-medium">
                                                    You are editing: <strong>{editingGroup.name}</strong> - Add or remove venues below
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setEditingGroup(null)
                                                    setSelectedVenues([])
                                                }}
                                                className="px-3 py-1 text-xs bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors font-medium"
                                            >
                                                Exit Edit Mode
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Top Section - Create New Group */}
                                <div className="flex border-b  " style={{ height: editingGroup ? '37%' : '40%' }}>
                                    {/* Left Side - Available Venues */}
                                    <div className="w-1/2 p-4 border-r  overflow-y-auto "
                                        onDragOver={handleModalDragOver}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            if (!draggedItem) return
                                            // Remove from selected venues when dragged back to available list
                                            setSelectedVenues(prev => prev.filter(v => v.id !== draggedItem.id))
                                            setDraggedItem(null)
                                        }}
                                    >
                                        {/* <div className="border border-1 p-2 rounded-md"> */}
                                        <div className="mb-3">
                                            <h3 className="text-base font-semibold text-gray-800 mb-1">Available Venues</h3>
                                            <p className="text-xs text-gray-600">Drag venues to the right to {editingGroup ? 'update' : 'create'} your group</p>
                                        </div>

                                        <div className="space-y-2">
                                            {allVenues.filter(venue => !selectedVenues.find(sv => sv.id === venue.id)).map((venue) => (
                                                <div
                                                    key={venue.id}
                                                    draggable
                                                    onDragStart={(e) => handleModalDragStart(e, venue)}
                                                    onDragEnd={handleModalDragEnd}
                                                    className={`p-2 rounded-lg border-2 cursor-move hover:shadow-md transition-all duration-200 ${getVenueTypeColor(venue)}`}
                                                >
                                                    <div className="text-sm font-medium">
                                                        {venue.name}
                                                    </div>
                                                    {venue.locationName && venue.locationName !== venue.name && (
                                                        <div className="text-xs mt-1">
                                                            {venue.locationName}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {/* </div> */}
                                    </div>

                                    {/* Right Side - Group Creation */}
                                    <div className="w-1/2 p-4 overflow-y-auto">
                                        {/* <div className="border border-1 p-2 rounded-md"> */}

                                        <div className="mb-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-semibold text-gray-800">Selected Venues ({selectedVenues.length})</h3>
                                                    {editingGroup && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                            Editing Mode
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {/* {editingGroup && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingGroup(null)
                                                                setSelectedVenues([])
                                                            }}
                                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            Exit Edit Mode
                                                        </button>
                                                    )} */}
                                                    {selectedVenues.length > 0 && (
                                                        <button
                                                            onClick={clearSelectedVenues}
                                                            className="text-xs text-red-600 hover:text-red-800"
                                                        >
                                                            Clear All
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-2">Drop venues here or drag them back to remove</p>
                                        </div>

                                        {/* Group Name Input */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Group Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={groupName}
                                                onChange={(e) => setGroupName(e.target.value)}
                                                placeholder="Enter group name (e.g., Downtown Venues, Campus Locations)"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                required
                                            />
                                            {!groupName.trim() && (
                                                <p className="text-xs text-red-600 mt-1">Group name is required</p>
                                            )}
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
                                                selectedVenues.map((venue, index) => (
                                                    <div key={venue.id}>
                                                        {/* Drop indicator above */}
                                                        {modalDragOverIndex === index && (
                                                            <div className="h-1 bg-blue-500 rounded-full mb-2 animate-pulse"></div>
                                                        )}
                                                        
                                                        <div
                                                            draggable
                                                            onDragStart={(e) => handleModalDragStart(e, venue)}
                                                            onDragEnd={handleModalDragEnd}
                                                            onDragOver={(e) => handleModalVenueDragOver(e, index)}
                                                            onDrop={(e) => handleModalVenueDrop(e, index)}
                                                            className="p-2 rounded-lg border-2 border-blue-200 bg-blue-50 cursor-move hover:border-blue-400 transition-all duration-200 flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {/* Priority Number */}
                                                                <div className="flex-shrink-0 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-300">
                                                                    {index + 1}
                                                                </div>
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
                                                            </div>
                                                            <button
                                                                onClick={() => removeVenueFromGroup(venue.id)}
                                                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>

                                                        {/* Drop indicator below (for last item) */}
                                                        {modalDragOverIndex === index + 1 && index === selectedVenues.length - 1 && (
                                                            <div className="h-1 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="mt-4 flex gap-3">
                                            <button
                                                onClick={handleCreateVenueGroup}
                                                disabled={selectedVenues.length === 0 || !groupName.trim() || isCreating}
                                                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${selectedVenues.length === 0 || !groupName.trim() || isCreating
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'}`}
                                            >
                                                {isCreating ? (editingGroup ? 'Updating...' : 'Creating...') : (editingGroup ? 'Update Group' : 'Create Group')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowCreateModal(false)
                                                    setGroupName("")
                                                    setSelectedVenues([])
                                                    setEditingGroup(null)
                                                }}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                        {/* </div> */}
                                    </div>
                                </div>

                                {/* Bottom Section - Existing Groups Table */}

                                <div className="flex-1 p-6 overflow-y-auto ">
                                    <div className="border border-1 p-2 rounded-md">
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
                                                                        onClick={() => handleEditVenueGroup(group)}
                                                                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteVenueGroup(group)}
                                                                        disabled={isDeleting === group.id}
                                                                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${isDeleting === group.id
                                                                            ? 'bg-gray-400 text-white cursor-not-allowed'
                                                                            : 'bg-red-600 text-white hover:bg-red-700'
                                                                            }`}
                                                                    >
                                                                        {isDeleting === group.id ? 'Deleting...' : 'Delete'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-4 bg-white">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                {group.venues && group.venues.length > 0 ? (
                                                                    group.venues
                                                                        .slice() // Create a copy to avoid mutating state
                                                                        .sort((a, b) => (a.priority || 0) - (b.priority || 0)) // Sort by priority
                                                                        .map((venue, idx) => (
                                                                            <div
                                                                                key={venue.id || idx}
                                                                                className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg"
                                                                            >
                                                                                {/* Priority Number */}
                                                                                <div className="flex-shrink-0 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-300">
                                                                                    {venue.priority || idx + 1}
                                                                                </div>
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
                    </div>
                )}
            </div></>
    )
}


