import { NextResponse } from "next/server"
import { getSession } from "@/app/lib/session";

export async function GET(request) {
  try {
    // Get session and check authentication
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.authToken) {
      return NextResponse.json(
        { error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

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
        Authorization: `Token ${session.authToken}`,
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