import { NextResponse } from "next/server"

const API_BASE_URL = "https://tngndxywc1.execute-api.eu-central-1.amazonaws.com/Dev/frydge/venue_group"
const AUTH_TOKEN = "ZnJ5ZGdlQDEyMzQhQCM="

// GET - Fetch venue groups
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "10"
    const lastKey = searchParams.get("lastKey")
    const search = searchParams.get("search")

    // Build the API URL with parameters
    const params = new URLSearchParams()
    params.append("limit", limit)
    
    if (lastKey) {
      params.append("lastKey", lastKey)
    }
    
    if (search) {
      params.append("search", search)
    }

    const apiUrl = `${API_BASE_URL}?${params.toString()}`
    console.log("Fetching venue groups from:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": AUTH_TOKEN,
      },
    })

    // Handle authentication errors
    if (response.status === 401 || response.status === 403 || response.status === 400) {
      console.error("Venue Group API Authentication Error:", response.status)
      return NextResponse.json(
        { error: "Authentication failed", requiresLogin: true },
        { status: 401 }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Venue Group API Error:", errorText)
      return NextResponse.json(
        { error: `API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("Venue Group API Response:", data)

    // Transform the response to match frontend expectations
    const transformedResponse = {
      venueGroups: data.venueGroupData || data.data || [],
      lastKey: data.lastKey || null,
      hasMore: !!data.lastKey,
      message: data.message || "Venue groups retrieved",
      total: data.total || data.venueGroupData?.length || data.data?.length || 0,
    }

    return NextResponse.json(transformedResponse, { status: 200 })
  } catch (error) {
    console.error("Venue Group API Route Error:", error)
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    )
  }
}

// POST - Create venue group
export async function POST(request) {
  try {
    const body = await request.json()
    console.log("Creating venue group with data:", body)

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": AUTH_TOKEN,
      },
      body: JSON.stringify(body),
    })

    // Handle authentication errors
    if (response.status === 401 || response.status === 403 || response.status === 400) {
      console.error("Venue Group Creation Authentication Error:", response.status)
      return NextResponse.json(
        { error: "Authentication failed", requiresLogin: true },
        { status: 401 }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Venue Group Creation API Error:", errorText)
      return NextResponse.json(
        { error: `API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("Venue Group Creation Response:", data)

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Venue Group Creation Route Error:", error)
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    )
  }
}
