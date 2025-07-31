import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const machineId = searchParams.get("machineId")

    if (!machineId) {
      return NextResponse.json({ error: "Machine ID is required" }, { status: 400 })
    }

    console.log("Fetching venue data for machine:", machineId)

    const response = await fetch(`https://frydge.com/testing2/vlCalls/venueMachineIdGET.php?machineId=${machineId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Venue API Error:", errorText)
      return NextResponse.json({ error: `Venue API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log("Venue API Success:", data)

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Venue API Route Error:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}
