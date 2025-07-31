import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "1"
    const pageSize = searchParams.get("pageSize") || "10"

    console.log("API Route - Fetching machines with params:", { page, pageSize })

    const apiUrl = `https://vendlive.com/api/2.0/machines/?page=${page}&pageSize=${pageSize}`
    console.log("API URL:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: "Token e91c470f2413536befad8ae6df34541e5dff5b2e",
        Cookie: "csrftoken=a6ljPcBqekHldi9e7ityilrnaQNlFzK5; sessionid=sqexgg3akmvaw056rjp2ktisf5auwvku",
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
    console.log("External API Success - Count:", data.count)

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("API Route Error:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}