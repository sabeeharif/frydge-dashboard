import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get("machineId");

    if (!machineId) {
      return NextResponse.json({ error: "Missing machineId" }, { status: 400 });
    }

    const apiUrl = `https://tngndxywc1.execute-api.eu-central-1.amazonaws.com/Dev/frydge/machine_internal/qrlink/${machineId}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("External API Error:", errorText);
      return NextResponse.json(
        { error: `External API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
