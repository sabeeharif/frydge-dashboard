import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const response = await fetch(
      "https://tngndxywc1.execute-api.eu-central-1.amazonaws.com/Dev/frydge/driver_routes/vacant_locations",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "ZnJ5ZGdlQDEyMzQhQCM=",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Vacant Locations API Error:", errorText)
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Vacant Locations API Route Error:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}
