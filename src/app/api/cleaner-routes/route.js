import { NextResponse } from "next/server"

const API_BASE_URL = "https://tngndxywc1.execute-api.eu-central-1.amazonaws.com/Dev/frydge/cleaner_routes"
const AUTH_TOKEN = "ZnJ5ZGdlQDEyMzQhQCM="

// GET - Fetch routes (all or specific by routeId)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const routeId = searchParams.get("routeId")
    const limit = searchParams.get("limit") || "10"
    const lastKey = searchParams.get("lastKey")
    const userId = searchParams.get("userId")
    const fetchAll = searchParams.get("fetchAll") === "true"
    const search = searchParams.get("search")

    // If fetchAll is true, we'll fetch all routes by iterating through pages
    if (fetchAll) {
      const allRoutes = []
      let currentLastKey = null

      do {
        const params = new URLSearchParams()
        if (routeId) params.append("routeId", routeId)
        if (userId) params.append("userId", userId)
        if (search) params.append("search", search)
        params.append("limit", "50") // Use larger limit for bulk fetching
        if (currentLastKey) params.append("lastKey", currentLastKey)
        // Add timestamp to force fresh data
        params.append("_t", Date.now().toString())

        const url = `${API_BASE_URL}?${params.toString()}`
        console.log("Fetching cleaner routes from URL:", url)

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: AUTH_TOKEN,
            // Add cache busting headers
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Get Cleaner Routes API Error:", response.status, errorText)
          return NextResponse.json({ error: errorText }, { status: response.status })
        }

        const data = await response.json()

        // Add routes to our collection - handle cleanerRoutes response
        if (data.cleanerRoutes && Array.isArray(data.cleanerRoutes)) {
          allRoutes.push(...data.cleanerRoutes)
        } else if (data.routes && Array.isArray(data.routes)) {
          allRoutes.push(...data.routes)
        } else if (Array.isArray(data)) {
          allRoutes.push(...data)
        }

        // Update lastKey for next iteration
        currentLastKey = data.lastKey
      } while (currentLastKey)

      let filteredRoutes = allRoutes
      if (search) {
        const searchLower = search.toLowerCase()
        filteredRoutes = allRoutes.filter((route) => {
          return (
            route.routeName?.toLowerCase().includes(searchLower) ||
            route.cleanerName?.toLowerCase().includes(searchLower) ||
            route.cleanerEmail?.toLowerCase().includes(searchLower) ||
            route.name?.toLowerCase().includes(searchLower) ||
            route.email?.toLowerCase().includes(searchLower)
          )
        })
      }

      return NextResponse.json({ routes: filteredRoutes, totalCount: filteredRoutes.length }, { status: 200 })
    }

    // Regular paginated request
    const params = new URLSearchParams()
    if (routeId) params.append("routeId", routeId)
    if (userId) params.append("userId", userId)
    if (search) params.append("search", search)
    params.append("limit", limit)
    if (lastKey && lastKey !== "null") params.append("lastKey", lastKey)
    // Add timestamp to force fresh data
    params.append("_t", Date.now().toString())

    const url = `${API_BASE_URL}?${params.toString()}`
    console.log("Fetching cleaner routes from URL:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
        // Add cache busting headers
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Get Cleaner Routes API Error:", response.status, errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()

    // Handle search filtering - check for both cleanerRoutes and routes
    if (search) {
      const searchLower = search.toLowerCase()
      if (data.cleanerRoutes && Array.isArray(data.cleanerRoutes)) {
        data.cleanerRoutes = data.cleanerRoutes.filter((route) => {
          return (
            route.routeName?.toLowerCase().includes(searchLower) ||
            route.cleanerName?.toLowerCase().includes(searchLower) ||
            route.cleanerEmail?.toLowerCase().includes(searchLower) ||
            route.name?.toLowerCase().includes(searchLower) ||
            route.email?.toLowerCase().includes(searchLower)
          )
        })
      } else if (data.routes && Array.isArray(data.routes)) {
        data.routes = data.routes.filter((route) => {
          return (
            route.routeName?.toLowerCase().includes(searchLower) ||
            route.cleanerName?.toLowerCase().includes(searchLower) ||
            route.cleanerEmail?.toLowerCase().includes(searchLower) ||
            route.name?.toLowerCase().includes(searchLower) ||
            route.email?.toLowerCase().includes(searchLower)
          )
        })
      }
    }

    console.log("Cleaner Routes API Response:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Get Cleaner Routes Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new route
export async function POST(request) {
  try {
    const body = await request.json()
    console.log("Creating cleaner route with data:", JSON.stringify(body, null, 2))

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Create Cleaner Route API Error:", response.status, errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Create Cleaner Route Success:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Create Cleaner Route Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update existing route
export async function PUT(request) {
  try {
    const body = await request.json()
    console.log("Updating cleaner route with data:", JSON.stringify(body, null, 2))

    const response = await fetch(API_BASE_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Update Cleaner Route API Error:", response.status, errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Update Cleaner Route Success:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Update Cleaner Route Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete route
export async function DELETE(request) {
  try {
    const body = await request.json()
    console.log("Deleting cleaner route with data:", JSON.stringify(body, null, 2))

    const response = await fetch(API_BASE_URL, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Delete Cleaner Route API Error:", response.status, errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Delete Cleaner Route Success:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Delete Cleaner Route Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

