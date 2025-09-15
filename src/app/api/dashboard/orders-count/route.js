import { NextResponse } from "next/server"
import { getSession } from "@/app/lib/session"

export async function GET(request) {
  try {
    const session = await getSession()

    if (!session || !session.authToken) {
      return NextResponse.json({ error: "Unauthorized", requiresLogin: true }, { status: 401 })
    }

    console.log("Fetching orders count from dashboard API...")

    const response = await fetch("https://1ckizfb3b3.execute-api.eu-central-1.amazonaws.com/Dev/frydge/orders/count", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "ZnJ5ZGdlQDEyMzQhQCM=",
      },
    })

    // Handle authentication errors
    if (response.status === 401 || response.status === 403 || response.status === 400) {
      console.error("Orders Count API Authentication Error:", response.status)
      return NextResponse.json({ error: "Authentication failed", requiresLogin: true }, { status: 401 })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Orders Count API Error:", errorText)
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log("Orders Count API Response:", data)

    // Transform the response to match frontend expectations
    const transformedResponse = {
      totalOrders: data.totalOrders || data.count || 0,
      message: data.message || "Orders count retrieved successfully",
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(transformedResponse, { status: 200 })
  } catch (error) {
    console.error("Orders Count API Route Error:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}
