import { NextResponse } from "next/server"

const API_BASE_URL = "https://tngndxywc1.execute-api.eu-central-1.amazonaws.com/Dev/frydge/cleaner_routes/vacant_locations"
const AUTH_TOKEN = "ZnJ5ZGdlQDEyMzQhQCM="

// GET - Fetch cleaner vacant locations
export async function GET(request) {
  try {
    console.log("Fetching cleaner vacant locations from:", API_BASE_URL)

    const response = await fetch(API_BASE_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Cleaner Vacant Locations API Error:", errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Cleaner Vacant Locations API Response:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Cleaner Vacant Locations Route Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

