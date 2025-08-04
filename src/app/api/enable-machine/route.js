import { NextResponse } from "next/server"

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { machineId, enabled, removeOrders } = body

    // Basic validation
    if (!machineId || enabled === undefined || removeOrders === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const apiResponse = await fetch('https://1ckizfb3b3.execute-api.eu-central-1.amazonaws.com/Dev/frydge/machine_internal/enable', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'ZnJ5ZGdlQDEyMzQhQCM=' // hardcoded token
      },
      body: JSON.stringify({
        machineId,
        enabled,
        removeOrders
      })
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error("Enable Machine API Error:", errorText)
      return NextResponse.json({ error: `API error: ${apiResponse.status}` }, { status: apiResponse.status })
    }

    const data = await apiResponse.json()
    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error("Enable Machine API Route Error:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}
