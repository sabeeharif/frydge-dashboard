"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MapPin, Users, Pencil, Trash2, Plus, Search, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/app/contexts/ToastContext"
import { api } from "@/app/lib/auth"
import Loader from "@/app/components/Loader"
import { normalizeSearchValue, venueMatchesSearchTerm } from "@/app/utils/venueSearch"

const MAX_GROUPS_FETCH = 100

const buildVenueKey = (venue) => {
    const explicitId =
        venue.id ||
        venue.venueId ||
        venue.locationId ||
        venue.machineId ||
        venue.machine?.id ||
        venue.machine?.machineId ||
        venue.account?.id

    if (explicitId) {
        return `id:${explicitId}`
    }

    const nameToken = normalizeSearchValue(
        venue.name || venue.venueName || venue.locationName || venue.displayName
    )
    const addressToken = normalizeSearchValue(venue.address)
    const machineToken = normalizeSearchValue(venue.machine?.name)

    return `fallback:${nameToken}|${addressToken}|${machineToken}`
}

const transformVenues = (venues = []) => {
    const seen = new Set()
    const result = []

    venues.forEach((venue, index) => {
        const key = buildVenueKey(venue)
        if (seen.has(key)) {
            return
        }
        seen.add(key)

        result.push({
            id: venue.id || venue.venueId || venue.locationId || `venue-${index}`,
            name: venue.name || venue.venueName || venue.locationName || `Venue ${result.length + 1}`,
            locationName: venue.locationName || venue.name || "",
            address: venue.address,
            latitude: venue.latitude,
            longitude: venue.longitude,
            machine: venue.machine,
            account: venue.account,
            venue: venue.venue,
            priority: venue.priority || result.length + 1,
            raw: venue,
        })
    })

    return result
}

const transformGroups = (groups = []) => {
    return groups.map((group, index) => ({
        id: group.id || group.groupId || `group-${index}`,
        groupId: group.groupId || group.id,
        name: group.name || group.groupName || `Group ${index + 1}`,
        venues: transformVenues(group.venues || group.venueList || []),
        used: group.used,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        raw: group,
    }))
}

const fetchVenuesForContext = async (context) => {
    if (context === "cleaner") {
        return api.getCleanerVacantLocations()
    }
    return api.getVacantLocations()
}

const contextCopy = {
    cleaner: {
        title: "Cleaner Venue Groups",
        subtitle: "Organize cleaner routes by grouping venues with drag and drop",
    },
    driver: {
        title: "Driver Venue Groups",
        subtitle: "Create and manage venue groups for driver routes",
    },
}

