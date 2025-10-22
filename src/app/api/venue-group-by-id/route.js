import { NextResponse } from "next/server"

const API_BASE_URL = "https://tngndxywc1.execute-api.eu-central-1.amazonaws.com/Dev/frydge/venue_group"
const AUTH_TOKEN = "ZnJ5ZGdlQDEyMzQhQCM="

// GET - Fetch venue group by ID
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get("groupId")

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId parameter is required" },
        { status: 400 }
      )
    }

    // Build the API URL with groupId parameter
    const params = new URLSearchParams()
    params.append("groupId", groupId)

    const apiUrl = `${API_BASE_URL}?${params.toString()}`
    console.log("Fetching venue group by ID from:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": AUTH_TOKEN,
      },
    })

    // Handle authentication errors
    if (response.status === 401 || response.status === 403 || response.status === 400) {
      console.error("Venue Group by ID API Authentication Error:", response.status)
      return NextResponse.json(
        { error: "Authentication failed", requiresLogin: true },
        { status: 401 }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Venue Group by ID API Error:", errorText)
      return NextResponse.json(
        { error: `API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("Venue Group by ID API Response:", data)

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Venue Group by ID API Route Error:", error)
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    )
  }
}
