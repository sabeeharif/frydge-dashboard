"use client"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronRight, Users, MapPin, Truck, Navigation, MapPinCheckIcon, X, Plus } from "lucide-react"

export default function RoutesNewPage() {
    // State for API data
    const [allVenues, setAllVenues] = useState([])
    const [allVenueGroups, setAllVenueGroups] = useState([])
    const [drivers, setDrivers] = useState([])
    const [venueGroups, setVenueGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedVenues, setSelectedVenues] = useState([])
    const [groupName, setGroupName] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState(null)
    const [draggedFromDriver, setDraggedFromDriver] = useState(null)
    const dragCounter = useRef(0)

    // Scroll state and refs
    const driversScrollRef = useRef(null)
    const autoScrollInterval = useRef(null)

    // Fetch all data on component mount
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true)
                setError(null)

                // Fetch all data in parallel
                const [venuesResponse, venueGroupsResponse, driversResponse] = await Promise.all([
                    fetch('/api/vacant-locations'),
                    fetch('/api/venue-group?limit=100'), // Fetch all venue groups
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
                setDrivers(transformedDrivers.map((driver, index) => ({
                    id: driver.id || driver.driverId || index + 1,
                    name: `${driver.firstName || driver.first_name || 'Driver'} ${driver.lastName || driver.last_name || (index + 1)}`,
                    firstName: driver.firstName || driver.first_name || 'Driver',
                    lastName: driver.lastName || driver.last_name || (index + 1),
                    assignedVenues: [],
                    ...driver
                })))

            } catch (err) {
                console.error('Error fetching data:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchAllData()
    }, [])

    // Get available venues (not assigned to any driver)
    const getAvailableVenues = () => {
        const assignedVenueIds = drivers.flatMap(driver =>
            driver.assignedVenues
                .filter(item => item.type === 'venue')
                .map(item => item.id)
        )
        return allVenues.filter(venue => !assignedVenueIds.includes(venue.id))
    }

    // Get available groups (not assigned to any driver)
    const getAvailableGroups = () => {
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

    // Drop handlers
    const handleDropOnDriver = (e, driverId) => {
        e.preventDefault()
        if (!draggedItem) return

        // Remove from previous driver if dragged from another driver
        if (draggedFromDriver && draggedFromDriver !== driverId) {
            setDrivers(prev =>
                prev.map(driver =>
                    driver.id === draggedFromDriver
                        ? {
                            ...driver,
                            assignedVenues: driver.assignedVenues.filter(v => v.id !== draggedItem.id)
                        }
                        : driver
                )
            )
        }

        // Add to new driver (avoid duplicates)
        setDrivers(prev =>
            prev.map(driver =>
                driver.id === driverId
                    ? {
                        ...driver,
                        assignedVenues: [
                            ...driver.assignedVenues.filter(v => v.id !== draggedItem.id),
                            {
                                id: draggedItem.id,
                                name: draggedItem.name,
                                type: draggedItem.sourceType === 'group' ? 'group' : 'venue'
                            }
                        ]
                    }
                    : driver
            )
        )

        setDraggedItem(null)
        setDraggedFromDriver(null)
    }

    const handleDropOnVenueList = (e) => {
        e.preventDefault()
        if (!draggedItem || draggedItem.sourceType !== 'venue') return

        // Remove from driver if dragged from driver
        if (draggedFromDriver) {
            setDrivers(prev =>
                prev.map(driver =>
                    driver.id === draggedFromDriver
                        ? {
                            ...driver,
                            assignedVenues: driver.assignedVenues.filter(v => v.id !== draggedItem.id)
                        }
                        : driver
                )
            )
        }

        setDraggedItem(null)
        setDraggedFromDriver(null)
    }

    const handleDropOnGroupList = (e) => {
        e.preventDefault()
        if (!draggedItem || draggedItem.sourceType !== 'group') return

        // Remove from driver if dragged from driver
        if (draggedFromDriver) {
            setDrivers(prev =>
                prev.map(driver =>
                    driver.id === draggedFromDriver
                        ? {
                            ...driver,
                            assignedVenues: driver.assignedVenues.filter(v => v.id !== draggedItem.id)
                        }
                        : driver
                )
            )
        }

        setDraggedItem(null)
        setDraggedFromDriver(null)
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
        if (!groupName.trim()) {
            alert("Please enter a group name")
            return
        }

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
            const venueGroupsResponse = await fetch('/api/venue-group?limit=100')
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
    if (error) {
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
                        <p className="text-gray-600 mt-2">{error}</p>
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
        <div className="p-8 space-y-8">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                            <Navigation className="h-10 w-10 text-blue-600" />
                            <span className="text-gray-800">Route Assignment Manager</span>
                        </h1>
                        <p className="text-gray-600">Assign venues and groups to drivers using drag and drop</p>
                        <div className="mt-2 text-sm text-gray-500">
                            <span className="mr-4">Venues: {allVenues.length}</span>
                            <span className="mr-4">Groups: {allVenueGroups.length}</span>
                            <span>Drivers: {drivers.length}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="font-semibold">Create Venue Group</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 min-h-[600px]">
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
                            {drivers.map((driver) => (
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
                                                        : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                                                        }`}
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
                            ))}
                        </div>

                        {/* Scroll Indicator */}
                        <div className="text-center text-sm text-slate-500 mt-2">
                            <span>← Scroll horizontally to see all drivers →</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Venue Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-gray-800">Create New Venue Group</h3>
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

                        <div className="flex h-[70vh]">
                            {/* Left Side - Available Venues */}
                            <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Available Venues</h3>
                                    <p className="text-sm text-gray-600">Drag venues from here to the right to create your group</p>
                                </div>

                                <div className="space-y-3">
                                    {allVenues.map((venue) => (
                                        <div
                                            key={venue.id}
                                            draggable
                                            onDragStart={(e) => handleModalDragStart(e, venue)}
                                            onDragEnd={handleModalDragEnd}
                                            className="p-3 rounded-lg border-2 border-slate-200 cursor-move hover:border-slate-400 hover:shadow-md transition-all duration-200 bg-slate-50"
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
                            <div className="w-1/2 p-6 overflow-y-auto">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Group Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        placeholder="Enter group name..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-semibold text-gray-800">Selected Venues ({selectedVenues.length})</h3>
                                        {selectedVenues.length > 0 && (
                                            <button
                                                onClick={clearSelectedVenues}
                                                className="text-sm text-red-600 hover:text-red-800"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">Drop venues here or drag them back to remove</p>
                                </div>

                                <div
                                    className="min-h-[300px] border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3"
                                    onDragOver={handleModalDragOver}
                                    onDrop={handleModalDrop}
                                >
                                    {selectedVenues.length === 0 ? (
                                        <div className="text-center text-gray-500 py-12">
                                            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">Drop venues here to add them to the group</p>
                                        </div>
                                    ) : (
                                        selectedVenues.map((venue) => (
                                            <div
                                                key={venue.id}
                                                draggable
                                                onDragStart={(e) => handleModalDragStart(e, venue)}
                                                onDragEnd={handleModalDragEnd}
                                                className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50 cursor-move hover:border-blue-400 transition-all duration-200 flex items-center justify-between"
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

                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={handleCreateVenueGroup}
                                        disabled={!groupName.trim() || selectedVenues.length === 0 || isCreating}
                                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                                            !groupName.trim() || selectedVenues.length === 0 || isCreating
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                                        }`}
                                    >
                                        {isCreating ? 'Creating...' : 'Create Venue Group'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCreateModal(false)
                                            setGroupName("")
                                            setSelectedVenues([])
                                        }}
                                        className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}