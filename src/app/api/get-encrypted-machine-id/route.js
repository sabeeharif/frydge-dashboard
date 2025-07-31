import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const machineId = searchParams.get("machineId") || "10"

    console.log("API Route - Fetching encrypted machine ID for:", { machineId })

    // const apiUrl = `https://vendlive.com/api/2.0/machines/?page=${page}&pageSize=${pageSize}`
    const apiUrl = `https://lzt46wo8hf.execute-api.eu-central-1.amazonaws.com/Prod/frydge/machine_internal/qrlink/${machineId}`
    console.log("API URL:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        accept: "application/json"
      },
    })

    console.log("External API Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("External API Error:", errorText)
      return NextResponse.json(
        { error: `External API error: ${response.status} - ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("External API Success :", data)

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("API Route Error:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}