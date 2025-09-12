import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "10"
    const lastKey = searchParams.get("lastKey")
    const userId = searchParams.get("userId")

    // Build the API URL for the new dashboard users endpoint
    let apiUrl = `https://1ckizfb3b3.execute-api.eu-central-1.amazonaws.com/Dev/frydge/dashboard_users?limit=${limit}`

    if (lastKey && lastKey !== "null") {
      apiUrl += `&lastKey=${encodeURIComponent(lastKey)}`
    }

    if (userId) {
      apiUrl += `&userId=${encodeURIComponent(userId)}`
    }

    console.log("Fetching users from:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "ZnJ5ZGdlQDEyMzQhQCM=",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Dashboard Users API Error:", errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Dashboard Users API Response:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Users Route Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request) {
  try {
    const body = await request.json()
    console.log("Creating user with data:", JSON.stringify(body, null, 2))

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "dsbEmail",
      "dsbPassword",
      "dsbConfirmPassword",
      "vlEmail",
      "vlPassword",
      "vlConfirmPassword",
      "dsbUserRole",
    ]

    const missingFields = requiredFields.filter((field) => !body[field])
    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(", ")}` }, { status: 400 })
    }

    // Validate password confirmation
    if (body.dsbPassword !== body.dsbConfirmPassword) {
      return NextResponse.json({ error: "Dashboard passwords do not match" }, { status: 400 })
    }

    if (body.vlPassword !== body.vlConfirmPassword) {
      return NextResponse.json({ error: "VendLive passwords do not match" }, { status: 400 })
    }

    const response = await fetch(
      "https://1ckizfb3b3.execute-api.eu-central-1.amazonaws.com/Dev/frydge/dashboard_users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "ZnJ5ZGdlQDEyMzQhQCM=",
        },
        body: JSON.stringify({
          firstName: body.firstName,
          lastName: body.lastName,
          dsbEmail: body.dsbEmail,
          dsbPassword: body.dsbPassword,
          dsbConfirmPassword: body.dsbConfirmPassword,
          vlEmail: body.vlEmail,
          vlPassword: body.vlPassword,
          vlConfirmPassword: body.vlConfirmPassword,
          dsbUserRole: body.dsbUserRole,
          isOperator: Boolean(body.isOperator),
          isAccountOwner: Boolean(body.isAccountOwner),
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Create User API Error:", response.status, errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Create User Success:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Create User Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update existing user
export async function PUT(request) {
  try {
    const body = await request.json()
    console.log("Updating user with data:", JSON.stringify(body, null, 2))

    // Validate required userId
    if (!body.userId) {
      return NextResponse.json({ error: "userId is required for updating user" }, { status: 400 })
    }

    const response = await fetch(
      "https://1ckizfb3b3.execute-api.eu-central-1.amazonaws.com/Dev/frydge/dashboard_users",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "ZnJ5ZGdlQDEyMzQhQCM=",
        },
        body: JSON.stringify(body),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Update User API Error:", response.status, errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Update User Success:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Update User Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete user
export async function DELETE(request) {
  try {
    const body = await request.json()
    console.log("Deleting user with data:", JSON.stringify(body, null, 2))

    // Validate required userId
    if (!body.userId) {
      return NextResponse.json({ error: "userId is required for deleting user" }, { status: 400 })
    }

    const response = await fetch(
      "https://1ckizfb3b3.execute-api.eu-central-1.amazonaws.com/Dev/frydge/dashboard_users",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "ZnJ5ZGdlQDEyMzQhQCM=",
        },
        body: JSON.stringify({
          userId: body.userId,
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Delete User API Error:", response.status, errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("Delete User Success:", data)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Delete User Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
