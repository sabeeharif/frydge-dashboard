import { NextResponse } from "next/server"

const API_BASE_URL = "https://1ckizfb3b3.execute-api.eu-central-1.amazonaws.com/Dev/frydge/driver_routes"
const AUTH_TOKEN = "ZnJ5ZGdlQDEyMzQhQCM="

// GET - Fetch routes (all or specific by routeId)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const routeId = searchParams.get("routeId")

    let url = API_BASE_URL
    if (routeId) {
      url += `?routeId=${routeId}`
    }

    console.log("Fetching from URL:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Get Routes API Error:", response.status, errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Routes API Response:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Get Routes Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new route
export async function POST(request) {
  try {
    const body = await request.json()
    console.log("Creating route with data:", JSON.stringify(body, null, 2))

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
      console.error("Create Route API Error:", response.status, errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Create Route Success:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Create Route Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update existing route
export async function PUT(request) {
  try {
    const body = await request.json()
    console.log("Updating route with data:", JSON.stringify(body, null, 2))

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
      console.error("Update Route API Error:", response.status, errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Update Route Success:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Update Route Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete route
export async function DELETE(request) {
  try {
    const body = await request.json()
    console.log("Deleting route with data:", JSON.stringify(body, null, 2))

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
      console.error("Delete Route API Error:", response.status, errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Delete Route Success:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Delete Route Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
