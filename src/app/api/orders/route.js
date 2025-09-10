import { NextResponse } from "next/server"
import { getSession } from "@/app/lib/session"

export async function GET(request) {
  try {
    const session = await getSession()

    if (!session || !session.authToken) {
      return NextResponse.json({ error: "Unauthorized", requiresLogin: true }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "10"
    const lastKey = searchParams.get("lastKey")
    const search = searchParams.get("search")

    // Build the API URL
    let apiUrl = `https://1ckizfb3b3.execute-api.eu-central-1.amazonaws.com/Dev/frydge/orders?limit=${limit}`

    if (lastKey) {
      apiUrl += `&lastKey=${encodeURIComponent(lastKey)}`
    }

    if (search) {
      apiUrl += `&search=${encodeURIComponent(search)}`
    }

    console.log("Fetching orders from:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "ZnJ5ZGdlQDEyMzQhQCM=",
      },
    })

    // Handle authentication errors
    if (response.status === 401 || response.status === 403 || response.status === 400) {
      console.error("Orders API Authentication Error:", response.status)
      return NextResponse.json({ error: "Authentication failed", requiresLogin: true }, { status: 401 })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Orders API Error:", errorText)
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log("Orders API Response:", data)

    // Transform the response to match frontend expectations
    const transformedResponse = {
      orders: data.orderData || [],
      lastKey: data.lastKey || null,
      hasMore: !!data.lastKey,
      message: data.message || "Orders retrieved",
      total: data.total || data.orderData?.length || 0,
    }

    return NextResponse.json(transformedResponse, { status: 200 })
  } catch (error) {
    console.error("Orders API Route Error:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}
