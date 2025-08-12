"use client"
import { useState, useEffect } from "react"
import { Search, MapPin, User, Navigation, Clock, Package } from "lucide-react"

export default function RoutesPage() {
  const [machineLocations, setMachineLocations] = useState([])
  const [users, setUsers] = useState([])
  const [selectedRider, setSelectedRider] = useState(null)
  const [selectedLocations, setSelectedLocations] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [locationSearchTerm, setLocationSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState("")
  const [showRiderDropdown, setShowRiderDropdown] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)

  // Fetch machine locations and users
  useEffect(() => {
    fetchMachineLocations()
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await fetch("/api/users?pageSize=50")

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.results || data || [])
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Failed to load users")
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchMachineLocations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/routes")

      if (!response.ok) {
        throw new Error("Failed to fetch machine locations")
      }

      const data = await response.json()
      setMachineLocations(data.results || data || [])
    } catch (err) {
      console.error("Error fetching machine locations:", err)
      setError("Failed to load machine locations")
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Filter locations based on search term
  const filteredLocations = machineLocations.filter(
    (location) =>
      location.name?.toLowerCase().includes(locationSearchTerm.toLowerCase()) ||
      location.address?.toLowerCase().includes(locationSearchTerm.toLowerCase()),
  )

  const handleRiderSelect = (user) => {
    setSelectedRider(user)
    setSearchTerm(`${user.firstName} ${user.lastName}`.trim())
    setShowRiderDropdown(false)
  }

  const handleLocationSelect = (location) => {
    if (!selectedLocations.find((loc) => loc.id === location.id)) {
      setSelectedLocations([...selectedLocations, location])
    }
    setLocationSearchTerm("")
    setShowLocationDropdown(false)
  }

  const removeLocation = (locationId) => {
    setSelectedLocations(selectedLocations.filter((loc) => loc.id !== locationId))
  }

  const moveLocationUp = (index) => {
    if (index > 0) {
      const newLocations = [...selectedLocations]
      const temp = newLocations[index]
      newLocations[index] = newLocations[index - 1]
      newLocations[index - 1] = temp
      setSelectedLocations(newLocations)
    }
  }

  const moveLocationDown = (index) => {
    if (index < selectedLocations.length - 1) {
      const newLocations = [...selectedLocations]
      const temp = newLocations[index]
      newLocations[index] = newLocations[index + 1]
      newLocations[index + 1] = temp
      setSelectedLocations(newLocations)
    }
  }

  // Generate Google Maps iframe URL for individual location
  const generateGoogleMapUrl = (location) => {
    const query = encodeURIComponent(`${location.latitude},${location.longitude}`)
    return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${query}&zoom=15`
  }

  // Generate Google Maps iframe URL without API key (using search)
  const generateGoogleMapUrlNoKey = (location) => {
    const query = encodeURIComponent(location.address || `${location.latitude},${location.longitude}`)
    return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`
  }

  return (
    <div className="bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Compact Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Navigation className="h-6 w-6 text-blue-600" />
            <p className="text-gray-800">Route Management</p>
          </h1>
        </div>

        {/* Single Column Layout */}
        <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
          {/* Rider and Location Selection - Single Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rider Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="h-4 w-4 text-blue-600" />
                Select Rider
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search riders..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowRiderDropdown(true)
                  }}
                  onFocus={() => setShowRiderDropdown(true)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                {showRiderDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="px-3 py-2 text-gray-500 text-sm">Loading users...</div>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleRiderSelect(user)}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">
                                {`${user.firstName || ""} ${user.lastName || ""}`.trim()}
                              </div>
                              <div className="text-blue-600 text-xs">{user.email}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-sm">No users found</div>
                    )}
                  </div>
                )}
              </div>

              {selectedRider && (
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-blue-600" />
                    <span className="font-medium text-blue-900 text-sm">
                      {`${selectedRider.firstName || ""} ${selectedRider.lastName || ""}`.trim()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Location Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4 text-green-600" />
                Add Locations
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={locationSearchTerm}
                  onChange={(e) => {
                    setLocationSearchTerm(e.target.value)
                    setShowLocationDropdown(true)
                  }}
                  onFocus={() => setShowLocationDropdown(true)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />

                {showLocationDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {loading ? (
                      <div className="px-3 py-2 text-gray-500 text-sm">Loading...</div>
                    ) : filteredLocations.length > 0 ? (
                      filteredLocations.map((location) => (
                        <div
                          key={location.id}
                          onClick={() => handleLocationSelect(location)}
                          className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900 text-sm">
                            {location.name || `Location ${location.id}`}
                          </div>
                          <div className="text-gray-600 text-xs truncate">{location.address || "No address"}</div>
                          <div className="text-gray-500 text-xs">
                            📍 {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-sm">No locations found</div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-xs">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Routes Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Navigation className="h-4 w-4 text-purple-600" />
                Today's Routes
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{selectedLocations.length} stops</span>
                </div>
                <span>Est: {selectedLocations.length * 30}min</span>
              </div>
            </div>

            {/* Routes Container with Individual Maps */}
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              {selectedLocations.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No routes added</p>
                </div>
              ) : (
                <div className={`space-y-4 ${selectedLocations.length > 3 ? "max-h-96 overflow-y-auto pr-2" : ""}`}>
                  {selectedLocations.map((location, index) => (
                    <div
                      key={location.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      {/* Location Header */}
                      <div className="p-3 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          {/* Step Number */}
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>

                          {/* Location Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-base">
                              {location.name || `Location ${location.id}`}
                            </h4>
                            <p className="text-gray-600 text-sm">{location.address || "No address available"}</p>
                            <p className="text-gray-500 text-xs">
                              📍 {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => moveLocationUp(index)}
                              disabled={index === 0}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveLocationDown(index)}
                              disabled={index === selectedLocations.length - 1}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                              title="Move down"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => removeLocation(location.id)}
                              className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Google Maps Iframe */}
                      <div className="h-64">
                        <iframe
                          src={generateGoogleMapUrlNoKey(location)}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen=""
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title={`Map for ${location.name || "Location"}`}
                        ></iframe>
                      </div>

                      {/* Location Details Footer */}
                      <div className="p-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>
                            Stop {index + 1} of {selectedLocations.length}
                          </span>
                          <span>Est. arrival: {(index + 1) * 30} min</span>
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
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                disabled={selectedLocations.length === 0 || !selectedRider}
              >
                <Navigation className="h-4 w-4" />
                Save Route
              </button>
              <button
                onClick={() => setSelectedLocations([])}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
