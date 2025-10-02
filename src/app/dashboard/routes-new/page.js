"use client"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronRight, Users, MapPin, Truck, Navigation, MapPinCheckIcon } from "lucide-react"

export default function RoutesNewPage() {
    // Static data for demonstration
    const [allVenues] = useState([
        { id: 1, name: "GPO St. Martins Bonn Coffee (008)" },
        { id: 2, name: "GPO St. Martins Bonn Coffee (009)" },
        { id: 3, name: "GPO St. Martins Bonn Coffee (010)" },
        { id: 4, name: "GPO St. Martins Bonn Coffee (011)" },
        { id: 5, name: "GPO St. Martins Bonn Coffee (012)" },
        { id: 6, name: "GPO St. Martins Bonn Coffee (013)" },
        { id: 7, name: "GPO St. Martins Bonn Coffee (014)" },
        { id: 8, name: "GPO St. Martins Bonn Coffee (015)" },
        { id: 9, name: "GPO St. Martins Bonn Coffee (016)" },
        { id: 10, name: "GPO St. Martins Bonn Coffee (017)" },
        { id: 11, name: "Central Station Cafe (001)" },
        { id: 12, name: "Central Station Cafe (002)" },
        { id: 13, name: "University Library (003)" },
        { id: 14, name: "University Library (004)" },
        { id: 15, name: "Shopping Mall East (005)" }
    ])

    const [allVenueGroups] = useState([
        {
            id: 1,
            name: "Group 1",
            isExpanded: false,
            venues: [
                { id: 101, name: "Venue 1" },
                { id: 102, name: "Venue 2" },
                { id: 103, name: "Venue 3" }
            ]
        },
        {
            id: 2,
            name: "Coffee Shops North",
            isExpanded: false,
            venues: [
                { id: 201, name: "North Coffee A" },
                { id: 202, name: "North Coffee B" },
                { id: 203, name: "North Coffee C" },
                { id: 204, name: "North Coffee D" }
            ]
        },
        {
            id: 3,
            name: "University Campus",
            isExpanded: false,
            venues: [
                { id: 301, name: "Library Main" },
                { id: 302, name: "Library East" },
                { id: 303, name: "Student Center" },
                { id: 304, name: "Science Building" },
                { id: 305, name: "Arts Building" }
            ]
        },
        {
            id: 4,
            name: "Shopping Centers",
            isExpanded: false,
            venues: [
                { id: 401, name: "Mall Central" },
                { id: 402, name: "Mall East" },
                { id: 403, name: "Mall West" }
            ]
        },
        {
            id: 5,
            name: "Business District",
            isExpanded: false,
            venues: [
                { id: 501, name: "Office Tower A" },
                { id: 502, name: "Office Tower B" },
                { id: 503, name: "Corporate Center" },
                { id: 504, name: "Business Plaza" }
            ]
        },
        {
            id: 6,
            name: "Transportation Hubs",
            isExpanded: false,
            venues: [
                { id: 601, name: "Central Station" },
                { id: 602, name: "Airport Terminal" },
                { id: 603, name: "Bus Station" }
            ]
        }
    ])

    const [venueGroups, setVenueGroups] = useState([
        {
            id: 1,
            name: "Group 1",
            isExpanded: false,
            venues: [
                { id: 101, name: "Venue 1" },
                { id: 102, name: "Venue 2" },
                { id: 103, name: "Venue 3" }
            ]
        },
        {
            id: 2,
            name: "Coffee Shops North",
            isExpanded: false,
            venues: [
                { id: 201, name: "North Coffee A" },
                { id: 202, name: "North Coffee B" },
                { id: 203, name: "North Coffee C" },
                { id: 204, name: "North Coffee D" }
            ]
        },
        {
            id: 3,
            name: "University Campus",
            isExpanded: false,
            venues: [
                { id: 301, name: "Library Main" },
                { id: 302, name: "Library East" },
                { id: 303, name: "Student Center" },
                { id: 304, name: "Science Building" },
                { id: 305, name: "Arts Building" }
            ]
        },
        {
            id: 4,
            name: "Shopping Centers",
            isExpanded: false,
            venues: [
                { id: 401, name: "Mall Central" },
                { id: 402, name: "Mall East" },
                { id: 403, name: "Mall West" }
            ]
        },
        {
            id: 5,
            name: "Business District",
            isExpanded: false,
            venues: [
                { id: 501, name: "Office Tower A" },
                { id: 502, name: "Office Tower B" },
                { id: 503, name: "Corporate Center" },
                { id: 504, name: "Business Plaza" }
            ]
        },
        {
            id: 6,
            name: "Transportation Hubs",
            isExpanded: false,
            venues: [
                { id: 601, name: "Central Station" },
                { id: 602, name: "Airport Terminal" },
                { id: 603, name: "Bus Station" }
            ]
        }
    ])

    const [drivers, setDrivers] = useState([
        {
            id: 1,
            name: "Driver 1",
            assignedVenues: []
        },
        {
            id: 2,
            name: "Driver 2",
            assignedVenues: [
            
            ]
        },
        {
            id: 3,
            name: "Driver 3",
            assignedVenues: []
        },
        {
            id: 4,
            name: "Driver 4",
            assignedVenues: []
        },
        {
            id: 5,
            name: "Driver 5",
            assignedVenues: []
        },
        {
            id: 6,
            name: "Driver 6",
            assignedVenues: []
        },
        {
            id: 7,
            name: "Driver 7",
            assignedVenues: []
        },
        {
            id: 8,
            name: "Driver 8",
            assignedVenues: []
        }
    ])

    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState(null)
    const [draggedFromDriver, setDraggedFromDriver] = useState(null)
    const dragCounter = useRef(0)

    // Scroll state and refs
    const driversScrollRef = useRef(null)
    const autoScrollInterval = useRef(null)

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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAutoScroll()
            document.removeEventListener('mousemove', handleMouseMove)
        }
    }, [])

    const availableVenues = getAvailableVenues()
    const availableGroups = getAvailableGroups()

    return (
        <div className="p-8 space-y-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <Navigation className="h-10 w-10 text-blue-600" />
                    <span className="text-gray-800">Route Assignment Manager</span>
                </h1>
                <p className="text-gray-600">Assign venues and groups to drivers using drag and drop</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 min-h-[600px]">
                {/* Left Section - Venue Lists */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Venue List */}
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-6">

                        <div className="flex items-center gap-2 py-4">
                            <div><MapPin className="h-8 w-8 text-blue-600" /></div>
                            <div><h3 className="text-lg font-semibold text-slate-800  flex items-center gap-2">
                                VENUES LIST
                            </h3></div> </div>
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
                            <div><h3 className="text-lg font-semibold text-slate-800  flex items-center gap-2">
                                VENUES GROUP
                            </h3></div> </div>
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
                                                    {group.venues.map((venue) => (
                                                        <div
                                                            key={venue.id}
                                                            className="p-2 text-sm text-slate-600 bg-slate-50 rounded border border-slate-200"
                                                        >
                                                            {venue.name}
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
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-6 ">
                        <div className="flex items-center gap-2 py-4">
                            <div><Truck className="h-8 w-8 text-blue-600" /></div>
                            <div><h3 className="text-lg font-semibold text-slate-800  flex items-center gap-2">
                                DRIVERS ASSIGNMENT
                            </h3></div> </div>

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

            
        </div>
    )
}