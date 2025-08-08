import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const response = await fetch("https://vendlive.com/api/1.0/get-machine-locations/?format=json", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Token e91c470f2413536befad8ae6df34541e5dff5b2e",
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