export default function VenueGroupManager({ context = "driver" }) {
    const copy = contextCopy[context] || contextCopy.driver
    const { success, error } = useToast()
    const router = useRouter()
    const searchParams = useSearchParams()

    const [loading, setLoading] = useState(true)
    const [errorState, setErrorState] = useState(null)
    const [allVenues, setAllVenues] = useState([])
    const [allVenueGroups, setAllVenueGroups] = useState([])

    const [showModal, setShowModal] = useState(false)
    const [selectedVenues, setSelectedVenues] = useState([])
    const [groupName, setGroupName] = useState("")
    const [editingGroup, setEditingGroup] = useState(null)
    const [isSavingGroup, setIsSavingGroup] = useState(false)
    const [isDeletingGroup, setIsDeletingGroup] = useState(null)

    const [draggedItem, setDraggedItem] = useState(null)
    const [modalDragOverIndex, setModalDragOverIndex] = useState(null)

    const [availableSearchTerm, setAvailableSearchTerm] = useState("")
    const [selectedSearchTerm, setSelectedSearchTerm] = useState("")
    const [groupSearchTerm, setGroupSearchTerm] = useState("")

    const modalRef = useRef(null)
    const queryHandledRef = useRef(false)

    const normalizedAvailableSearch = useMemo(
        () => normalizeSearchValue(availableSearchTerm),
        [availableSearchTerm]
    )

    const normalizedSelectedSearch = useMemo(
        () => normalizeSearchValue(selectedSearchTerm),
        [selectedSearchTerm]
    )

    const normalizedGroupSearch = useMemo(
        () => normalizeSearchValue(groupSearchTerm),
        [groupSearchTerm]
    )

    const filteredAvailableVenues = useMemo(() => {
        return allVenues
            .filter((venue) => !selectedVenues.find((sv) => sv.id === venue.id))
            .filter((venue) => venueMatchesSearchTerm(venue, normalizedAvailableSearch))
    }, [allVenues, selectedVenues, normalizedAvailableSearch])

    const filteredSelectedVenues = useMemo(() => {
        return selectedVenues.filter((venue) => venueMatchesSearchTerm(venue, normalizedSelectedSearch))
    }, [selectedVenues, normalizedSelectedSearch])

    const filteredGroups = useMemo(() => {
        if (!normalizedGroupSearch) return allVenueGroups
        return allVenueGroups.filter((group) => {
            const tokens = [
                group.name,
                group.groupId,
                ...(group.venues || []).map((venue) => venue.name),
            ]
            return tokens
                .filter(Boolean)
                .map(normalizeSearchValue)
                .some((token) => token.includes(normalizedGroupSearch))
        })
    }, [allVenueGroups, normalizedGroupSearch])

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                closeModal()
            }
        }
        if (showModal) {
            window.addEventListener("keydown", handleEscape)
        }
        return () => window.removeEventListener("keydown", handleEscape)
    }, [showModal])

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                setErrorState(null)

                const [venuesResponse, groupsResponse] = await Promise.all([
                    fetchVenuesForContext(context),
                    api.getVenueGroups({ limit: MAX_GROUPS_FETCH }),
                ])

                if (!venuesResponse.ok) {
                    throw new Error("Failed to fetch available venues")
                }
                if (!groupsResponse.ok) {
                    throw new Error("Failed to fetch venue groups")
                }

                const venuesPayload = await venuesResponse.json()
                const groupsPayload = await groupsResponse.json()

                const venuesData = venuesPayload.locations || venuesPayload.vacantLocations || venuesPayload.data || []
                const groupsData = groupsPayload.groups || groupsPayload.venueGroups || groupsPayload.data || []

                setAllVenues(transformVenues(venuesData))
                setAllVenueGroups(transformGroups(groupsData))
            } catch (err) {
                console.error(err)
                setErrorState(err.message || "Unexpected error while loading data")
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [context])

    const closeModal = () => {
        setShowModal(false)
        setGroupName("")
        setSelectedVenues([])
        setSelectedSearchTerm("")
        setAvailableSearchTerm("")
        setEditingGroup(null)
        setDraggedItem(null)
        setModalDragOverIndex(null)
    }

    const refreshGroups = async () => {
        const response = await api.getVenueGroups({ limit: MAX_GROUPS_FETCH })
        if (response.ok) {
            const groupsPayload = await response.json()
            const groupsData = groupsPayload.groups || groupsPayload.venueGroups || groupsPayload.data || []
            setAllVenueGroups(transformGroups(groupsData))
        }
    }

    const handleCreateGroup = useCallback(() => {
        setShowModal(true)
        setGroupName("")
        setSelectedVenues([])
        setEditingGroup(null)
        setAvailableSearchTerm("")
        setSelectedSearchTerm("")
    }, [])

    const hydrateGroupForEdit = useCallback(async (group) => {
        try {
            const response = await api.getVenueGroupById(group.groupId || group.id)
            if (response.ok) {
                const data = await response.json()
                if (data?.groups?.venues) {
                    return transformVenues(data.groups.venues)
                }
            }
        } catch (err) {
            console.warn("Failed to fetch detailed group info, falling back to cached data", err)
        }
        return transformVenues(group.venues || [])
    }, [])

    const handleEditGroup = useCallback(
        async (group) => {
            const venues = await hydrateGroupForEdit(group)
            setEditingGroup(group)
            setGroupName(group.name || "")
            setSelectedVenues(venues)
            setShowModal(true)
            setAvailableSearchTerm("")
            setSelectedSearchTerm("")
        },
        [hydrateGroupForEdit]
    )

    const handleDeleteGroup = async (group) => {
        if (isDeletingGroup === group.id) return
        const confirmDelete = window.confirm(`Are you sure you want to delete the venue group "${group.name}"?`)
        if (!confirmDelete) return

        try {
            setIsDeletingGroup(group.id)
            const response = await api.deleteVenueGroup(group.groupId || group.id)
            if (!response.ok) {
                throw new Error("Failed to delete venue group")
            }
            success("Venue group deleted")
            await refreshGroups()
        } catch (err) {
            console.error(err)
            error(err.message || "Unable to delete venue group")
        } finally {
            setIsDeletingGroup(null)
        }
    }

    useEffect(() => {
        if (!searchParams || queryHandledRef.current || allVenueGroups.length === 0) {
            return
        }

        const action = searchParams.get("action")
        const groupIdParam = searchParams.get("groupId")

        const clearQuery = () => {
            queryHandledRef.current = true
            if (typeof window !== "undefined") {
                router.replace(window.location.pathname)
            }
        }

        if (groupIdParam) {
            const targetGroup = allVenueGroups.find(
                (group) => String(group.groupId || group.id) === groupIdParam
            )
            if (targetGroup) {
                handleEditGroup(targetGroup)
                clearQuery()
            }
        } else if (action === "create") {
            handleCreateGroup()
            clearQuery()
        }
    }, [allVenueGroups, handleCreateGroup, handleEditGroup, router, searchParams])

    const handleModalDragStart = (event, venue) => {
        setDraggedItem(venue)
        event.dataTransfer.effectAllowed = "move"
    }

    const handleModalDragEnd = () => {
        setDraggedItem(null)
        setModalDragOverIndex(null)
    }

    const handleAvailableListDrop = (event) => {
        event.preventDefault()
        if (!draggedItem) return
        setSelectedVenues((prev) => prev.filter((venue) => venue.id !== draggedItem.id))
        setDraggedItem(null)
    }

    const handleModalDragOver = (event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
    }

    const removeVenueFromGroup = (venueId) => {
        setSelectedVenues((prev) => prev.filter((venue) => venue.id !== venueId))
    }

    const insertVenueAtIndex = (venues, venue, index) => {
        const next = [...venues]
        const clampedIndex = Math.max(0, Math.min(index, next.length))
        next.splice(clampedIndex, 0, venue)
        return next.map((item, idx) => ({
            ...item,
            priority: idx + 1,
        }))
    }

    const handleModalVenueDragOver = (event, index) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
        setModalDragOverIndex(index)
    }

    const handleModalVenueDrop = (event, index) => {
        event.preventDefault()
        if (!draggedItem) return

        setSelectedVenues((prev) => {
            const existingIndex = prev.findIndex((venue) => venue.id === draggedItem.id)
            if (existingIndex >= 0) {
                const reordered = [...prev]
                const [moved] = reordered.splice(existingIndex, 1)
                return insertVenueAtIndex(reordered, moved, index)
            }
            return insertVenueAtIndex(prev, draggedItem, index)
        })

        setDraggedItem(null)
        setModalDragOverIndex(null)
    }

    const handleAddVenue = (venue) => {
        setSelectedVenues((prev) => {
            if (prev.some((existing) => existing.id === venue.id)) return prev
            return [...prev, { ...venue, priority: prev.length + 1 }]
        })
    }

    const clearSelectedVenues = () => {
        setSelectedVenues([])
        setSelectedSearchTerm("")
    }

    const handleSaveGroup = async () => {
        if (selectedVenues.length === 0) {
            error("Please select at least one venue")
            return
        }

        if (!groupName.trim()) {
            error("Group name is required")
            return
        }

        const payloadVenues = selectedVenues.map((venue, index) => ({
            id: venue.id,
            priority: venue.priority || index + 1,
            name: venue.name,
            locationName: venue.locationName || venue.name,
            address: venue.address || "",
            latitude: venue.latitude || 0,
            longitude: venue.longitude || 0,
            machine: venue.machine || venue.raw?.machine || null,
        }))

        try {
            setIsSavingGroup(true)
            let response
            if (editingGroup) {
                response = await api.updateVenueGroup({
                    groupId: editingGroup.groupId || editingGroup.id,
                    groupName: groupName.trim(),
                    venues: payloadVenues,
                })
            } else {
                response = await api.createVenueGroup({
                    groupName: groupName.trim(),
                    venues: payloadVenues,
                })
            }

            if (!response.ok) {
                throw new Error("Failed to save venue group")
            }

            success(editingGroup ? "Venue group updated" : "Venue group created")
            closeModal()
            await refreshGroups()
        } catch (err) {
            console.error(err)
            error(err.message || "Unable to save venue group")
        } finally {
            setIsSavingGroup(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader />
            </div>
        )
    }

    if (errorState) {
        return (
            <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
                <h2 className="text-2xl font-semibold text-red-600">Oops, something went wrong</h2>
                <p className="text-gray-600">{errorState}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    Try again
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <p className="text-3xl font-bold text-black">{copy.title}</p>
                        <p className="text-slate-600 mt-2 max-w-2xl">{copy.subtitle}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-5 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={groupSearchTerm}
                                onChange={(event) => setGroupSearchTerm(event.target.value)}
                                placeholder="Search venue groups..."
                                className="w-full sm:w-64 pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>
                        <button
                            onClick={handleCreateGroup}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                        >
                            <Plus className="h-5 w-5" />
                            Create venue group
                        </button>
                    </div>
                </header>

                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredGroups.length === 0 ? (
                        <div className="md:col-span-2 xl:col-span-3">
                            <div className="border border-dashed border-slate-300 rounded-2xl bg-white py-16 text-center space-y-4">
                                <Users className="h-12 w-12 text-slate-300 mx-auto" />
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold text-slate-800">No venue groups yet</h3>
                                    <p className="text-slate-500 text-sm">
                                        {normalizedGroupSearch
                                            ? "Try adjusting your search or create a new group."
                                            : "Create your first venue group to organize routes more efficiently."}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCreateGroup}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    <Plus className="h-5 w-5" />
                                    Create venue group
                                </button>
                            </div>
                        </div>
                    ) : (
                        filteredGroups.map((group) => (
                            <article
                                key={group.id}
                                className="relative rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                                <MapPin className="h-5 w-5 text-blue-600" />
                                                {group.name}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {group.venues.length} venue{group.venues.length !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditGroup(group)}
                                                className="p-2 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
                                                title="Edit venue group"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteGroup(group)}
                                                disabled={isDeletingGroup === group.id}
                                                className="p-2 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Delete venue group"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {group.venues.slice(0, 4).map((venue) => (
                                            <div
                                                key={venue.id}
                                                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                                            >
                                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                                                    {venue.priority || 0}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate font-medium">{venue.name}</p>
                                                    {venue.locationName && venue.locationName !== venue.name && (
                                                        <p className="truncate text-xs text-slate-500">{venue.locationName}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {group.venues.length > 4 && (
                                            <p className="text-xs text-slate-500 mt-2">
                                                + {group.venues.length - 4} more venues
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </section>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-8">
                    <div
                        ref={modalRef}
                        className="relative flex h-[90vh] w-full max-w-6xl flex-col rounded-3xl bg-white shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
                                    {editingGroup ? "Update venue group" : "Create venue group"}
                                </p>
                                <h3 className="text-2xl font-semibold text-slate-900">
                                    {editingGroup ? editingGroup.name : "New venue group"}
                                </h3>
                            </div>
                            <button
                                onClick={closeModal}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex flex-1 flex-col lg:flex-row h-[90%]">
                            <div
                                className="lg:basis-2/5 border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto h-[90%]"
                                onDragOver={handleModalDragOver}
                                onDrop={handleAvailableListDrop}
                            >
                                <div className="px-6 py-5 space-y-4">
                                    <div>
                                        <h4 className="text-lg font-semibold text-slate-900">Available venues</h4>
                                        <p className="text-sm text-slate-500">
                                            Drag venues to the right or use the add button to include them in your group.
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={availableSearchTerm}
                                            onChange={(event) => setAvailableSearchTerm(event.target.value)}
                                            placeholder="Search available venues..."
                                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        {filteredAvailableVenues.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm text-slate-500">
                                                {normalizedAvailableSearch
                                                    ? `No venues found for "${availableSearchTerm.trim()}"`
                                                    : "No venues available"}
                                            </div>
                                        ) : (
                                            filteredAvailableVenues.map((venue) => (
                                                <div
                                                    key={venue.id}
                                                    draggable
                                                    onDragStart={(event) => handleModalDragStart(event, venue)}
                                                    onDragEnd={handleModalDragEnd}
                                                    className="rounded-xl border-2 border-transparent bg-white px-4 py-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-md cursor-move"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 space-y-1">
                                                            <p className="font-medium text-slate-900">{venue.name}</p>
                                                            {venue.locationName && venue.locationName !== venue.name && (
                                                                <p className="text-xs text-slate-500">{venue.locationName}</p>
                                                            )}
                                                            {venue.address && (
                                                                <p className="text-xs text-slate-400">{venue.address}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <span className="text-xs text-slate-400">
                                                                {venue.machine?.name || "No machine"}
                                                            </span>
                                                            <button
                                                                onClick={() => handleAddVenue(venue)}
                                                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 hover:border-blue-300 hover:bg-blue-100 transition-colors"
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                                Add
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="lg:basis-3/5 flex flex-col overflow-hidden">
                                <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-slate-200">
                                    <div>
                                        <h4 className="text-lg font-semibold text-slate-900">
                                            Selected venues ({selectedVenues.length})
                                        </h4>
                                        <p className="text-sm text-slate-500">
                                            Drag to reorder the stop priority inside the group.
                                        </p>
                                    </div>
                                    {selectedVenues.length > 0 && (
                                        <button
                                            onClick={clearSelectedVenues}
                                            className="text-xs font-semibold text-red-500 hover:text-red-600"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Group name</label>
                                        <input
                                            type="text"
                                            value={groupName}
                                            onChange={(event) => setGroupName(event.target.value)}
                                            placeholder="e.g. Downtown morning route"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={selectedSearchTerm}
                                            onChange={(event) => setSelectedSearchTerm(event.target.value)}
                                            placeholder="Search selected venues..."
                                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        />
                                    </div>

                                    <div
                                        className="min-h-[200px] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 space-y-3"
                                        onDragOver={handleModalDragOver}
                                        onDrop={(event) => handleModalVenueDrop(event, selectedVenues.length)}
                                    >
                                        {selectedVenues.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-2">
                                                <MapPin className="h-6 w-6" />
                                                <p>Drag venues here to add them to the group</p>
                                            </div>
                                        ) : filteredSelectedVenues.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-2">
                                                <MapPin className="h-6 w-6" />
                                                <p>No selected venues match your search</p>
                                            </div>
                                        ) : (
                                            filteredSelectedVenues.map((venue) => {
                                                const actualIndex = selectedVenues.findIndex((item) => item.id === venue.id)
                                                return (
                                                    <div key={venue.id} className="space-y-2">
                                                        {modalDragOverIndex === actualIndex && (
                                                        <div className="h-1 rounded-full bg-blue-500 transition-all"></div>
                                                        )}
                                                        <div
                                                            draggable
                                                            onDragStart={(event) => handleModalDragStart(event, venue)}
                                                            onDragEnd={handleModalDragEnd}
                                                            onDragOver={(event) => handleModalVenueDragOver(event, actualIndex)}
                                                            onDrop={(event) => handleModalVenueDrop(event, actualIndex)}
                                                            className="flex items-start justify-between gap-3 rounded-xl border-2 border-transparent bg-white px-4 py-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-md cursor-move"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                                                                    {venue.priority || actualIndex + 1}
                                                                </span>
                                                                <div className="space-y-1">
                                                                    <p className="font-medium text-slate-900">{venue.name}</p>
                                                                    {venue.locationName && venue.locationName !== venue.name && (
                                                                        <p className="text-xs text-slate-500">
                                                                            {venue.locationName}
                                                                        </p>
                                                                    )}
                                                                    {venue.address && (
                                                                        <p className="text-xs text-slate-400">{venue.address}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeVenueFromGroup(venue.id)}
                                                                className="rounded-lg border border-transparent p-2 text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                                    <button
                                        onClick={closeModal}
                                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveGroup}
                                        disabled={isSavingGroup || selectedVenues.length === 0 || !groupName.trim()}
                                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSavingGroup ? (
                                            <>
                                                <svg
                                                    className="h-4 w-4 animate-spin text-white"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                                    ></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                {editingGroup ? "Update venue group" : "Create venue group"}
                                            </>
                                        )}
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

