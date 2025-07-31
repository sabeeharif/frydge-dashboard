import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "1"
    const pageSize = searchParams.get("pageSize") || "10"
    const accountId = searchParams.get("account_id") || "121" // default fallback

    const apiUrl = `https://vendlive.com/api/2.0/users/?account_id=${accountId}&page=${page}&pageSize=${pageSize}`
    console.log("Fetching users:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Token ${process.env.VENDLIVE_API_TOKEN}`,
        Cookie: "csrftoken=a6ljPcBqekHldi9e7ityilrnaQNlFzK5; sessionid=sqexgg3akmvaw056rjp2ktisf5auwvku",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("User API Error:", errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error("Users Route Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
