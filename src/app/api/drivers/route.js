import { NextResponse } from "next/server"

const API_BASE_URL = "https://1ckizfb3b3.execute-api.eu-central-1.amazonaws.com/Dev/frydge/dashboard_users/drivers"
const AUTH_TOKEN = "ZnJ5ZGdlQDEyMzQhQCM="

export async function GET(request) {
  try {
    console.log("Fetching drivers from:", API_BASE_URL)

    const response = await fetch(API_BASE_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Drivers API Error:", response.status, errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Drivers API Response:", data)
    
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Drivers API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
