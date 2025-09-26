import { NextResponse } from "next/server";
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

    const response = await fetch("https://vendlive.com/api/1.0/get-machine-locations/?format=json", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${session.authToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Machine Locations API Error:", errorText);
      return NextResponse.json(
        { error: `API error: ${response.status}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Machine Locations API Route Error:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` }, 
      { status: 500 }
    );
  }
}
