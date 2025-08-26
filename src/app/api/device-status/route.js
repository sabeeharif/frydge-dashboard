import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";

export async function GET(request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");
    const machineId = searchParams.get("machineId");

    if (!deviceId || !machineId) {
      return NextResponse.json(
        { error: "deviceId and machineId are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://vendlive.com/api/2.0/devices/${deviceId}/?machineId=${machineId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${session.authToken}`,
          accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Device Status API Error:", errorText);
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Device Status API Route Error:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
